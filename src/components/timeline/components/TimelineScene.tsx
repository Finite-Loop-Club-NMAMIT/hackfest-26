"use client";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { events } from "~/constants/timeline";
import { getSkyForIsland } from "../constants/dayThemes";
import { useIsMobile } from "../hooks/useIsMobile";
import type { TimelineEvent } from "../types/timeline.types";
import { globalShipPosition } from "../utils/globalState";
import { FocusDialog } from "./FocusDialog";
import { DockMarkers, ISLAND_POSITIONS, Islands } from "./Islands";
import { MobileControls } from "./MobileControls";
import { Ocean } from "./Ocean";
import { CameraLayerSetup, StartLine } from "./SceneUI";
import { Ship } from "./Ship";

export default function TimelineScene() {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null,
  );
  const [activeDock, setActiveDock] = useState<number | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const isMobile = useIsMobile();

  const shipControlsRef =
    useRef<import("../types/timeline.types").ShipControls>(null);
  const bgOverlayRef = useRef<HTMLDivElement>(null);
  const allowRecoveryRef = useRef(true);
  const webglLossHandlerRef = useRef<((e: Event) => void) | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const lastDockedIslandRef = useRef<number | null>(null);
  const skyTriggeredForRef = useRef<number | null>(null);
  const skyTopColor = useRef({ r: 0x5b, g: 0xb8, b: 0xd4 });
  const skyBottomColor = useRef({ r: 0xc8, g: 0xea, b: 0xf8 });
  const fogColorProxy = useRef({ r: 0x1a, g: 0x2a, b: 0x3a });
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const mainSunLightRef = useRef<THREE.DirectionalLight>(null);
  const fogRef = useRef<THREE.Fog | null>(null);

  useEffect(() => {
    return () => {
      allowRecoveryRef.current = false;
      if (glCanvasRef.current && webglLossHandlerRef.current) {
        glCanvasRef.current.removeEventListener(
          "webglcontextlost",
          webglLossHandlerRef.current,
        );
      }
    };
  }, []);

  // Handle hiding/showing scroll hint based on user activity
  useEffect(() => {
    let idleTimeout: NodeJS.Timeout;
    const handleActivity = (e: Event) => {
      if (e.type === "keydown") {
        const key = (e as KeyboardEvent).key;
        if (key !== "ArrowUp" && key !== "ArrowDown") return;
      }
      setShowScrollHint(false);
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        setShowScrollHint(true);
      }, 3000); // Reappear after 3s of idle
    };

    window.addEventListener("wheel", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });
    window.addEventListener("touchmove", handleActivity, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("touchmove", handleActivity);
      clearTimeout(idleTimeout);
    };
  }, []);

  function hexToRgb(hex: string) {
    const h = hex.replace("#", "");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  function applySky(el: HTMLDivElement) {
    const t = skyTopColor.current;
    const b = skyBottomColor.current;
    el.style.background = `linear-gradient(to bottom, rgb(${t.r},${t.g},${t.b}), rgb(${b.r},${b.g},${b.b}))`;
  }

  function tweenSkyTo(
    topHex: string,
    bottomHex: string,
    duration: number,
    el: HTMLDivElement,
  ) {
    const topTarget = hexToRgb(topHex);
    const bottomTarget = hexToRgb(bottomHex);
    gsap.killTweensOf(skyTopColor.current);
    gsap.killTweensOf(skyBottomColor.current);
    gsap.to(skyTopColor.current, {
      ...topTarget,
      duration,
      ease: "power2.inOut",
      onUpdate: () => applySky(el),
    });
    gsap.to(skyBottomColor.current, {
      ...bottomTarget,
      duration,
      ease: "power2.inOut",
      onUpdate: () => applySky(el),
    });

    const isNight = bottomTarget.r + bottomTarget.g + bottomTarget.b < 150;
    if (ambientLightRef.current)
      gsap.to(ambientLightRef.current, {
        intensity: isNight ? 0.5 : 3,
        duration,
        ease: "power2.inOut",
      });
    if (mainSunLightRef.current)
      gsap.to(mainSunLightRef.current, {
        intensity: isNight ? 1 : 8,
        duration,
        ease: "power2.inOut",
      });

    const fogTarget = isNight ? { r: 26, g: 42, b: 58 } : bottomTarget;
    gsap.killTweensOf(fogColorProxy.current);
    gsap.to(fogColorProxy.current, {
      ...fogTarget,
      duration,
      ease: "power2.inOut",
      onUpdate: () => {
        fogRef.current?.color.setRGB(
          fogColorProxy.current.r / 255,
          fogColorProxy.current.g / 255,
          fogColorProxy.current.b / 255,
        );
      },
    });
  }

  const handleDock = (idx: number | null) => {
    setActiveDock(idx);
    if (idx !== null && bgOverlayRef.current) {
      lastDockedIslandRef.current = idx;
      skyTriggeredForRef.current = idx;
      const [top, bot] = getSkyForIsland(idx);
      tweenSkyTo(top, bot, 1.5, bgOverlayRef.current);
      if (idx === ISLAND_POSITIONS.length - 1) setSelectedEvent(events[idx]);
    }
  };

  const handleShipProgress = () => {
    if (!bgOverlayRef.current) return;
    const el = bgOverlayRef.current;
    const PRE_TRIGGER = 200;
    for (let i = 0; i < ISLAND_POSITIONS.length; i++) {
      if (i === lastDockedIslandRef.current || i === skyTriggeredForRef.current)
        continue;
      const pos = ISLAND_POSITIONS[i];
      const dist = Math.sqrt(
        (globalShipPosition.x - pos[0]) ** 2 +
          (globalShipPosition.z - pos[2]) ** 2,
      );
      if (dist < PRE_TRIGGER) {
        skyTriggeredForRef.current = i;
        const [top, bot] = getSkyForIsland(i);
        tweenSkyTo(top, bot, 4, el);
        break;
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    >
      {/* Sky gradient background */}
      <div
        ref={bgOverlayRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(to bottom, rgb(91,184,212), rgb(200,234,248))",
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes noteGlow {
          0%, 100% { filter: drop-shadow(0 8px 16px rgba(0,0,0,0.6)); }
          50% { filter: drop-shadow(0 8px 24px rgba(255,215,0,0.8)) drop-shadow(0 0 12px rgba(255,215,0,0.6)); }
        }
      `}</style>

      <Canvas
        camera={{ fov: isMobile ? 75 : 55, near: 1, far: 3000 }}
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          stencil: false,
          depth: true,
          alpha: true,
        }}
        style={{ background: "transparent" }}
        onCreated={({ gl, scene }) => {
          scene.fog = new THREE.Fog(0x1a2a3a, 400, 1200);
          fogRef.current = scene.fog as THREE.Fog;
          const handleLost = (e: Event) => {
            e.preventDefault();
            if (!allowRecoveryRef.current) return;
            setTimeout(() => window.location.reload(), 1000);
          };
          webglLossHandlerRef.current = handleLost;
          glCanvasRef.current = gl.domElement;
          gl.domElement.addEventListener("webglcontextlost", handleLost);
        }}
      >
        <ambientLight ref={ambientLightRef} intensity={3} />
        <directionalLight
          ref={mainSunLightRef}
          position={[100, 100, 100]}
          intensity={8}
        />
        <directionalLight position={[-100, 80, -50]} intensity={5} />
        <directionalLight position={[0, 60, 100]} intensity={5} />

        <CameraLayerSetup />
        <Ocean />
        <StartLine />
        <DockMarkers activeIsland={activeDock ?? -1} />
        <Islands onSelect={setSelectedEvent} />
        <Ship
          ref={shipControlsRef}
          islandPositions={ISLAND_POSITIONS}
          onProgress={handleShipProgress}
          onDock={handleDock}
        />
      </Canvas>

      {isMobile && <MobileControls shipControls={shipControlsRef} />}

      {/* Desktop Scroll Hint */}
      {!isMobile && (
        <div
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center gap-2 animate-bounce transition-opacity duration-1000 ${
            showScrollHint ? "opacity-80" : "opacity-0"
          }`}
        >
          <p className="text-xs font-crimson tracking-[0.3em] uppercase text-white drop-shadow-md">
            Navigate Timeline
          </p>
          <div className="text-lg font-bold text-white drop-shadow-md">
            Scroll or Use Arrow Keys
          </div>
          <svg
            className="w-6 h-6 text-white drop-shadow-md"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Scroll or Use Arrow Keys</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      )}

      <FocusDialog
        selectedEvent={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
