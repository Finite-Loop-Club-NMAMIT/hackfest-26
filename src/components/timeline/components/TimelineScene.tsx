'use client';

import { Html, Line } from '@react-three/drei';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { events } from '~/constants/timeline';

extend({ Water });

// Hook to detect mobile device
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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


const DAY_THEMES: Record<number, { parchment: string; border: string; ink: string; wax: string; icon: string }> = {
  1: { parchment: '#f0e6d2', border: '#8B4513', ink: '#2A1A0A', wax: '#aa2222', icon: '⚓' },
  2: { parchment: '#e8dac0', border: '#654321', ink: '#2A1A0A', wax: '#e69b00', icon: '⚔️' },
  3: { parchment: '#e3dcd2', border: '#556B2F', ink: '#2A1A0A', wax: '#228822', icon: '💎' },
};

const SCROLL_SENSITIVITY = 0.05; // How much scroll wheel affects the "target"
const BOAT_MOVEMENT_SPEED = 0.02; // Boat speed in "progress units" per second (0.1 = ~10s for full path)
const BOAT_MAX_SCROLL_DELTA = 5; // Max scroll input per event
const DOCK_SIDE = 25; // Side offset for dock markers



function Ocean() {
  const waterRef = useRef<Water>(null);

  const waterGeometry = useMemo(() => new THREE.PlaneGeometry(3000, 3000, 2, 2), []);


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
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/waternormals.jpg',
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
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


const islandModelCache: { model: THREE.Group | null; loading: boolean; callbacks: ((m: THREE.Group) => void)[] } = {
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
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  dracoLoader.setDecoderConfig({ type: 'js' });
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    '/models/island.glb',
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
      islandModelCache.callbacks.forEach((cb) => { cb(scene); });
      islandModelCache.callbacks = [];
      dracoLoader.dispose();
    },
    undefined,
    (error) => console.error('Error loading island model:', error)
  );
}


const finalIslandModelCache: { model: THREE.Group | null; loading: boolean; callbacks: ((m: THREE.Group) => void)[] } = {
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
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  dracoLoader.setDecoderConfig({ type: 'js' });
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    '/models/Island-Final.glb',
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
      finalIslandModelCache.callbacks.forEach((cb) => { cb(scene); });
      finalIslandModelCache.callbacks = [];
      dracoLoader.dispose();
    },
    undefined,
    (error) => console.error('Error loading final island model:', error)
  );
}


let globalPausedIsland: number | null = null;

type TimelineEvent = { day: number; title: string; time: string };

function EventLabel({
  event,
  isFirstOfDay,
  onSelect,
  islandIndex,
}: {
  event: TimelineEvent;
  isFirstOfDay: boolean;
  onSelect: (e: TimelineEvent) => void;
  islandIndex: number;
}) {
  const theme = DAY_THEMES[event.day] || DAY_THEMES[1];
  const displayTitle = event.title.replace(/\\n/g, '\n').replace(/\n/g, ' ');
  const [isNearShip, setIsNearShip] = useState(false);
  const isMobile = useIsMobile();


  useFrame(() => {

    const isFocused = globalPausedIsland === islandIndex;
    setIsNearShip(isFocused);
  });

  return (
    <Html
      center
      distanceFactor={isMobile ? 35 : 55}
      position={[0, 18, 0]}
      style={{
        pointerEvents: 'none',
        cursor: 'default',
      }}
      zIndexRange={[100, 0]}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(event);
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          userSelect: 'none',
          filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.6))',
          cursor: 'pointer',
          pointerEvents: 'auto',
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          animation: isNearShip ? 'noteGlow 2s ease-in-out infinite' : 'none',
          background: 'none',
          border: 'none',
          padding: 0,
        }}
        className="hover:scale-110 active:scale-95"
      >
        {isFirstOfDay && (
          <div
            style={{
              position: 'absolute',
              top: '-15px',
              right: '-10px',
              width: '32px',
              height: '32px',
              background: `radial-gradient(circle at 30% 30%, ${theme.wax}, darken(${theme.wax}, 20%))`,
              backgroundColor: theme.wax,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              transform: 'rotate(15deg)',
            }}
          >
            <div style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '14px',
              fontFamily: 'var(--font-cinzel), serif',
              fontWeight: 700,
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}>
              {event.day}
            </div>
            <div style={{
              position: 'absolute', inset: '3px', borderRadius: '50%',
              border: '1px dashed rgba(255,255,255,0.4)',
              opacity: 0.6
            }} />
          </div>
        )}

        {/* Parchment Card */}
        <div
          style={{
            background: theme.parchment,
            backgroundImage: `
              linear-gradient(to bottom right, rgba(0,0,0,0.05), transparent),
              url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http:
            `,
            color: theme.ink,
            padding: isMobile ? '8px 12px' : '12px 16px',
            minWidth: isMobile ? '80px' : '120px',
            maxWidth: isMobile ? '140px' : '180px',
            textAlign: 'center',
            position: 'relative',
            borderRadius: '2px',
            boxShadow: `
              inset 0 0 20px rgba(139, 69, 19, 0.15),
              0 0 0 1px rgba(0,0,0,0.1),
              0 2px 4px rgba(0,0,0,0.1)
            `,
            clipPath: 'polygon(2% 0%, 98% 2%, 100% 98%, 0% 100%)',
            border: `1px solid ${theme.border}`,
          }}
        >

          {/* Decorative Corner Borders (SVG or CSS) */}
          <div style={{
            position: 'absolute', top: '4px', left: '4px',
            width: '8px', height: '8px',
            borderTop: `2px solid ${theme.border}`,
            borderLeft: `2px solid ${theme.border}`,
            opacity: 0.6
          }} />
          <div style={{
            position: 'absolute', bottom: '4px', right: '4px',
            width: '8px', height: '8px',
            borderBottom: `2px solid ${theme.border}`,
            borderRight: `2px solid ${theme.border}`,
            opacity: 0.6
          }} />

          {/* Event Title */}
          <div
            style={{
              fontSize: isMobile ? '14px' : '18px',
              fontFamily: 'var(--font-pirata), serif',
              fontWeight: 400,
              lineHeight: '1.1',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {displayTitle}
          </div>

          {/* Separator */}
          <div style={{
            height: '1px',
            width: '60%',
            margin: '0 auto 6px auto',
            background: `linear-gradient(to right, transparent, ${theme.border}, transparent)`,
            opacity: 0.5,
          }} />

          {/* Time & Icon */}
          <div
            style={{
              fontSize: isMobile ? '10px' : '12px',
              fontFamily: 'var(--font-cinzel), serif',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#5c4033',
            }}
          >
            <span style={{ fontSize: '14px' }}>{theme.icon}</span>
            {event.time}
          </div>
        </div>

        {/* 'X' Marks the spot / Anchor Line */}
        <div style={{
          marginTop: '4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {/* Dotted line */}
          <div style={{
            width: '2px',
            height: '15px',
            borderLeft: `2px dashed rgba(255, 255, 255, 0.6)`,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))'
          }} />
          {/* Red X */}
          <div style={{
            color: '#d00',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'var(--font-pirata), serif',
            lineHeight: 1,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            transform: 'translateY(-4px)'
          }}>
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
  islandIndex,
}: {
  position: [number, number, number];
  event?: TimelineEvent;
  isFirstOfDay?: boolean;
  onSelect: (e: TimelineEvent) => void;
  islandIndex: number;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    loadIslandModel((m) => setModel(m));
  }, []);

  if (!model) return null;

  return (
    <group position={position}>
      <primitive
        object={model.clone()}
        scale={[40, 40, 40]}
      />
      {event && (
        <EventLabel
          event={event}
          isFirstOfDay={!!isFirstOfDay}
          onSelect={onSelect}
          islandIndex={islandIndex}
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
  islandIndex,
}: {
  position: [number, number, number];
  event?: TimelineEvent;
  isFirstOfDay?: boolean;
  onSelect: (e: TimelineEvent) => void;
  islandIndex: number;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    loadFinalIslandModel((m) => setModel(m));
  }, []);

  if (!model) return null;

  return (
    <group position={position}>
      <primitive
        object={model.clone()}
        scale={[90, 90, 90]}
      />
      {event && (
        <EventLabel
          event={event}
          isFirstOfDay={!!isFirstOfDay}
          onSelect={onSelect}
          islandIndex={islandIndex}
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
              // biome-ignore lint/suspicious/noArrayIndexKey: <cant use anything else without restructuring data>
              key={index}
              position={pos}
              event={event}
              isFirstOfDay={isFirstOfDay}
              onSelect={onSelect}
              islandIndex={index}
            />
          );
        }

        return (
          <Island
            // biome-ignore lint/suspicious/noArrayIndexKey: <cant use anything else without restructuring data>
            key={index}
            position={pos}
            event={event}
            isFirstOfDay={isFirstOfDay}
            onSelect={onSelect}
            islandIndex={index}
          />
        );
      })}
    </>
  );
}

function buildShipPath(islandPositions: [number, number, number][]): THREE.CatmullRomCurve3 {
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
    } else {

      waypoints.push(new THREE.Vector3(island[0] + 30, 5, island[2] + 25));
    }
  }

  return new THREE.CatmullRomCurve3(waypoints, false, 'centripetal', 0.5);
}

// ─── Dynamic Background Logic ──────────────────────────────────────────────
function getSkyOverlayColor(progressIndex: number): string {
  // Keyframes for background overlay (Index -> Color & Opacity)
  // Transparent = Day (shows sunny.jpeg). Dark/Colors = Night/Sunset.
  const keyframes = [
    { idx: 0, col: 'rgba(0, 0, 0, 0)' },       // Day 1 10AM (Clear)
    { idx: 4, col: 'rgba(0, 0, 0, 0)' },       // Day 1 4PM
    { idx: 5, col: 'rgba(255, 100, 50, 0.5)' }, // Day 1 5PM (Sunset)
    { idx: 6, col: 'rgba(10, 10, 35, 0.9)' },   // Day 1 8PM (Night)
    { idx: 7, col: 'rgba(10, 10, 35, 0.9)' },   // Day 1 9PM (Night)
    { idx: 7.8, col: 'rgba(255, 100, 50, 0.5)' },// Sunrise transition
    { idx: 8, col: 'rgba(0, 0, 0, 0)' },       // Day 2 8AM (Clear)
    { idx: 11, col: 'rgba(0, 0, 0, 0)' },      // Day 2 4PM
    { idx: 12, col: 'rgba(10, 10, 35, 0.9)' },  // Day 2 8PM (Night)
    { idx: 13, col: 'rgba(10, 10, 35, 0.9)' },  // Day 2 9PM (Night)
    { idx: 13.8, col: 'rgba(255, 100, 50, 0.5)' },// Sunrise transition
    { idx: 14, col: 'rgba(0, 0, 0, 0)' },      // Day 3 7AM (Clear)
    { idx: 20, col: 'rgba(0, 0, 0, 0)' },      // Day 3 End
  ];

  // Find surrounding keyframes
  let lower = keyframes[0];
  let upper = keyframes[keyframes.length - 1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (progressIndex >= keyframes[i].idx && progressIndex < keyframes[i + 1].idx) {
      lower = keyframes[i];
      upper = keyframes[i + 1];
      break;
    }
  }

  // Linear interpolation
  const t = (progressIndex - lower.idx) / (upper.idx - lower.idx || 1);
  const clampedT = Math.max(0, Math.min(1, t));

  // Parse RGBA (Simple regex interaction)
  const parseRGBA = (c: string) => {
    const match = c.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (!match) return [0, 0, 0, 0];
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseFloat(match[4])];
  };

  const c1 = parseRGBA(lower.col);
  const c2 = parseRGBA(upper.col);

  const r = Math.round(c1[0] + (c2[0] - c1[0]) * clampedT);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * clampedT);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * clampedT);
  const a = c1[3] + (c2[3] - c1[3]) * clampedT;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}


// ─── Dock Markers ─────────────────────────────────────────────────────────────
function DockMarkers({ activeIsland }: { activeIsland: number }) {
  return (
    <>
      {ISLAND_POSITIONS.map((pos, i) => {
        const isActive = i === activeIsland;
        return (
          <group key={i} position={[pos[0], 1.5, pos[2] + 25]}>
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

// ─── Path Line & Camera Layers ──────────────────────────────────────────────
function PathLine({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const lineRef = useRef<any>(null);
  const points = useMemo(() => curve.getPoints(300), [curve]);

  // Put path line on layer 1 so Water shader's reflection camera (layer 0 only) doesn't see it (assuming we want to hide it from reflections if possible)
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

function CameraLayerSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.layers.enable(1); // Enable path layer
  }, [camera]);
  return null;
}

function Ship({ islandPositions, onProgress, onDock }: { islandPositions: [number, number, number][], onProgress?: (idx: number) => void, onDock?: (idx: number | null) => void }) {
  const shipRef = useRef<THREE.Group>(null);
  const [shipModel, setShipModel] = useState<THREE.Group | null>(null);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const { camera } = useThree();
  const isMobile = useIsMobile();
  const zoomRef = useRef(1);
  const autoZoomRef = useRef(1.0);


  // Navigation State
  const currentIslandRef = useRef(0);
  const scrollAccumRef = useRef(0);
  const scrollCooldownRef = useRef(0);

  // ... (Report progress in useFrame)
  useFrame(() => {
    if (onProgress) {
      // Smoothly report the current visual position index
      // Since progressRef (0-1) maps to the whole path, we map it back to island index approx
      // But simpler: just report scrollAccumRef which is the 'target' index float, 
      // or better, interpolate it based on progressRef if we want exact visual sync.
      // For background, scrollAccumRef is responsive enough.
      onProgress(scrollAccumRef.current);
    }
  });

  // Camera/Focus State
  const [pausedAtIsland, setPausedAtIsland] = useState<number | null>(null);
  const lastExitedIsland = useRef<number | null>(null);
  const focusBlendRef = useRef(0);
  const cameraLookAtTarget = useRef(new THREE.Vector3(0, 0, 0));

  // Rotation State (from -2)
  const scrollDirectionRef = useRef<'forward' | 'backward'>('forward');
  const isReversingRef = useRef(false);
  const targetReversingRef = useRef(false);
  const turnProgressRef = useRef(1);

  const curve = useMemo(() => buildShipPath(islandPositions), [islandPositions]);
  const totalIslands = islandPositions.length;

  // Pre-compute precise t values for each island's dock point (Adapted)
  const dockProgressValues = useMemo(() => {
    const samples = 2000;
    // Target the "dock" area used in buildShipPath (approx z+25, x center)
    const dockTargets = islandPositions.map(pos =>
      new THREE.Vector3(pos[0], 5, pos[2] + 25)
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
    const t = dockProgressValues[index] ?? 0;
    return Math.max(0, Math.min(0.999, t));
  };

  // Sync initial position (from -1)
  const initialSynced = useRef(false);
  useEffect(() => {
    if (!initialSynced.current && dockProgressValues.length > 0) {
      // Start at first island
      const preciseT = getProgressForIsland(0);
      progressRef.current = preciseT;
      targetProgressRef.current = preciseT;
      initialSynced.current = true;
    }
  }, [dockProgressValues]);

  useEffect(() => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      '/models/Ship.glb',
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
          const initialAngle = Math.atan2(initialTangent.x, initialTangent.z) - Math.PI / 2;
          scene.rotation.y = initialAngle;
        }

        setShipModel(scene);
        dracoLoader.dispose();
      },
      undefined,
      (error) => console.error('Error loading ship model:', error)
    );
  }, []);


  // Listen for jump events (from -1)
  useEffect(() => {
    const handleJump = (e: any) => {
      const index = e.detail.index;
      currentIslandRef.current = index;

      // Update direction for rotation logic
      const newTarget = getProgressForIsland(index);
      const direction = newTarget > progressRef.current ? 'forward' : 'backward';

      if (scrollDirectionRef.current !== direction) {
        scrollDirectionRef.current = direction;
        targetReversingRef.current = direction === 'backward';
        turnProgressRef.current = 0;
      }

      targetProgressRef.current = newTarget;
      scrollAccumRef.current = index;
    };
    window.addEventListener('timeline-scroll-to', handleJump);
    return () => window.removeEventListener('timeline-scroll-to', handleJump);
  }, [islandPositions, dockProgressValues]);

  // Scroll Handling (Merged: Snap Logic + Zoom)
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        zoomRef.current = Math.max(0.4, Math.min(2.0, zoomRef.current + event.deltaY * 0.005));
        return;
      }

      // Snap Logic from -1
      const now = Date.now();
      if (now - scrollCooldownRef.current < 200) return;

      const clampedDelta = Math.max(-BOAT_MAX_SCROLL_DELTA, Math.min(BOAT_MAX_SCROLL_DELTA, event.deltaY));
      const sensitivity = SCROLL_SENSITIVITY;

      const oldAccum = scrollAccumRef.current;
      scrollAccumRef.current += clampedDelta * sensitivity;
      scrollAccumRef.current = Math.max(0, Math.min(islandPositions.length - 1, scrollAccumRef.current));

      const targetIsland = Math.round(scrollAccumRef.current);

      if (targetIsland !== currentIslandRef.current) {
        // Determine direction based on island change
        const direction = targetIsland > currentIslandRef.current ? 'forward' : 'backward';

        if (scrollDirectionRef.current !== direction) {
          scrollDirectionRef.current = direction;
          targetReversingRef.current = direction === 'backward';
          turnProgressRef.current = 0;
        }

        currentIslandRef.current = targetIsland;
        targetProgressRef.current = getProgressForIsland(targetIsland);
        scrollCooldownRef.current = now;
      }
    };

    // Touch handling (simplified for now to match wheel logic roughly)
    const handleTouchStart = (event: TouchEvent) => {
      // Placeholder for touch start
    };
    const handleTouchMove = (event: TouchEvent) => {
      // Placeholder for touch move
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [islandPositions, dockProgressValues]);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    // MOVEMENT: Lerp to target (from -1 logic)
    // MOVEMENT: Constant Speed Logic
    const diff = targetProgressRef.current - progressRef.current;

    // Determine movement speed based on BOAT_MOVEMENT_SPEED (units per second)
    const moveStep = BOAT_MOVEMENT_SPEED * delta;

    if (Math.abs(diff) < moveStep) {
      progressRef.current = targetProgressRef.current;
    } else {
      progressRef.current += Math.sign(diff) * moveStep;
    }

    const t = Math.max(0, Math.min(0.999, progressRef.current));

    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);

    // SHIP VISUALS (from -2)
    if (shipRef.current) {
      // Turn Animation Logic (from -2)
      if (turnProgressRef.current < 1) {
        turnProgressRef.current = Math.min(1, turnProgressRef.current + delta * 1.2);
        if (turnProgressRef.current >= 0.5) isReversingRef.current = targetReversingRef.current;
      }

      const SHIP_HEIGHT_OFFSET = 3;
      shipRef.current.position.set(point.x, point.y + SHIP_HEIGHT_OFFSET, point.z);
      shipRef.current.position.y += Math.sin(elapsed * 1.5) * 0.4; // Wave bobbing

      // Rotation
      const forwardAngle = Math.atan2(tangent.x, tangent.z) - Math.PI / 2;
      const reverseAngle = forwardAngle + Math.PI;

      const currentTargetAngle = isReversingRef.current ? reverseAngle : forwardAngle;
      const newTargetAngle = targetReversingRef.current ? reverseAngle : forwardAngle;

      let targetAngle = currentTargetAngle;
      if (turnProgressRef.current < 1) {
        const turnEase = turnProgressRef.current;
        let angleDiff = newTargetAngle - currentTargetAngle;
        // Angle wrapping
        if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        targetAngle = currentTargetAngle + angleDiff * turnEase;
      }

      const currentY = shipRef.current.rotation.y;
      let rotDiff = targetAngle - currentY;
      if (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      if (rotDiff < -Math.PI) rotDiff += Math.PI * 2;

      const turnSpeed = 0.15;
      shipRef.current.rotation.y += rotDiff * turnSpeed;
      shipRef.current.rotation.z = Math.sin(elapsed * 0.8) * 0.03; // Roll
    }

    // CAMERA LOGIC (Strictly preserved from -2)

    // 1. Detect Paused Island (Logic from -2)
    // We keep this because it drives the focusBlend
    if (pausedAtIsland === null) {
      for (let i = 0; i < islandPositions.length; i++) {
        if (i === lastExitedIsland.current) continue;

        const island = islandPositions[i];
        // Distance check
        const distToIsland = Math.sqrt((point.x - island[0]) ** 2 + (point.z - island[2]) ** 2);

        if (distToIsland < 60) {
          setPausedAtIsland(i);
          if (onDock) onDock(i);
          break;
        }
      }

      // Clear lastExitedIsland
      if (lastExitedIsland.current !== null) {
        const exitedIsland = islandPositions[lastExitedIsland.current];
        const distToExited = Math.sqrt((point.x - exitedIsland[0]) ** 2 + (point.z - exitedIsland[2]) ** 2);
        if (distToExited > 120) lastExitedIsland.current = null;
      }
    } else {
      const pausedIsland = islandPositions[pausedAtIsland];
      const distToPausedIsland = Math.sqrt((point.x - pausedIsland[0]) ** 2 + (point.z - pausedIsland[2]) ** 2);

      if (distToPausedIsland > 60) {
        lastExitedIsland.current = pausedAtIsland;
        setPausedAtIsland(null);
        if (onDock) onDock(null);
      }
    }

    // 2. Auto Zoom Logic (from -2)
    let nearestIslandDist = Infinity;
    islandPositions.forEach((islandPos) => {
      const dist = Math.sqrt((point.x - islandPos[0]) ** 2 + (point.z - islandPos[2]) ** 2);
      if (dist < nearestIslandDist) nearestIslandDist = dist;
    });

    let targetAutoZoom = 1.0;
    if (nearestIslandDist < 40) targetAutoZoom = 0.65;
    else if (nearestIslandDist < 70) targetAutoZoom = 0.75;
    else if (nearestIslandDist < 100) targetAutoZoom = 0.9;
    else targetAutoZoom = 1.1;

    autoZoomRef.current += (targetAutoZoom - autoZoomRef.current) * 0.05;

    const zoom = zoomRef.current * autoZoomRef.current;
    const camHeight = (isMobile ? 18 : 15) * zoom;
    const camDistance = (isMobile ? 45 : 25) * zoom;

    // 3. Focus Blend Animation
    if (pausedAtIsland !== null && pausedAtIsland < islandPositions.length) {
      gsap.to(focusBlendRef, {
        current: 1,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: true
      });
    } else {
      gsap.to(focusBlendRef, {
        current: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        overwrite: true
      });
    }

    // 4. Camera Positioning (from -2)
    const tangentMultiplier = isReversingRef.current ? 1 : -1;
    const offsetAmount = isMobile ? 20 : 30;
    const routeCamX = point.x + tangent.x * offsetAmount * tangentMultiplier;
    const routeCamY = camHeight;
    const routeCamZ = point.z + camDistance;

    // Fixed look-at target (always look at ship position)
    const routeLookAt = new THREE.Vector3(point.x, 5, point.z);

    // Island focus camera positions
    let islandCamX = routeCamX;
    let islandCamY = routeCamY;
    let islandCamZ = routeCamZ;
    let islandLookAt = routeLookAt.clone();

    if (pausedAtIsland !== null && pausedAtIsland < islandPositions.length) {
      const island = islandPositions[pausedAtIsland];
      islandCamX = island[0] - 55;
      islandCamY = 50;
      islandCamZ = island[2] + 55;
      islandLookAt = new THREE.Vector3(island[0], island[1], island[2]);
    }

    // Blend between route camera and island focus camera
    const blend = focusBlendRef.current;
    const targetCamX = routeCamX + (islandCamX - routeCamX) * blend;
    const targetCamY = routeCamY + (islandCamY - routeCamY) * blend;
    const targetCamZ = routeCamZ + (islandCamZ - routeCamZ) * blend;

    const targetLookX = routeLookAt.x + (islandLookAt.x - routeLookAt.x) * blend;
    const targetLookY = routeLookAt.y + (islandLookAt.y - routeLookAt.y) * blend;
    const targetLookZ = routeLookAt.z + (islandLookAt.z - routeLookAt.z) * blend;

    const camFollowSpeed = isMobile ? 0.4 : 0.6;

    gsap.to(camera.position, {
      x: targetCamX,
      y: targetCamY,
      z: targetCamZ,
      duration: camFollowSpeed,
      ease: 'power1.out',
      overwrite: true
    });

    gsap.to(cameraLookAtTarget.current, {
      x: targetLookX,
      y: targetLookY,
      z: targetLookZ,
      duration: camFollowSpeed,
      ease: 'power1.out',
      overwrite: true,
      onUpdate: () => {
        camera.lookAt(cameraLookAtTarget.current);
      }
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
        {/* Boat wake / foam trail */}
        <WakeEffect />
        <Html position={[0, 20, 0]} center>
          <div style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '4px', fontSize: '10px', pointerEvents: 'none' }}>
            d: {shipRef.current ? (
              Math.round(Math.sqrt(
                (shipRef.current.position.x - islandPositions[Math.round(scrollAccumRef.current) || 0][0]) ** 2 +
                (shipRef.current.position.z - islandPositions[Math.round(scrollAccumRef.current) || 0][2]) ** 2
              ))
            ) : '?'}
            <br />
            idx: {Math.round(scrollAccumRef.current)}
          </div>
        </Html>
      </group>
      <PathLine curve={curve} />
    </group>
  );
}

function WakeEffect() {
  const wakeRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<{
    mesh: THREE.Mesh;
    age: number;
    maxAge: number;
  }[]>([]);
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
    []
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


export default function TimelineScene() {
  const [selectedEvent, setSelectedEvent] = useState<{ day: number; title: string; time: string } | null>(null);
  const isMobile = useIsMobile();
  const bgOverlayRef = useRef<HTMLDivElement>(null);
  const [activeDock, setActiveDock] = useState<number | null>(null);

  const handleShipProgress = (progressIdx: number) => {
    if (bgOverlayRef.current) {
      bgOverlayRef.current.style.backgroundColor = getSkyOverlayColor(progressIdx);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
      {/* Base Image */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'url(/sunny.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }} />

      {/* Dynamic Time Overlay */}
      <div ref={bgOverlayRef} style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0)',
        backgroundBlendMode: 'multiply',
        transition: 'background-color 1.5s ease', // Smooth CSS transition
        pointerEvents: 'none',
      }} />

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
          powerPreference: 'high-performance',
          antialias: true,
          stencil: false,
          depth: true,
          alpha: true,
        }}
        style={{ background: 'transparent' }}
        onCreated={({ gl, scene }) => {
          // Fog from -1: 0x1a2a3a, near 400, far 1200
          scene.fog = new THREE.Fog(0x1a2a3a, 400, 1200);
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.log('WebGL context lost, attempting recovery...');
            setTimeout(() => window.location.reload(), 1000);
          });
        }}
      >
        <ambientLight intensity={3} />
        <directionalLight position={[100, 100, 100]} intensity={8} />
        <directionalLight position={[-100, 80, -50]} intensity={5} />
        <directionalLight position={[0, 60, 100]} intensity={5} />

        <CameraLayerSetup />
        <Ocean />
        <DockMarkers activeIsland={activeDock ?? -1} />
        <Islands onSelect={setSelectedEvent} />
        <Ship islandPositions={ISLAND_POSITIONS} onProgress={handleShipProgress} onDock={setActiveDock} />
      </Canvas>

      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent
          className="sm:max-w-95 border-none bg-transparent shadow-none p-0 overflow-visible [&>button]:hidden"
          style={{ perspective: '1000px' }}
        >
          {selectedEvent && (() => {
            const theme = DAY_THEMES[selectedEvent.day] || DAY_THEMES[1];
            return (
              <div
                style={{
                  background: theme.parchment,
                  backgroundImage: `
                      linear-gradient(to bottom right, rgba(0,0,0,0.05), transparent),
                      url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http:
                    `,
                  borderRadius: '6px',
                  padding: isMobile ? '24px 20px 20px' : '36px 30px 30px',
                  position: 'relative',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 60px rgba(139, 69, 19, 0.2)',
                  border: `3px solid ${theme.border}`,
                }}
              >
                {/* Wax Seal — top-left */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    left: '-18px',
                    width: '56px',
                    height: '56px',
                    backgroundColor: theme.wax,
                    backgroundImage: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25), transparent 60%)`,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 -2px 6px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'rotate(-10deg)',
                    zIndex: 20,
                  }}
                >
                  <div style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-cinzel), serif',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    letterSpacing: '1px',
                  }}>
                    Day {selectedEvent.day}
                  </div>
                  <div style={{
                    position: 'absolute', inset: '4px', borderRadius: '50%',
                    border: '1.5px dashed rgba(255,255,255,0.35)',
                  }} />
                </div>

                {/* Custom close button */}
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '12px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: `1.5px solid ${theme.border}`,
                    background: 'rgba(0,0,0,0.08)',
                    color: theme.ink,
                    fontSize: '16px',
                    fontFamily: 'var(--font-pirata), serif',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                    zIndex: 20,
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.15)'; }}
                  onFocus={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.15)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; }}
                  onBlur={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; }}
                >
                  ✕
                </button>

                {/* Corner decorations */}
                <div style={{ position: 'absolute', top: '8px', left: '8px', width: '16px', height: '16px', borderTop: `2px solid ${theme.border}`, borderLeft: `2px solid ${theme.border}`, opacity: 0.4 }} />
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '16px', height: '16px', borderBottom: `2px solid ${theme.border}`, borderRight: `2px solid ${theme.border}`, opacity: 0.4 }} />

                {/* Title */}
                <DialogHeader>
                  <DialogTitle
                    className={`text-center mb-2 mt-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}
                    style={{
                      fontFamily: 'var(--font-pirata), serif',
                      color: theme.ink,
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedEvent.title.replace(/\\n/g, ' ')}
                  </DialogTitle>
                  <DialogDescription className="sr-only">Event details</DialogDescription>
                </DialogHeader>

                {/* Divider */}
                <div className="w-4/5 mx-auto h-px my-4" style={{ background: `linear-gradient(to right, transparent, ${theme.border}, transparent)`, opacity: 0.5 }} />

                {/* Time + Day */}
                <div className="flex items-center justify-center gap-3" style={{ color: theme.ink, fontFamily: 'var(--font-cinzel), serif' }}>
                  <span style={{ fontSize: '20px' }}>{theme.icon}</span>
                  <span style={{ fontSize: '18px', fontWeight: 700 }}>{selectedEvent.time}</span>
                  <span style={{ fontSize: '14px', opacity: 0.6 }}>• Day {selectedEvent.day}</span>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
