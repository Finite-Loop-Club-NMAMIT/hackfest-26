let isAnimating = false;

interface WaveLayer {
  colorStart: string;
  colorEnd: string;
  offset: number;
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  wobbleSpeed: number;
  wobbleAmp: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export function triggerWaveTransition(
  onMidpoint: () => void,
  onProgress?: (progress: number) => void,
): void {
  if (isAnimating) return;
  isAnimating = true;

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: "99999",
    pointerEvents: "none",
  });

  const dpr = window.devicePixelRatio || 1;

  const updateSize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  };

  updateSize();
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    isAnimating = false;
    return;
  }

  const layers: WaveLayer[] = [
    {
      colorStart: "rgba(8, 56, 70, 0.45)",
      colorEnd: "rgba(4, 30, 45, 0.65)",
      offset: 150,
      amplitude: 60,
      frequency: 0.008,
      speed: 0.003,
      phase: 0,
      wobbleSpeed: 0.002,
      wobbleAmp: 20,
    },
    {
      colorStart: "rgba(14, 100, 120, 0.4)",
      colorEnd: "rgba(6, 55, 80, 0.6)",
      offset: 80,
      amplitude: 50,
      frequency: 0.012,
      speed: 0.005,
      phase: 2,
      wobbleSpeed: 0.003,
      wobbleAmp: 15,
    },
    {
      colorStart: "rgba(40, 170, 185, 0.35)",
      colorEnd: "rgba(15, 90, 130, 0.55)",
      offset: 0,
      amplitude: 40,
      frequency: 0.015,
      speed: 0.007,
      phase: 4,
      wobbleSpeed: 0.004,
      wobbleAmp: 10,
    },
  ];

  const particles: Particle[] = [];
  const startTime = performance.now();
  const duration = 2000;
  let midpointFired = false;

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

  const frame = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    if (onProgress) {
      const bgProgress =
        progress > 0.55 ? easeInOutCubic((progress - 0.55) / 0.45) : 0;
      onProgress(bgProgress);
    }

    let level: number;

    if (progress <= 0.4) {
      const p = easeInOutCubic(progress / 0.4);
      level = h + 200 - p * (h + 400);
    } else if (progress <= 0.55) {
      level = -200;
      if (!midpointFired) {
        midpointFired = true;
        onMidpoint();
      }
    } else {
      const p = easeInOutCubic((progress - 0.55) / 0.45);
      level = -200 + p * (h + 400);
    }

    {
      const underlayLevel = level;

      const underlayOpacity =
        progress <= 0.4
          ? easeInOutCubic(progress / 0.4)
          : progress <= 0.55
            ? 1
            : 1 - easeInOutCubic((progress - 0.55) / 0.45);

      if (underlayOpacity > 0) {
        ctx.save();
        ctx.globalAlpha = underlayOpacity;
        ctx.fillStyle = "rgb(4, 30, 45)";
        ctx.fillRect(0, underlayLevel, w, h - underlayLevel);
        ctx.restore();
      }
    }

    layers.forEach((layer) => {
      const currentLevel = level + layer.offset;

      ctx.beginPath();
      ctx.moveTo(0, h);

      for (let x = 0; x <= w; x += 10) {
        const y =
          currentLevel +
          Math.sin(x * layer.frequency + elapsed * layer.speed + layer.phase) *
            layer.amplitude +
          Math.sin(x * (layer.frequency * 2) + elapsed * layer.wobbleSpeed) *
            layer.wobbleAmp;

        ctx.lineTo(x, y);

        if (progress < 0.9 && Math.random() < 0.05 && y < h) {
          spawnParticle(x, y, particles);
        }
      }

      ctx.lineTo(w, h);
      ctx.lineTo(0, h);

      const grad = ctx.createLinearGradient(0, currentLevel - 100, 0, h);
      grad.addColorStop(0, layer.colorStart);
      grad.addColorStop(1, layer.colorEnd);

      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 3;
      ctx.shadowColor = "rgba(180, 230, 240, 0.3)";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    updateAndDrawParticles(ctx, particles, h);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
      isAnimating = false;
    }
  };

  requestAnimationFrame(frame);
}

function spawnParticle(x: number, y: number, particles: Particle[]) {
  particles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 2,
    vy: -(Math.random() * 2 + 1),
    size: Math.random() * 3 + 1,
    life: 1.0,
    maxLife: 1.0,
    alpha: Math.random() * 0.5 + 0.3,
  });
}

function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  limitY: number,
) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;
    p.alpha -= 0.01;

    if (p.life <= 0 || p.y > limitY) {
      particles.splice(i, 1);
      continue;
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, p.alpha)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}