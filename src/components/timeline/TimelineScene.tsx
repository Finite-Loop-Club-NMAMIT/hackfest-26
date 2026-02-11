'use client';

import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, useCursor } from '@react-three/drei';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { events } from '~/constants/timeline';

extend({ Water });

// Day colors for event labels
const DAY_THEMES: Record<number, { parchment: string; border: string; ink: string; wax: string; icon: string }> = {
  1: { parchment: '#f0e6d2', border: '#8B4513', ink: '#2A1A0A', wax: '#aa2222', icon: '⚓' },
  2: { parchment: '#e8dac0', border: '#654321', ink: '#2A1A0A', wax: '#e69b00', icon: '⚔️' },
  3: { parchment: '#e3dcd2', border: '#556B2F', ink: '#2A1A0A', wax: '#228822', icon: '💎' },
};

// ─── Ocean with Water Shader ─────────────────────────────────────────────────
function Ocean() {
  const waterRef = useRef<any>(null);
  const waterGeometry = useMemo(() => new THREE.PlaneGeometry(3000, 3000), []);

  const sunDirection = useMemo(() => {
    const dir = new THREE.Vector3();
    const theta = Math.PI * (0.45 - 0.5);
    const phi = 2 * Math.PI * (0.205 - 0.5);
    dir.x = Math.cos(phi);
    dir.y = Math.sin(theta);
    dir.z = Math.sin(phi);
    dir.normalize();
    return dir;
  }, []);

  const water = useMemo(() => {
    const waterInstance = new Water(waterGeometry, {
      textureWidth: 256,
      textureHeight: 256,
      waterNormals: new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg',
        (texture) => { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; }
      ),
      sunDirection: sunDirection,
      sunColor: 0xfff5e0,
      waterColor: 0x006994,
      distortionScale: 3.7,
      fog: true,
    });
    waterInstance.material.transparent = true;
    return waterInstance;
  }, [waterGeometry, sunDirection]);

  useFrame((state, delta) => {
    if (waterRef.current?.material?.uniforms) {
      waterRef.current.material.uniforms.time.value += delta * 0.6;
      const elapsed = state.clock.elapsedTime;
      const dynamicSun = waterRef.current.material.uniforms.sunDirection.value;
      dynamicSun.x = Math.cos(elapsed * 0.02) * 0.8;
      dynamicSun.y = 0.45 + Math.sin(elapsed * 0.01) * 0.05;
      dynamicSun.z = Math.sin(elapsed * 0.02) * 0.8;
      dynamicSun.normalize();
      waterRef.current.position.x = state.camera.position.x;
      waterRef.current.position.z = state.camera.position.z;
    }
  });

  return (
    <primitive ref={waterRef} object={water} rotation-x={-Math.PI / 2} position={[0, 0, 0]} />
  );
}

// ─── Island Model Loader ─────────────────────────────────────────────────────
const islandModelCache: { model: THREE.Group | null; loading: boolean; callbacks: ((m: THREE.Group) => void)[] } = {
  model: null, loading: false, callbacks: [],
};

function loadIslandModel(callback: (model: THREE.Group) => void) {
  if (islandModelCache.model) { callback(islandModelCache.model); return; }
  islandModelCache.callbacks.push(callback);
  if (islandModelCache.loading) return;
  islandModelCache.loading = true;

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  dracoLoader.setDecoderConfig({ type: 'js' });
  loader.setDRACOLoader(dracoLoader);

  loader.load('/models/island.glb', (gltf) => {
    const scene = gltf.scene;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material = mesh.material[0];
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat.map) mat.map.minFilter = THREE.LinearFilter;
          mat.needsUpdate = true;
        }
        if (mesh.geometry) mesh.geometry.computeBoundingSphere();
      }
    });
    islandModelCache.model = scene;
    islandModelCache.callbacks.forEach((cb) => cb(scene));
    islandModelCache.callbacks = [];
    dracoLoader.dispose();
  }, undefined, (error) => console.error('Error loading island model:', error));
}

// ─── Camera Presets — shifted left to leave room for book on right ───────────
const CAMERA_PRESETS = [
  { pos: [-20, 85, 110] as const, lookAt: [-25, 0, -15] as const },
  { pos: [-50, 80, 105] as const, lookAt: [-20, 0, -15] as const },
  { pos: [-30, 90, 110] as const, lookAt: [-25, 0, -15] as const },
  { pos: [-45, 82, 108] as const, lookAt: [-15, 0, -15] as const },
];

// ─── Island with HTML Label (no reflection) ──────────────────────────────────
function Island({
  position, event, index,
}: {
  position: [number, number, number];
  event?: { day: number; title: string; time: string };
  index: number;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useEffect(() => { loadIslandModel((m) => setModel(m)); }, []);
  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('timeline-scroll-to', { detail: { index } }));
  }, [index]);

  if (!model) return null;

  return (
    <group position={position}>
      <primitive object={model.clone()} scale={[40, 40, 40]} />
      {/* Transparent clickable sphere hitbox — reliable raycasting */}
      <mesh
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[18, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {event && (
        <Html
          position={[0, 22, 0]}
          center
          distanceFactor={80}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
          zIndexRange={[100, 0]}
        >
          <div style={{
            textAlign: 'center',
            whiteSpace: 'nowrap',
            fontFamily: "'Cinzel', 'Pirata One', serif",
            textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 700,
              color: hovered ? '#ffdd88' : '#fff',
              lineHeight: 1.2,
              transition: 'color 0.2s',
            }}>
              {event.title.replace(/\n/g, ' ')}
            </div>
            <div style={{ fontSize: '13px', color: '#ccc', marginTop: '4px', fontWeight: 500 }}>
              {event.time}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Island layout — final positions ───────────────────────────────────────
const ISLAND_POSITIONS: [number, number, number][] = [
  [22.0, 10.0, -65.5],
  [25.2, 10.0, -133.1],
  [23.7, 10.0, -193.4],
  [-8.4, 10.0, -251.4],
  [14.1, 10.0, -313.9],
  [-0.8, 10.0, -377.4],
  [25.4, 10.0, -438.1],
  [33.1, 10.0, -504.6],
  [4.0, 10.0, -555.9],
  [21.2, 10.0, -616.8],
  [10.2, 10.0, -670.0],
  [7.0, 10.0, -726.3],
  [-17.0, 10.0, -785.5],
  [8.2, 10.0, -845.1],
  [22.3, 10.0, -902.7],
  [27.8, 10.0, -952.4],
  [-0.0, 10.0, -1009.9],
  [-8.5, 10.0, -1070.4],
  [13.4, 10.0, -1130.9],
  [-8.8, 10.0, -1187.7],
  [-13.2, 10.0, -1255.1],
];

function Islands() {
  return (
    <>
      {ISLAND_POSITIONS.map((pos, index) => (
        <Island key={index} position={pos} event={events[index]} index={index} />
      ))}
    </>
  );
}

const DOCK_SIDE = 25;
const DOCK_STOP_OFFSET = 0.008; // How far before the dock the ship stops (tune this!)

// ─── Ship Path — accepts curve offsets for manual adjustment ────────────────
function buildShipPath(
  islandPositions: [number, number, number][],
  curveOffsets?: [number, number][] // [dX, dZ] offset for each curve segment
): { curve: THREE.CatmullRomCurve3; curvePoints: [number, number, number][] } {
  const waypoints: THREE.Vector3[] = [];
  const curveControlPositions: [number, number, number][] = [];

  const first = islandPositions[0];
  waypoints.push(new THREE.Vector3(first[0] + DOCK_SIDE, 5, first[2] + 50));

  for (let i = 0; i < islandPositions.length; i++) {
    const pos = islandPositions[i];
    waypoints.push(new THREE.Vector3(pos[0] + DOCK_SIDE, 5, pos[2]));

    if (i < islandPositions.length - 1) {
      const next = islandPositions[i + 1];
      const dx = next[0] - pos[0];
      const dz = next[2] - pos[2];
      const perpX = -dz;
      const perpZ = dx;
      const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1;
      const arcAmount = 15; // Low arc for straighter paths

      // User-adjustable offset for this curve segment
      const offset = curveOffsets?.[i] || [0, 0];

      const midX = (pos[0] + next[0]) / 2 + (perpX / perpLen) * arcAmount * 0.6 + DOCK_SIDE * 0.4 + offset[0];
      const midZ = (pos[2] + next[2]) / 2 + (perpZ / perpLen) * arcAmount * 0.6 + offset[1];

      waypoints.push(new THREE.Vector3(midX, 5, midZ));
      curveControlPositions.push([midX, 5, midZ]);
    }
  }

  const last = islandPositions[islandPositions.length - 1];
  waypoints.push(new THREE.Vector3(last[0] + DOCK_SIDE, 5, last[2] - 50));

  return {
    curve: new THREE.CatmullRomCurve3(waypoints, false, 'centripetal', 0.3),
    curvePoints: curveControlPositions,
  };
}

// ─── Dock Markers ─────────────────────────────────────────────────────────────
function DockMarkers({ activeIsland }: { activeIsland: number }) {
  return (
    <>
      {ISLAND_POSITIONS.map((pos, i) => {
        const isActive = i === activeIsland;
        return (
          <group key={i} position={[pos[0] + DOCK_SIDE, 1.5, pos[2]]}>
            <mesh>
              <sphereGeometry args={[isActive ? 3 : 2, 12, 12]} />
              <meshStandardMaterial
                color={isActive ? '#ffdd44' : '#66ccff'}
                emissive={isActive ? '#ffaa00' : '#44aaff'}
                emissiveIntensity={isActive ? 2.5 : 1.2}
                transparent
                opacity={isActive ? 1 : 0.7}
              />
            </mesh>
            <mesh rotation-x={-Math.PI / 2}>
              <ringGeometry args={[isActive ? 3.5 : 2.5, isActive ? 5.5 : 4, 24]} />
              <meshBasicMaterial
                color={isActive ? '#ffaa00' : '#44aaff'}
                transparent opacity={isActive ? 0.5 : 0.25} side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function PathLine({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const lineRef = useRef<any>(null);
  const points = useMemo(() => curve.getPoints(300), [curve]);

  // Put path line on layer 1 so Water shader's reflection camera (layer 0 only) doesn't see it
  useEffect(() => {
    if (lineRef.current) {
      lineRef.current.layers.set(1);
    }
  }, []);

  return (
    <Line ref={lineRef} points={points} color="lightblue" lineWidth={3} dashed dashScale={2}
      gapSize={1} opacity={0.5} transparent position={[0, 0.5, 0]} />
  );
}

// Enable main camera to see both layer 0 (normal) and layer 1 (path line)
function CameraLayerSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.layers.enable(1);
  }, [camera]);
  return null;
}

// ─── Wake Effect (capped particles) ─────────────────────────────────────────
function WakeEffect() {
  const wakeRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<{ mesh: THREE.Mesh; age: number; maxAge: number }[]>([]);
  const spawnTimer = useRef(0);
  const geometry = useMemo(() => new THREE.RingGeometry(0.3, 1.2, 12), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false,
  }), []);

  useFrame((_, delta) => {
    if (!wakeRef.current) return;
    spawnTimer.current += delta;

    if (spawnTimer.current > 0.2 && particlesRef.current.length < 25) {
      spawnTimer.current = 0;
      const ring = new THREE.Mesh(geometry.clone(), material.clone());
      ring.rotation.x = -Math.PI / 2;
      const worldPos = new THREE.Vector3();
      wakeRef.current.localToWorld(worldPos.copy(new THREE.Vector3((Math.random() - 0.5) * 0.5, -4.5, 3)));
      const scene = wakeRef.current.parent?.parent;
      if (scene) {
        ring.position.copy(worldPos);
        ring.position.y = 0.3;
        scene.add(ring);
        particlesRef.current.push({ mesh: ring, age: 0, maxAge: 2.0 });
      }
    }

    particlesRef.current = particlesRef.current.filter((p) => {
      p.age += delta;
      const life = p.age / p.maxAge;
      if (life >= 1) {
        p.mesh.parent?.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        return false;
      }
      const scale = 1 + life * 5;
      p.mesh.scale.set(scale, scale, scale);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - life);
      return true;
    });
  });

  return <group ref={wakeRef} />;
}

// ─── Ship — snap-to-island scrolling, proper rotation ────────────────────────
function Ship({ islandPositions, onIslandChange, curveOffsets }: {
  islandPositions: [number, number, number][];
  onIslandChange: (idx: number) => void;
  curveOffsets?: [number, number][];
}) {
  const shipRef = useRef<THREE.Group>(null);
  const [shipModel, setShipModel] = useState<THREE.Group | null>(null);
  const lastIdx = islandPositions.length - 1;
  const progressRef = useRef(0.95); // Will be synced to precise value below
  const targetProgressRef = useRef(0.95);
  const { camera } = useThree();
  const zoomRef = useRef(1);
  const facingForwardRef = useRef(false);
  const currentIslandRef = useRef(lastIdx);
  const scrollAccumRef = useRef(lastIdx);

  const { curve } = useMemo(() => buildShipPath(islandPositions, curveOffsets), [islandPositions, curveOffsets]);

  // Pre-compute precise t values for each island's dock point
  const dockProgressValues = useMemo(() => {
    const samples = 2000;
    const dockTargets = islandPositions.map(pos =>
      new THREE.Vector3(pos[0] + DOCK_SIDE, 5, pos[2])
    );
    const tValues: number[] = new Array(islandPositions.length).fill(0);
    const bestDist: number[] = new Array(islandPositions.length).fill(Infinity);

    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const pt = curve.getPointAt(t);
      for (let i = 0; i < dockTargets.length; i++) {
        const d = pt.distanceTo(dockTargets[i]);
        if (d < bestDist[i]) {
          bestDist[i] = d;
          tValues[i] = t;
        }
      }
    }
    return tValues;
  }, [curve, islandPositions]);

  const getProgressForIsland = (index: number) => {
    const t = dockProgressValues[index] ?? 0.5;
    return Math.max(0, Math.min(0.999, t - DOCK_STOP_OFFSET));
  };

  // Sync initial position with precise dock values
  const initialSynced = useRef(false);
  useEffect(() => {
    if (!initialSynced.current && dockProgressValues.length > 0) {
      const preciseT = dockProgressValues[lastIdx];
      progressRef.current = preciseT;
      targetProgressRef.current = preciseT;
      initialSynced.current = true;
    }
  }, [dockProgressValues, lastIdx]);

  // Listen for jump events (clicking islands)
  useEffect(() => {
    const handleJump = (e: any) => {
      const index = e.detail.index;
      currentIslandRef.current = index;
      targetProgressRef.current = getProgressForIsland(index);
      scrollAccumRef.current = index;
    };
    window.addEventListener('timeline-scroll-to', handleJump);
    return () => window.removeEventListener('timeline-scroll-to', handleJump);
  }, [islandPositions]);

  // Load Ship.glb
  useEffect(() => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(dracoLoader);
    loader.load('/models/Ship.glb', (gltf) => {
      setShipModel(gltf.scene);
      dracoLoader.dispose();
    }, undefined, (error) => console.error('Error loading ship model:', error));
  }, []);

  // Scroll handling — snap to islands with speed limit
  const scrollCooldownRef = useRef(0);
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        zoomRef.current = Math.max(0.4, Math.min(2.0, zoomRef.current + event.deltaY * 0.005));
        return;
      }

      // Speed limit: cooldown between island changes
      const now = Date.now();
      if (now - scrollCooldownRef.current < 200) return;

      // Clamp delta so one scroll = max 1 island
      const clampedDelta = Math.max(-60, Math.min(60, event.deltaY));
      const scrollSensitivity = 0.008;
      scrollAccumRef.current += clampedDelta * scrollSensitivity;

      // Clamp to valid range: 0 to last island
      scrollAccumRef.current = Math.max(0, Math.min(islandPositions.length - 1, scrollAccumRef.current));

      // Round to nearest island for snapping
      const targetIsland = Math.round(scrollAccumRef.current);
      if (targetIsland !== currentIslandRef.current) {
        currentIslandRef.current = targetIsland;
        onIslandChange(targetIsland);
        scrollCooldownRef.current = now; // Reset cooldown on island change
      }
      targetProgressRef.current = getProgressForIsland(targetIsland);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [islandPositions]);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;

    const diff = targetProgressRef.current - progressRef.current;
    if (Math.abs(diff) > 0.0001) {
      facingForwardRef.current = diff > 0;
    }

    // Smooth lerp — no hard jumps
    progressRef.current += diff * 0.04;
    const t = Math.max(0, Math.min(0.999, progressRef.current));

    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    if (shipRef.current) {
      shipRef.current.position.copy(point);
      shipRef.current.position.y = 5 + Math.sin(elapsed * 1.5) * 0.4;

      // Rotation: ship model's bow faces +Z, so atan2(x,z) aligns it with the tangent
      // Add PI/2 to correct the 90° offset (ship was facing sideways)
      const isForward = facingForwardRef.current;
      const facingTangent = isForward ? tangent : tangent.clone().negate();
      const targetRotation = Math.atan2(facingTangent.x, facingTangent.z) - Math.PI / 2;

      const currentY = shipRef.current.rotation.y;
      let rotDiff = targetRotation - currentY;
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      shipRef.current.rotation.y += rotDiff * 0.1;

      // Subtle wave roll/pitch
      shipRef.current.rotation.z = Math.sin(elapsed * 0.8) * 0.03;
      shipRef.current.rotation.x = Math.sin(elapsed * 1.2) * 0.02;
    }

    // Camera — stable, low angle, follows ship
    const step = 1 / (islandPositions.length);
    const currentSegmentIndex = Math.floor(t / step);
    const presetIndex = currentSegmentIndex % CAMERA_PRESETS.length;
    const nextPresetIndex = (currentSegmentIndex + 1) % CAMERA_PRESETS.length;

    const segmentProgress = (t % step) / step;
    const ease = segmentProgress * segmentProgress * (3 - 2 * segmentProgress);

    const preset1 = CAMERA_PRESETS[presetIndex];
    const preset2 = CAMERA_PRESETS[nextPresetIndex];

    const targetRelPos = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...preset1.pos), new THREE.Vector3(...preset2.pos), ease
    );
    const targetLookOffset = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...preset1.lookAt), new THREE.Vector3(...preset2.lookAt), ease
    );

    targetRelPos.multiplyScalar(zoomRef.current);

    const pathAngle = Math.atan2(tangent.x, tangent.z);
    const offsetRotated = targetRelPos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), pathAngle);
    const lookOffsetRotated = targetLookOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), pathAngle);

    const desiredCamPos = point.clone().add(offsetRotated);
    const desiredLookAt = point.clone().add(lookOffsetRotated);

    // Slower camera lerp for more stable movement (less jarring)
    camera.position.lerp(desiredCamPos, 0.03);
    camera.lookAt(desiredLookAt);
  });

  if (!shipModel) return null;

  return (
    <group>
      <group ref={shipRef}>
        <primitive object={shipModel} scale={[15, 15, 15]} />
        <WakeEffect />
      </group>
      <PathLine curve={curve} />
    </group>
  );
}

// ─── Treasure Book Component ───────────────────────────────────────────────
function TreasureBook({ activeIsland }: { activeIsland: number }) {
  const event = events[activeIsland];
  const theme = DAY_THEMES[event?.day] || DAY_THEMES[1];
  const [flipping, setFlipping] = useState(false);
  const prevIsland = useRef(activeIsland);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Trigger page-turn on island change
  useEffect(() => {
    if (prevIsland.current !== activeIsland) {
      setFlipping(true);
      prevIsland.current = activeIsland;
      const timer = setTimeout(() => setFlipping(false), 500);
      return () => clearTimeout(timer);
    }
  }, [activeIsland]);

  if (!event) return null;

  // ─── MOBILE: Single parchment page ───────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', bottom: '80px', right: '10px', zIndex: 50,
        width: '160px', height: '220px',
        perspective: '800px',
      }}>
        <div style={{
          width: '100%', height: '100%',
          backgroundImage: 'url(/images/MB-Timeline.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '25px 15px 20px',
          transform: flipping ? 'rotateY(-90deg)' : 'rotateY(0deg)',
          transition: 'transform 0.25s ease-in',
          transformOrigin: 'left center',
          boxSizing: 'border-box',
        }}>
          {/* Wax seal badge */}
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25), ${theme.wax} 60%)`,
            border: '1.5px solid rgba(255,255,255,0.2)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-cinzel), serif', fontWeight: 700 }}>
              Day {event.day}
            </span>
          </div>
          <div style={{
            fontFamily: 'var(--font-pirata), serif', fontSize: '16px',
            color: theme.ink, textAlign: 'center', lineHeight: 1.2,
            marginBottom: '6px',
          }}>
            {event.title.replace(/\n/g, ' ')}
          </div>
          <div style={{ width: '60%', height: '1px', background: `linear-gradient(to right, transparent, ${theme.border}, transparent)`, margin: '4px 0' }} />
          <div style={{
            fontFamily: 'var(--font-cinzel), serif', fontSize: '13px',
            color: theme.ink, opacity: 0.8, textAlign: 'center',
          }}>
            {theme.icon} {event.time}
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: '9px',
            color: theme.ink, opacity: 0.4, marginTop: '8px',
          }}>
            Stop {activeIsland + 1} of {events.length}
          </div>
        </div>
        {/* Flip-back animation */}
        {flipping && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: 'url(/images/MB-Timeline.png)',
            backgroundSize: 'cover', backgroundPosition: 'center',
            transform: 'rotateY(90deg)',
            transition: 'transform 0.25s ease-out 0.25s',
            transformOrigin: 'left center',
          }} />
        )}
      </div>
    );
  }

  // ─── PC: Open book with two pages ────────────────────────────────
  return (
    <div style={{
      position: 'fixed', top: '50%', right: '20px', transform: 'translateY(-50%)',
      zIndex: 50, width: '420px', height: '300px',
      perspective: '1200px',
    }}>
      <div style={{
        width: '100%', height: '100%',
        backgroundImage: 'url(/images/PC-Timeline.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', position: 'relative',
      }}>
        {/* Left page — decorative */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 20px 30px',
        }}>
          {/* Wax seal */}
          <div style={{
            width: '50px', height: '50px', borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), ${theme.wax} 60%)`,
            border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 -2px 6px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '18px' }}>{theme.icon}</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-cinzel), serif', fontSize: '13px',
            color: theme.ink, opacity: 0.5, textAlign: 'center',
            letterSpacing: '2px', textTransform: 'uppercase',
          }}>
            Day {event.day}
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: '10px',
            color: theme.ink, opacity: 0.3, marginTop: '8px',
          }}>
            Stop {activeIsland + 1} / {events.length}
          </div>
        </div>

        {/* Right page — event details with page-turn */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '35px 25px 30px',
          transformStyle: 'preserve-3d',
          transform: flipping ? 'rotateY(-90deg)' : 'rotateY(0deg)',
          transition: 'transform 0.3s ease-in-out',
          transformOrigin: 'left center',
        }}>
          <div style={{
            fontFamily: 'var(--font-pirata), serif', fontSize: '24px',
            color: theme.ink, textAlign: 'center', lineHeight: 1.2,
            marginBottom: '12px',
          }}>
            {event.title.replace(/\n/g, ' ')}
          </div>
          <div style={{
            width: '70%', height: '1px', margin: '8px 0',
            background: `linear-gradient(to right, transparent, ${theme.border}, transparent)`,
            opacity: 0.5,
          }} />
          <div style={{
            fontFamily: 'var(--font-cinzel), serif', fontSize: '18px',
            color: theme.ink, fontWeight: 700, textAlign: 'center',
          }}>
            {event.time}
          </div>
          <div style={{
            fontFamily: 'var(--font-cinzel), serif', fontSize: '12px',
            color: theme.ink, opacity: 0.5, marginTop: '8px',
          }}>
            • Day {event.day} •
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Navigation Arrows ──────────────────────────────────────────
function MobileNavArrows({ activeIsland, onNavigate }: {
  activeIsland: number;
  onNavigate: (index: number) => void;
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isMobile) return null;

  const btnStyle: React.CSSProperties = {
    width: '50px', height: '50px', borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.3)',
    color: '#fff', fontSize: '22px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    transition: 'background 0.2s',
  };

  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '20px', zIndex: 100,
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <button
        style={{ ...btnStyle, opacity: activeIsland > 0 ? 1 : 0.3 }}
        onClick={() => activeIsland > 0 && onNavigate(activeIsland - 1)}
      >▲</button>
      <button
        style={{ ...btnStyle, opacity: activeIsland < events.length - 1 ? 1 : 0.3 }}
        onClick={() => activeIsland < events.length - 1 && onNavigate(activeIsland + 1)}
      >▼</button>
    </div>
  );
}

// ─── Main Scene ──────────────────────────────────────────────────────────────
export default function TimelineScene() {
  const [activeIsland, setActiveIsland] = useState(ISLAND_POSITIONS.length - 1);

  const handleMobileNav = useCallback((index: number) => {
    setActiveIsland(index);
    window.dispatchEvent(new CustomEvent('timeline-scroll-to', { detail: { index } }));
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0,
      backgroundImage: 'url(/sunny.jpeg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
    }}>
      <Canvas
        camera={{ fov: 55, near: 0.1, far: 3000, position: [0, 50, 100] }}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          stencil: false,
          depth: true,
          alpha: true,
        }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.fog = new THREE.Fog(0x1a2a3a, 400, 1200);
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            console.warn('WebGL context lost — allowing recovery');
            event.preventDefault();
          });
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
          });
        }}
      >
        <CameraLayerSetup />
        <ambientLight intensity={3} />
        <directionalLight position={[100, 100, 100]} intensity={8} />
        <directionalLight position={[-100, 80, -50]} intensity={5} />
        <directionalLight position={[0, 60, 100]} intensity={5} />

        <Ocean />
        <Islands />
        <DockMarkers activeIsland={activeIsland} />
        <Ship islandPositions={ISLAND_POSITIONS} onIslandChange={setActiveIsland} />
      </Canvas>

      {/* Treasure Book */}
      <TreasureBook activeIsland={activeIsland} />

      {/* Mobile Navigation Arrows */}
      <MobileNavArrows activeIsland={activeIsland} onNavigate={handleMobileNav} />
    </div>
  );
}
