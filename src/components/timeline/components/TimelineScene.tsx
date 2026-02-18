"use client";

import { Html, Line } from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { events } from "~/constants/timeline";

extend({ Water });

const globalShipPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const DAY_THEMES: Record<
  number,
  { parchment: string; border: string; ink: string; wax: string; icon: string }
> = {
  1: {
    parchment: "#f0e6d2",
    border: "#8B4513",
    ink: "#2A1A0A",
    wax: "#aa2222",
    icon: "⚓",
  },
  2: {
    parchment: "#e8dac0",
    border: "#654321",
    ink: "#2A1A0A",
    wax: "#e69b00",
    icon: "⚔️",
  },
  3: {
    parchment: "#e3dcd2",
    border: "#556B2F",
    ink: "#2A1A0A",
    wax: "#228822",
    icon: "💎",
  },
};

function Ocean() {
  const waterRef = useRef<Water>(null);

  const waterGeometry = useMemo(
    () => new THREE.PlaneGeometry(3000, 3000, 2, 2),
    [],
  );

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
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg",
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        },
      ),
      sunDirection: sunDirection,
      sunColor: 0xfff5e0,
      waterColor: 0x006994,
      distortionScale: 4.0,
      fog: true,
      alpha: 0.95,
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
    <primitive
      ref={waterRef}
      object={water}
      rotation-x={-Math.PI / 2}
      position={[0, 0, 0]}
    />
  );
}

const islandModelCache: {
  model: THREE.Group | null;
  loading: boolean;
  callbacks: ((m: THREE.Group) => void)[];
} = {
  model: null,
  loading: false,
  callbacks: [],
};

function loadIslandModel(callback: (model: THREE.Group) => void) {
  if (islandModelCache.model) {
    callback(islandModelCache.model);
    return;
  }
  islandModelCache.callbacks.push(callback);
  if (islandModelCache.loading) return;

  islandModelCache.loading = true;
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
  );
  dracoLoader.setDecoderConfig({ type: "js" });
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    "/models/island.glb",
    (gltf) => {
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
      islandModelCache.callbacks.forEach((cb) => {
        cb(scene);
      });
      islandModelCache.callbacks = [];
      dracoLoader.dispose();
    },
    undefined,
    (error) => console.error("Error loading island model:", error),
  );
}

const finalIslandModelCache: {
  model: THREE.Group | null;
  loading: boolean;
  callbacks: ((m: THREE.Group) => void)[];
} = {
  model: null,
  loading: false,
  callbacks: [],
};

function loadFinalIslandModel(callback: (model: THREE.Group) => void) {
  if (finalIslandModelCache.model) {
    callback(finalIslandModelCache.model);
    return;
  }
  finalIslandModelCache.callbacks.push(callback);
  if (finalIslandModelCache.loading) return;

  finalIslandModelCache.loading = true;
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
  );
  dracoLoader.setDecoderConfig({ type: "js" });
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    "/models/Island-Final.glb",
    (gltf) => {
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
      finalIslandModelCache.model = scene;
      finalIslandModelCache.callbacks.forEach((cb) => {
        cb(scene);
      });
      finalIslandModelCache.callbacks = [];
      dracoLoader.dispose();
    },
    undefined,
    (error) => console.error("Error loading final island model:", error),
  );
}

type TimelineEvent = { day: number; title: string; time: string };

function EventLabel({
  event,
  isFirstOfDay,
  onSelect,
  position,
}: {
  event: TimelineEvent;
  isFirstOfDay: boolean;
  onSelect: (e: TimelineEvent) => void;
  position: [number, number, number];
}) {
  const theme = DAY_THEMES[event.day] || DAY_THEMES[1];
  const displayTitle = event.title.replace(/\\n/g, "\n").replace(/\n/g, " ");
  const [isNearShip, setIsNearShip] = useState(false);
  const [isVeryClose, setIsVeryClose] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const isMobile = useIsMobile();

  useFrame(() => {
    const distToShip = Math.sqrt(
      (globalShipPosition.x - position[0]) ** 2 +
        (globalShipPosition.z - position[2]) ** 2,
    );
    const renderDistance = 200;
    const closeDistance = 40;

    setIsNearShip(distToShip < renderDistance);
    setIsVeryClose(distToShip < closeDistance);

    if (distToShip < renderDistance) {
      const fadeStart = renderDistance * 0.8;
      if (distToShip > fadeStart) {
        const fadeRange = renderDistance - fadeStart;
        const fadeValue = 1 - (distToShip - fadeStart) / fadeRange;
        setFadeOpacity(Math.max(0.3, fadeValue));
      } else {
        setFadeOpacity(1);
      }
    }
  });

  if (!isNearShip) return null;

  return (
    <Html
      center
      distanceFactor={isMobile ? 15 : 40}
      position={[0, 18, 0]}
      style={{
        pointerEvents: "none",
        cursor: "default",
      }}
      sprite
      zIndexRange={[100, 0]}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(event);
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          userSelect: "none",
          filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.6))",
          cursor: "pointer",
          pointerEvents: "auto",
          transition:
            "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), scale 0.3s ease, opacity 0.5s ease",
          animation: isVeryClose ? "noteGlow 2s ease-in-out infinite" : "none",
          background: "none",
          border: "none",
          padding: 0,
          transform: isVeryClose
            ? isMobile
              ? "scale(2.0)"
              : "scale(1.3)"
            : "scale(1)",
          opacity: fadeOpacity,
        }}
        className="hover:scale-110 active:scale-95"
      >
        {isFirstOfDay && (
          <div
            style={{
              position: "absolute",
              top: "-15px",
              right: "-10px",
              width: "32px",
              height: "32px",
              background: `radial-gradient(circle at 30% 30%, ${theme.wax}, darken(${theme.wax}, 20%))`,
              backgroundColor: theme.wax,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.2)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              transform: "rotate(15deg)",
            }}
          >
            <div
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "14px",
                fontFamily: "var(--font-cinzel), serif",
                fontWeight: 700,
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              {event.day}
            </div>
            <div
              style={{
                position: "absolute",
                inset: "3px",
                borderRadius: "50%",
                border: "1px dashed rgba(255,255,255,0.4)",
                opacity: 0.6,
              }}
            />
          </div>
        )}

        <div
          style={{
            background: theme.parchment,
            backgroundImage: `
              linear-gradient(to bottom right, rgba(0,0,0,0.05), transparent)
            `,
            color: theme.ink,
            padding: isMobile ? "14px 18px" : "14px 20px",
            minWidth: isMobile ? "130px" : "160px",
            maxWidth: isMobile ? "220px" : "240px",
            textAlign: "center",
            position: "relative",
            borderRadius: "2px",
            boxShadow: `
              inset 0 0 20px rgba(139, 69, 19, 0.15),
              0 0 0 1px rgba(0,0,0,0.1),
              0 2px 4px rgba(0,0,0,0.1)
            `,
            clipPath: "polygon(2% 0%, 98% 2%, 100% 98%, 0% 100%)",
            border: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "4px",
              left: "4px",
              width: "8px",
              height: "8px",
              borderTop: `2px solid ${theme.border}`,
              borderLeft: `2px solid ${theme.border}`,
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "4px",
              right: "4px",
              width: "8px",
              height: "8px",
              borderBottom: `2px solid ${theme.border}`,
              borderRight: `2px solid ${theme.border}`,
              opacity: 0.6,
            }}
          />

          <div
            style={{
              fontSize: isMobile ? "22px" : "24px",
              fontFamily: "var(--font-pirata), serif",
              fontWeight: 400,
              lineHeight: "1.1",
              marginBottom: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {displayTitle}
          </div>

          <div
            style={{
              height: "1px",
              width: "60%",
              margin: "0 auto 6px auto",
              background: `linear-gradient(to right, transparent, ${theme.border}, transparent)`,
              opacity: 0.5,
            }}
          />

          <div
            style={{
              fontSize: isMobile ? "16px" : "16px",
              fontFamily: "var(--font-cinzel), serif",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              color: "#5c4033",
            }}
          >
            <span style={{ fontSize: "14px" }}>{theme.icon}</span>
            {event.time}
          </div>
        </div>

        <div
          style={{
            marginTop: "4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "2px",
              height: "15px",
              borderLeft: `2px dashed rgba(255, 255, 255, 0.6)`,
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
            }}
          />
          <div
            style={{
              color: "#d00",
              fontSize: "16px",
              fontWeight: "bold",
              fontFamily: "var(--font-pirata), serif",
              lineHeight: 1,
              textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              transform: "translateY(-4px)",
            }}
          >
            X
          </div>
        </div>
      </button>
    </Html>
  );
}

function Island({
  position,
  event,
  isFirstOfDay,
  onSelect,
}: {
  position: [number, number, number];
  event?: TimelineEvent;
  isFirstOfDay?: boolean;
  onSelect: (e: TimelineEvent) => void;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    loadIslandModel((m) => setModel(m));
  }, []);

  if (!model) return null;

  return (
    <group position={position}>
      <primitive object={model.clone()} scale={[40, 40, 40]} />
      {event && (
        <EventLabel
          event={event}
          isFirstOfDay={!!isFirstOfDay}
          onSelect={onSelect}
          position={position}
        />
      )}
    </group>
  );
}

function FinalIsland({
  position,
  event,
  isFirstOfDay,
  onSelect,
}: {
  position: [number, number, number];
  event?: TimelineEvent;
  isFirstOfDay?: boolean;
  onSelect: (e: TimelineEvent) => void;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    loadFinalIslandModel((m) => setModel(m));
  }, []);

  if (!model) return null;

  return (
    <group position={position}>
      <primitive object={model.clone()} scale={[90, 90, 90]} />
      {event && (
        <EventLabel
          event={event}
          isFirstOfDay={!!isFirstOfDay}
          onSelect={onSelect}
          position={position}
        />
      )}
    </group>
  );
}

const ISLAND_POSITIONS: [number, number, number][] = (() => {
  const random = seededRandom(12345);
  const positions: [number, number, number][] = [];
  const numIslands = events.length;
  const spacing = 180;

  for (let i = 0; i < numIslands; i++) {
    const isLast = i === numIslands - 1;

    const baseX = 60 + i * spacing;

    const cycle = i % 6;
    let laneZ = 0;

    if (cycle === 0 || cycle === 1) {
      laneZ = -60;
    } else if (cycle === 2 || cycle === 3) {
      laneZ = 0;
    } else {
      laneZ = 60;
    }

    const randomOffset = (random() - 0.5) * 20;

    const x = baseX;
    const y = isLast ? 25 : 10;
    const z = laneZ + randomOffset;

    positions.push([x, y, z]);
  }
  return positions;
})();

function Islands({ onSelect }: { onSelect: (e: TimelineEvent) => void }) {
  const seenDays = new Set<number>();
  const lastIndex = ISLAND_POSITIONS.length - 1;

  return (
    <>
      {ISLAND_POSITIONS.map((pos, index) => {
        const event = events[index];
        const isFirstOfDay = event ? !seenDays.has(event.day) : false;
        if (event) seenDays.add(event.day);
        const isLast = index === lastIndex;

        if (isLast) {
          return (
            <FinalIsland
              key={`island-${pos[0]}-${pos[2]}`}
              position={pos}
              event={event}
              isFirstOfDay={isFirstOfDay}
              onSelect={onSelect}
            />
          );
        }

        return (
          <Island
            key={`island-${pos[0]}-${pos[2]}`}
            position={pos}
            event={event}
            isFirstOfDay={isFirstOfDay}
            onSelect={onSelect}
          />
        );
      })}
    </>
  );
}

function buildShipPath(
  islandPositions: [number, number, number][],
): THREE.CatmullRomCurve3 {
  const waypoints: THREE.Vector3[] = [];

  const first = islandPositions[0];
  waypoints.push(new THREE.Vector3(first[0] - 80, 5, first[2]));

  for (let i = 0; i < islandPositions.length; i++) {
    const island = islandPositions[i];
    const isLast = i === islandPositions.length - 1;

    const approachX = island[0] - 12;
    const approachZ = island[2] + 25;

    waypoints.push(new THREE.Vector3(approachX, 5, approachZ));

    if (!isLast) {
      const passX = island[0] + 12;
      const passZ = island[2] + 25;
      waypoints.push(new THREE.Vector3(passX, 5, passZ));

      const nextIsland = islandPositions[i + 1];
      const midX = (island[0] + nextIsland[0]) / 2;
      const midZ = (island[2] + nextIsland[2]) / 2 + 25;
      waypoints.push(new THREE.Vector3(midX, 5, midZ));
    }
    // Last island: path ends at the approach waypoint (no overshoot)
  }

  return new THREE.CatmullRomCurve3(waypoints, false, "centripetal", 0.5);
}

function getSkyGradient(progressIndex: number): string {
  const keyframes = [
    {
      idx: 0,
      grad: "linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #87CEEB 100%)",
    },
    {
      idx: 4,
      grad: "linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #87CEEB 100%)",
    },
    {
      idx: 5,
      grad: "linear-gradient(to bottom, #FF6B35 0%, #F7931E 30%, #FDB44B 60%, #FFE5B4 100%)",
    },
    {
      idx: 6,
      grad: "linear-gradient(to bottom, #0A1128 0%, #1C2541 40%, #3A506B 100%)",
    },
    {
      idx: 7,
      grad: "linear-gradient(to bottom, #0A1128 0%, #1C2541 40%, #2C3E5A 100%)",
    },
    {
      idx: 7.8,
      grad: "linear-gradient(to bottom, #FF6B6B 0%, #FFB347 30%, #FFD166 60%, #87CEEB 100%)",
    },
    {
      idx: 8,
      grad: "linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #87CEEB 100%)",
    },
    {
      idx: 11,
      grad: "linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #87CEEB 100%)",
    },
    {
      idx: 12,
      grad: "linear-gradient(to bottom, #0A1128 0%, #1C2541 40%, #3A506B 100%)",
    },
    {
      idx: 13,
      grad: "linear-gradient(to bottom, #0A1128 0%, #1C2541 40%, #2C3E5A 100%)",
    },
    {
      idx: 13.8,
      grad: "linear-gradient(to bottom, #FF6B6B 0%, #FFB347 30%, #FFD166 60%, #87CEEB 100%)",
    },
    {
      idx: 14,
      grad: "linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #87CEEB 100%)",
    },
    {
      idx: 20,
      grad: "linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #87CEEB 100%)",
    },
  ];

  let lower = keyframes[0];
  let upper = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (
      progressIndex >= keyframes[i].idx &&
      progressIndex < keyframes[i + 1].idx
    ) {
      lower = keyframes[i];
      upper = keyframes[i + 1];
      break;
    }
  }

  const t = (progressIndex - lower.idx) / (upper.idx - lower.idx || 1);
  const clampedT = Math.max(0, Math.min(1, t));

  if (clampedT < 0.5) {
    return lower.grad;
  } else {
    return upper.grad;
  }
}

function DockMarkers({ activeIsland }: { activeIsland: number }) {
  return (
    <>
      {ISLAND_POSITIONS.map((pos, i) => {
        const isActive = i === activeIsland;
        return (
          <group
            key={`dock-${pos[0]}-${pos[2]}`}
            position={[pos[0], 1.5, pos[2] + 25]}
          >
            <mesh>
              <sphereGeometry args={[isActive ? 3 : 2, 12, 12]} />
              <meshStandardMaterial
                color={isActive ? "#ffdd44" : "#66ccff"}
                emissive={isActive ? "#ffaa00" : "#44aaff"}
                emissiveIntensity={isActive ? 2.5 : 1.2}
                transparent
                opacity={isActive ? 1 : 0.7}
              />
            </mesh>
            <mesh rotation-x={-Math.PI / 2}>
              <ringGeometry
                args={[isActive ? 3.5 : 2.5, isActive ? 5.5 : 4, 24]}
              />
              <meshBasicMaterial
                color={isActive ? "#ffaa00" : "#44aaff"}
                transparent
                opacity={isActive ? 0.5 : 0.25}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function PathLine({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const lineRef = useRef(null);
  const points = useMemo(() => curve.getPoints(300), [curve]);

  useEffect(() => {
    if (lineRef.current) {
      (lineRef.current as THREE.Object3D).layers.set(1);
    }
  }, []);

  return (
    <Line
      ref={lineRef}
      points={points}
      color="lightblue"
      lineWidth={3}
      dashed
      dashScale={2}
      gapSize={1}
      opacity={0.5}
      transparent
      position={[0, 0.5, 0]}
    />
  );
}

function CameraLayerSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.layers.enable(1);
  }, [camera]);
  return null;
}

interface ShipControls {
  moveForward: (speed?: number) => void;
  moveBackward: (speed?: number) => void;
}

const Ship = forwardRef<
  ShipControls,
  {
    islandPositions: [number, number, number][];
    onProgress?: (idx: number) => void;
    onDock?: (idx: number | null) => void;
  }
>(({ islandPositions, onProgress, onDock }, ref) => {
  const shipRef = useRef<THREE.Group>(null);
  const [shipModel, setShipModel] = useState<THREE.Group | null>(null);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const { camera } = useThree();
  const scrollAccumRef = useRef(0);
  const isMobile = useIsMobile();
  const zoomRef = useRef(isMobile ? 0.2 : 0.3);
  const autoZoomRef = useRef(1.0);

  const [pausedAtIsland, setPausedAtIsland] = useState<number | null>(null);
  const scrollAccumAtIsland = useRef(0);
  const SCROLL_THRESHOLD_TO_CONTINUE = 40;
  const lastExitedIsland = useRef<number | null>(null);

  const [isReversing, setIsReversing] = useState(false);
  const [isTurning, setIsTurning] = useState(false);
  const turnProgressRef = useRef(1);
  const directionLockDistance = useRef(0);
  const MIN_DISTANCE_BEFORE_TURN = 50;

  const cameraLookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  const focusBlendRef = useRef(0);

  const curve = useMemo(
    () => buildShipPath(islandPositions),
    [islandPositions],
  );
  const totalIslands = islandPositions.length;

  useImperativeHandle(
    ref,
    () => ({
      moveForward: (speed = 1) => {
        if (pausedAtIsland !== null) {
          scrollAccumAtIsland.current += 10 * speed;
          if (scrollAccumAtIsland.current >= SCROLL_THRESHOLD_TO_CONTINUE) {
            lastExitedIsland.current = pausedAtIsland;
            setPausedAtIsland(null);

            scrollAccumAtIsland.current = 0;
          }
          return;
        }

        const delta = 5 * speed;

        if (isReversing && !isTurning && turnProgressRef.current >= 1) {
          directionLockDistance.current += Math.abs(delta);
          if (directionLockDistance.current >= MIN_DISTANCE_BEFORE_TURN) {
            setIsReversing(false);
            setIsTurning(true);
            turnProgressRef.current = 0;
            directionLockDistance.current = 0;
          }
        }

        scrollAccumRef.current += delta;
        scrollAccumRef.current = Math.max(0, scrollAccumRef.current);
        const segmentSize = 400;
        const segments = totalIslands + 1;
        const newTarget = Math.min(
          1,
          Math.max(0, scrollAccumRef.current / (segmentSize * segments)),
        );
        targetProgressRef.current = newTarget;
      },
      moveBackward: (speed = 1) => {
        if (pausedAtIsland !== null) {
          scrollAccumAtIsland.current += 10 * speed;
          if (scrollAccumAtIsland.current >= SCROLL_THRESHOLD_TO_CONTINUE) {
            lastExitedIsland.current = pausedAtIsland;
            setPausedAtIsland(null);

            scrollAccumAtIsland.current = 0;
          }
          return;
        }

        const delta = -5 * speed;

        if (!isReversing && !isTurning && turnProgressRef.current >= 1) {
          directionLockDistance.current += Math.abs(delta);
          if (directionLockDistance.current >= MIN_DISTANCE_BEFORE_TURN) {
            setIsReversing(true);
            setIsTurning(true);
            turnProgressRef.current = 0;
            directionLockDistance.current = 0;
          }
        }

        scrollAccumRef.current += delta;
        scrollAccumRef.current = Math.max(0, scrollAccumRef.current);
        const segmentSize = 400;
        const segments = totalIslands + 1;
        const newTarget = Math.min(
          1,
          Math.max(0, scrollAccumRef.current / (segmentSize * segments)),
        );
        targetProgressRef.current = newTarget;
      },
    }),
    [pausedAtIsland, isReversing, isTurning, totalIslands],
  );

  useEffect(() => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
    );
    dracoLoader.setDecoderConfig({ type: "js" });
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      "/models/Ship.glb",
      (gltf) => {
        const scene = gltf.scene;
        scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat.map) mat.map.minFilter = THREE.LinearFilter;
              mat.needsUpdate = true;
            }
          }
        });

        if (curve) {
          const initialTangent = curve.getTangentAt(0);
          const initialAngle =
            Math.atan2(initialTangent.x, initialTangent.z) - Math.PI / 2;
          scene.rotation.y = initialAngle;
        }

        setShipModel(scene);
        dracoLoader.dispose();
      },
      undefined,
      (error) => console.error("Error loading ship model:", error),
    );
  }, [curve]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        zoomRef.current = Math.max(
          0.4,
          Math.min(2.0, zoomRef.current + event.deltaY * 0.005),
        );
        return;
      }

      const isTrackpad = Math.abs(event.deltaY) < 50;
      const scrollSpeed = isTrackpad ? 0.005 : 0.15;
      const delta = event.deltaY * scrollSpeed;

      if (Math.abs(delta) < 0.5) return;

      directionLockDistance.current += Math.abs(delta);

      const wantsReverse = delta < 0;

      if (
        wantsReverse !== isReversing &&
        turnProgressRef.current >= 1 &&
        directionLockDistance.current >= MIN_DISTANCE_BEFORE_TURN
      ) {
        setIsReversing(wantsReverse);
        setIsTurning(true);
        turnProgressRef.current = 0;
        directionLockDistance.current = 0;
        return;
      }

      if (pausedAtIsland !== null) {
        scrollAccumAtIsland.current += Math.abs(delta);
        if (scrollAccumAtIsland.current >= SCROLL_THRESHOLD_TO_CONTINUE) {
          lastExitedIsland.current = pausedAtIsland;
          setPausedAtIsland(null);

          scrollAccumAtIsland.current = 0;
        } else {
          return;
        }
      }

      scrollAccumRef.current += delta;
      scrollAccumRef.current = Math.max(0, scrollAccumRef.current);

      const segmentSize = 400;
      const segments = totalIslands + 1;

      const newTarget = Math.min(
        1,
        Math.max(0, scrollAccumRef.current / (segmentSize * segments)),
      );
      targetProgressRef.current = newTarget;
    };

    let touchStartY = 0;
    let touchStartDist = 0;

    const getTouchDist = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        touchStartY = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        touchStartDist = getTouchDist(event.touches);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();

      if (event.touches.length === 2) {
        const dist = getTouchDist(event.touches);
        const delta = (touchStartDist - dist) * 0.01;
        zoomRef.current = Math.max(0.4, Math.min(2.0, zoomRef.current + delta));
        touchStartDist = dist;
        return;
      }

      if (event.touches.length === 1) {
        const currentY = event.touches[0].clientY;
        const deltaY = touchStartY - currentY;
        touchStartY = currentY;

        const clampedDelta = Math.max(-15, Math.min(15, deltaY * 0.6));

        if (Math.abs(clampedDelta) < 0.5) return;

        directionLockDistance.current += Math.abs(clampedDelta);

        const wantsReverse = clampedDelta < 0;

        if (
          wantsReverse !== isReversing &&
          turnProgressRef.current >= 1 &&
          directionLockDistance.current >= MIN_DISTANCE_BEFORE_TURN
        ) {
          setIsReversing(wantsReverse);
          setIsTurning(true);
          turnProgressRef.current = 0;
          directionLockDistance.current = 0;
          return;
        }

        scrollAccumRef.current += clampedDelta;

        scrollAccumRef.current = Math.max(0, scrollAccumRef.current);

        const segmentSize = 400;
        const segments = totalIslands + 1;

        const newTarget = Math.min(
          1,
          Math.max(0, scrollAccumRef.current / (segmentSize * segments)),
        );
        targetProgressRef.current = newTarget;
      }
    };

    if (!isMobile) {
      window.addEventListener("wheel", handleWheel, { passive: false });
      window.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
    }
    return () => {
      if (!isMobile) {
        window.removeEventListener("wheel", handleWheel);
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [totalIslands, pausedAtIsland, isReversing, isMobile]);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    if (onProgress) {
      onProgress(scrollAccumRef.current);
    }

    if (isTurning) {
      turnProgressRef.current = Math.min(
        1,
        turnProgressRef.current + delta * 1.2,
      );

      if (turnProgressRef.current >= 1) {
        setIsTurning(false);
      }
    } else {
      progressRef.current +=
        (targetProgressRef.current - progressRef.current) * 0.03;
    }
    const t = Math.max(0, Math.min(1, progressRef.current));

    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);

    if (shipRef.current) {
      const SHIP_HEIGHT_OFFSET = 3;
      shipRef.current.position.set(
        point.x,
        point.y + SHIP_HEIGHT_OFFSET,
        point.z,
      );
      shipRef.current.position.y += Math.sin(elapsed * 1.5) * 0.4;

      globalShipPosition.set(point.x, point.y, point.z);

      const baseAngle = Math.atan2(tangent.x, tangent.z) - Math.PI / 2;
      const targetAngle = isReversing ? baseAngle + Math.PI : baseAngle;

      const currentY = shipRef.current.rotation.y;
      let diff = targetAngle - currentY;
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;

      const turnSpeed = isTurning ? 0.2 : 0.15;
      shipRef.current.rotation.y += diff * turnSpeed;
      shipRef.current.rotation.z = Math.sin(elapsed * 0.8) * 0.03;
    }

    if (pausedAtIsland === null) {
      for (let i = 0; i < islandPositions.length; i++) {
        if (i === lastExitedIsland.current) continue;

        const island = islandPositions[i];
        const distToIsland = Math.sqrt(
          (point.x - island[0]) ** 2 + (point.z - island[2]) ** 2,
        );

        if (distToIsland < 35) {
          setPausedAtIsland(i);

          scrollAccumAtIsland.current = 0;
          if (onDock) onDock(i);
          break;
        }
      }

      if (lastExitedIsland.current !== null) {
        const exitedIsland = islandPositions[lastExitedIsland.current];
        const distToExited = Math.sqrt(
          (point.x - exitedIsland[0]) ** 2 + (point.z - exitedIsland[2]) ** 2,
        );
        if (distToExited > 60) {
          lastExitedIsland.current = null;
        }
      }
    } else {
      const pausedIsland = islandPositions[pausedAtIsland];
      const distToPausedIsland = Math.sqrt(
        (point.x - pausedIsland[0]) ** 2 + (point.z - pausedIsland[2]) ** 2,
      );

      if (distToPausedIsland > 40) {
        setPausedAtIsland(null);

        if (onDock) onDock(null);
      }
    }

    let nearestIslandDist = Infinity;
    islandPositions.forEach((islandPos) => {
      const dist = Math.sqrt(
        (point.x - islandPos[0]) ** 2 + (point.z - islandPos[2]) ** 2,
      );
      if (dist < nearestIslandDist) {
        nearestIslandDist = dist;
      }
    });

    let targetAutoZoom = 1.0;

    if (nearestIslandDist < 40) {
      targetAutoZoom = 0.65;
    } else if (nearestIslandDist < 70) {
      targetAutoZoom = 0.75;
    } else if (nearestIslandDist < 100) {
      targetAutoZoom = 0.9;
    } else {
      targetAutoZoom = 1.1;
    }
    autoZoomRef.current += (targetAutoZoom - autoZoomRef.current) * 0.05;

    const zoom = zoomRef.current * autoZoomRef.current;
    const camHeight = (isMobile ? 30 : 45) * zoom;
    const camDistance = (isMobile ? 70 : 65) * zoom;

    if (pausedAtIsland !== null && pausedAtIsland < islandPositions.length) {
      gsap.to(focusBlendRef, {
        current: 1,
        duration: 0.8,
        ease: "power2.out",
        overwrite: true,
      });
    } else {
      gsap.to(focusBlendRef, {
        current: 0,
        duration: 0.8,
        ease: "power2.inOut",
        overwrite: true,
      });
    }

    const tangentMultiplier = isReversing ? 1 : -1;
    const offsetAmount = isMobile ? 20 : 30;
    const routeCamX = point.x + tangent.x * offsetAmount * tangentMultiplier;
    const routeCamY = camHeight;
    const routeCamZ = point.z + camDistance;

    const lookAtOffset = isMobile ? (isReversing ? -15 : 15) : 0;
    const routeLookAt = new THREE.Vector3(point.x + lookAtOffset, 5, point.z);

    let islandCamX = routeCamX;
    let islandCamY = routeCamY;
    let islandCamZ = routeCamZ;
    let islandLookAt = routeLookAt.clone();

    if (pausedAtIsland !== null && pausedAtIsland < islandPositions.length) {
      const island = islandPositions[pausedAtIsland];
      islandCamX = island[0] - 40;
      islandCamY = 45;
      islandCamZ = island[2] + 40;
      islandLookAt = new THREE.Vector3(island[0], island[1], island[2]);
    }

    const blend = focusBlendRef.current;
    const targetCamX = routeCamX + (islandCamX - routeCamX) * blend;
    const targetCamY = routeCamY + (islandCamY - routeCamY) * blend;
    const targetCamZ = routeCamZ + (islandCamZ - routeCamZ) * blend;

    const targetLookX =
      routeLookAt.x + (islandLookAt.x - routeLookAt.x) * blend;
    const targetLookY =
      routeLookAt.y + (islandLookAt.y - routeLookAt.y) * blend;
    const targetLookZ =
      routeLookAt.z + (islandLookAt.z - routeLookAt.z) * blend;

    const camFollowSpeed = isMobile ? 0.4 : 0.6;

    gsap.to(camera.position, {
      x: targetCamX,
      y: targetCamY,
      z: targetCamZ,
      duration: camFollowSpeed,
      ease: "power1.out",
      overwrite: true,
    });

    gsap.to(cameraLookAtTarget.current, {
      x: targetLookX,
      y: targetLookY,
      z: targetLookZ,
      duration: camFollowSpeed,
      ease: "power1.out",
      overwrite: true,
      onUpdate: () => {
        camera.lookAt(cameraLookAtTarget.current);
      },
    });
  });

  if (!shipModel) return null;

  return (
    <group>
      <group ref={shipRef} position={[0, 150, 0]}>
        <primitive
          object={shipModel}
          scale={[20, 20, 20]}
          rotation={[0, 0, 0]}
        />
        <WakeEffect />
      </group>
      <PathLine curve={curve} />
    </group>
  );
});

function WakeEffect() {
  const wakeRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<
    {
      mesh: THREE.Mesh;
      age: number;
      maxAge: number;
    }[]
  >([]);
  const spawnTimer = useRef(0);

  const geometry = useMemo(() => new THREE.RingGeometry(0.3, 1.2, 16), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  );

  useFrame((_, delta) => {
    if (!wakeRef.current) return;

    spawnTimer.current += delta;

    if (spawnTimer.current > 0.15) {
      spawnTimer.current = 0;

      const ring = new THREE.Mesh(geometry.clone(), material.clone());
      ring.position.set(0 + (Math.random() - 0.5) * 0.5, -4.5, 2);
      ring.rotation.x = -Math.PI / 2;
      ring.scale.set(1, 1, 1);

      const worldPos = new THREE.Vector3();
      ring.position.copy(ring.position);
      wakeRef.current.localToWorld(worldPos.copy(ring.position));

      const scene = wakeRef.current.parent?.parent;
      if (scene) {
        ring.position.copy(worldPos);
        ring.position.y = 0.3;
        scene.add(ring);
        particlesRef.current.push({ mesh: ring, age: 0, maxAge: 2.5 });
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

      const scale = 1 + life * 6;
      p.mesh.scale.set(scale, scale, scale);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - life);

      return true;
    });
  });

  return <group ref={wakeRef} />;
}

function MobileControls({
  shipControls,
}: {
  shipControls: React.RefObject<ShipControls | null>;
}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const speedRef = useRef(1);
  const directionRef = useRef<"forward" | "backward" | null>(null);

  const stopMovement = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    speedRef.current = 1;
    directionRef.current = null;
  }, []);

  const startMovement = useCallback(
    (direction: "forward" | "backward") => {
      stopMovement();

      directionRef.current = direction;
      speedRef.current = 1;

      if (direction === "forward") {
        shipControls.current?.moveForward(speedRef.current);
      } else {
        shipControls.current?.moveBackward(speedRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (directionRef.current === null) {
          stopMovement();
          return;
        }

        speedRef.current = Math.min(2.5, speedRef.current + 0.08);

        if (directionRef.current === "forward") {
          shipControls.current?.moveForward(speedRef.current);
        } else {
          shipControls.current?.moveBackward(speedRef.current);
        }
      }, 50);
    },
    [shipControls, stopMovement],
  );

  useEffect(() => {
    return () => {
      stopMovement();
    };
  }, [stopMovement]);

  const handlePointerDown = (
    direction: "forward" | "backward",
    element: HTMLElement,
  ) => {
    element.style.transform = "scale(0.95)";
    element.style.background = "rgba(139, 69, 19, 1)";
    startMovement(direction);
  };

  const handlePointerUp = (element: HTMLElement) => {
    element.style.transform = "scale(1)";
    element.style.background = "rgba(139, 69, 19, 0.9)";
    stopMovement();
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "40px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        zIndex: 1000,
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      <button
        type="button"
        onTouchStart={(e) => {
          e.preventDefault();
          handlePointerDown("forward", e.currentTarget);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handlePointerUp(e.currentTarget);
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          handlePointerUp(e.currentTarget);
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          handlePointerDown("forward", e.currentTarget);
        }}
        onMouseUp={(e) => {
          e.preventDefault();
          handlePointerUp(e.currentTarget);
        }}
        onMouseLeave={(e) => {
          handlePointerUp(e.currentTarget);
        }}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "rgba(139, 69, 19, 0.9)",
          border: "3px solid #8B4513",
          color: "#f0e6d2",
          fontSize: "28px",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          transition: "all 0.2s",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          touchAction: "none",
        }}
      >
        ▲
      </button>

      <button
        type="button"
        onTouchStart={(e) => {
          e.preventDefault();
          handlePointerDown("backward", e.currentTarget);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handlePointerUp(e.currentTarget);
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          handlePointerUp(e.currentTarget);
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          handlePointerDown("backward", e.currentTarget);
        }}
        onMouseUp={(e) => {
          e.preventDefault();
          handlePointerUp(e.currentTarget);
        }}
        onMouseLeave={(e) => {
          handlePointerUp(e.currentTarget);
        }}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "rgba(139, 69, 19, 0.9)",
          border: "3px solid #8B4513",
          color: "#f0e6d2",
          fontSize: "28px",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          transition: "all 0.2s",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          touchAction: "none",
        }}
      >
        ▼
      </button>
    </div>
  );
}

function StartLine() {
  const startPos = ISLAND_POSITIONS[0];
  const x = startPos[0] - 80;
  const z = startPos[2];

  const points = useMemo(
    () => [
      new THREE.Vector3(x, 0.5, z - 40),
      new THREE.Vector3(x, 0.5, z + 40),
    ],
    [x, z],
  );

  return (
    <group>
      <Line
        points={points}
        color="#f0e6d2"
        lineWidth={3}
        dashed
        dashScale={3}
        gapSize={1.5}
        opacity={0.7}
        transparent
      />
      {/* Start marker flag */}
      <group position={[x, 0, z - 40]}>
        {/* Pole */}
        <mesh position={[0, 10, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 20, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Flag */}
        <mesh position={[4, 17, 0]}>
          <planeGeometry args={[8, 5]} />
          <meshStandardMaterial
            color="#aa2222"
            side={THREE.DoubleSide}
            emissive="#661111"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
      {/* Start glow marker */}
      <mesh position={[x, 1.5, z]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[3, 5.5, 24]} />
        <meshBasicMaterial
          color="#f0e6d2"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function TimelineScene() {
  const [selectedEvent, setSelectedEvent] = useState<{
    day: number;
    title: string;
    time: string;
  } | null>(null);
  const isMobile = useIsMobile();
  const shipControlsRef = useRef<ShipControls>(null);
  const bgOverlayRef = useRef<HTMLDivElement>(null);
  const allowRecoveryRef = useRef(true);
  const webglLossHandlerRef = useRef<((event: Event) => void) | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeDock, setActiveDock] = useState<number | null>(null);

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

  const handleShipProgress = (scrollAccum: number) => {
    if (bgOverlayRef.current) {
      // Convert raw scroll accumulation to island index for sky gradient
      const segmentSize = 400;
      const islandIndex = scrollAccum / segmentSize;
      bgOverlayRef.current.style.backgroundImage = getSkyGradient(islandIndex);
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
      <div
        ref={bgOverlayRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "linear-gradient(to bottom, #87CEEB 0%, #E0F6FF 50%, #87CEEB 100%)",
          transition: "background-image 2s ease",
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes noteGlow {
          0%, 100% {
            filter: drop-shadow(0 8px 16px rgba(0,0,0,0.6));
          }
          50% {
            filter: drop-shadow(0 8px 24px rgba(255,215,0,0.8)) drop-shadow(0 0 12px rgba(255,215,0,0.6));
          }
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
          const handleContextLost = (event: Event) => {
            event.preventDefault();
            if (!allowRecoveryRef.current) return;
            console.log("WebGL context lost, attempting recovery...");
            setTimeout(() => window.location.reload(), 1000);
          };
          webglLossHandlerRef.current = handleContextLost;
          glCanvasRef.current = gl.domElement;
          gl.domElement.addEventListener("webglcontextlost", handleContextLost);
        }}
      >
        <ambientLight intensity={3} />
        <directionalLight position={[100, 100, 100]} intensity={8} />
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
          onDock={setActiveDock}
        />
      </Canvas>

      {isMobile && <MobileControls shipControls={shipControlsRef} />}

      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent
          className="sm:max-w-95 border-none bg-transparent shadow-none p-0 overflow-visible [&>button]:hidden"
          style={{ perspective: "1000px" }}
        >
          {selectedEvent &&
            (() => {
              const theme = DAY_THEMES[selectedEvent.day] || DAY_THEMES[1];
              return (
                <div
                  style={{
                    background: theme.parchment,
                    backgroundImage: `
                      linear-gradient(to bottom right, rgba(0,0,0,0.05), transparent)
                    `,
                    borderRadius: "6px",
                    padding: isMobile ? "24px 20px 20px" : "36px 30px 30px",
                    position: "relative",
                    boxShadow:
                      "0 20px 50px rgba(0,0,0,0.5), inset 0 0 60px rgba(139, 69, 19, 0.2)",
                    border: `3px solid ${theme.border}`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-18px",
                      left: "-18px",
                      width: "56px",
                      height: "56px",
                      backgroundColor: theme.wax,
                      backgroundImage: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25), transparent 60%)`,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.15)",
                      boxShadow:
                        "0 4px 12px rgba(0,0,0,0.5), inset 0 -2px 6px rgba(0,0,0,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: "rotate(-10deg)",
                      zIndex: 20,
                    }}
                  >
                    <div
                      style={{
                        color: "rgba(255,255,255,0.9)",
                        fontSize: "11px",
                        fontFamily: "var(--font-cinzel), serif",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                        letterSpacing: "1px",
                      }}
                    >
                      Day {selectedEvent.day}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        inset: "4px",
                        borderRadius: "50%",
                        border: "1.5px dashed rgba(255,255,255,0.35)",
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "12px",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      border: `1.5px solid ${theme.border}`,
                      background: "rgba(0,0,0,0.08)",
                      color: theme.ink,
                      fontSize: "16px",
                      fontFamily: "var(--font-pirata), serif",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.2s",
                      zIndex: 20,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(0,0,0,0.15)";
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.background = "rgba(0,0,0,0.15)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "rgba(0,0,0,0.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.background = "rgba(0,0,0,0.08)";
                    }}
                  >
                    ✕
                  </button>

                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      width: "16px",
                      height: "16px",
                      borderTop: `2px solid ${theme.border}`,
                      borderLeft: `2px solid ${theme.border}`,
                      opacity: 0.4,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      right: "8px",
                      width: "16px",
                      height: "16px",
                      borderBottom: `2px solid ${theme.border}`,
                      borderRight: `2px solid ${theme.border}`,
                      opacity: 0.4,
                    }}
                  />

                  <DialogHeader>
                    <DialogTitle
                      className={`text-center mb-2 mt-2 ${isMobile ? "text-2xl" : "text-3xl"}`}
                      style={{
                        fontFamily: "var(--font-pirata), serif",
                        color: theme.ink,
                        lineHeight: 1.2,
                      }}
                    >
                      {selectedEvent.title.replace(/\\n/g, " ")}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                      Event details
                    </DialogDescription>
                  </DialogHeader>

                  <div
                    className="w-4/5 mx-auto h-px my-4"
                    style={{
                      background: `linear-gradient(to right, transparent, ${theme.border}, transparent)`,
                      opacity: 0.5,
                    }}
                  />

                  <div
                    className="flex items-center justify-center gap-3"
                    style={{
                      color: theme.ink,
                      fontFamily: "var(--font-cinzel), serif",
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{theme.icon}</span>
                    <span style={{ fontSize: "18px", fontWeight: 700 }}>
                      {selectedEvent.time}
                    </span>
                    <span style={{ fontSize: "14px", opacity: 0.6 }}>
                      • Day {selectedEvent.day}
                    </span>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
