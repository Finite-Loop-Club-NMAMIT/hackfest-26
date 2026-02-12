'use client';

import { useRef, useEffect, useMemo, useState, createContext, useContext } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import gsap from 'gsap';
import { events } from '~/constants/timeline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '~/components/ui/dialog';

extend({ Water });

function seededRandom(seed: number) {
  let value = seed;
  return function () {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

//Day colors for event labels
const DAY_THEMES: Record<number, { parchment: string; border: string; ink: string; wax: string; icon: string }> = {
  1: { parchment: '#f0e6d2', border: '#8B4513', ink: '#2A1A0A', wax: '#aa2222', icon: '⚓' },
  2: { parchment: '#e8dac0', border: '#654321', ink: '#2A1A0A', wax: '#e69b00', icon: '⚔️' },
  3: { parchment: '#e3dcd2', border: '#556B2F', ink: '#2A1A0A', wax: '#228822', icon: '💎' },
};

//Ocean — enhanced realistic water
function Ocean() {
  const waterRef = useRef<any>(null);

  const waterGeometry = useMemo(() => new THREE.PlaneGeometry(3000, 3000, 2, 2), []);

  // Compute a proper sun direction for specular highlights
  const sunDirection = useMemo(() => {
    const dir = new THREE.Vector3();
    const theta = Math.PI * (0.45 - 0.5); // Sun elevation
    const phi = 2 * Math.PI * (0.205 - 0.5); // Sun azimuth
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
      sunColor: 0xfff5e0,      // Warm golden sunlight
      waterColor: 0x006994,     // Vibrant ocean blue
      distortionScale: 4.0,     // Moderate distortion for realism
      fog: true,                // Blend with scene fog
      alpha: 0.95,              // Slight transparency at edges
    });
    // Enhance material for realism
    waterInstance.material.transparent = true;
    return waterInstance;
  }, [waterGeometry, sunDirection]);

  useFrame((state, delta) => {
    if (waterRef.current?.material?.uniforms) {
      // Animate water at a natural pace
      waterRef.current.material.uniforms.time.value += delta * 0.6;

      // Subtle sun direction shift over time for dynamic lighting
      const elapsed = state.clock.elapsedTime;
      const dynamicSun = waterRef.current.material.uniforms.sunDirection.value;
      dynamicSun.x = Math.cos(elapsed * 0.02) * 0.8;
      dynamicSun.y = 0.45 + Math.sin(elapsed * 0.01) * 0.05;
      dynamicSun.z = Math.sin(elapsed * 0.02) * 0.8;
      dynamicSun.normalize();

      // Follow camera for infinite ocean illusion
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

//Island Model Loader
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
      islandModelCache.callbacks.forEach((cb) => cb(scene));
      islandModelCache.callbacks = [];
      dracoLoader.dispose();
    },
    undefined,
    (error) => console.error('Error loading island model:', error)
  );
}

// Final Island Model Loader
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
      finalIslandModelCache.callbacks.forEach((cb) => cb(scene));
      finalIslandModelCache.callbacks = [];
      dracoLoader.dispose();
    },
    undefined,
    (error) => console.error('Error loading final island model:', error)
  );
}

// Shared ship progress ref
let globalShipProgress = 0;
let globalPausedIsland: number | null = null; // Track which island is currently focused

function EventLabel({
  event,
  isFirstOfDay,
  onSelect,
  islandIndex,
  totalIslands,
}: {
  event: { day: number; title: string; time: string };
  isFirstOfDay: boolean;
  onSelect: (e: any) => void;
  islandIndex: number;
  totalIslands: number;
}) {
  const theme = DAY_THEMES[event.day] || DAY_THEMES[1];
  const displayTitle = event.title.replace(/\\n/g, '\n').replace(/\n/g, ' ');
  const [isNearShip, setIsNearShip] = useState(false);
  
  // Check if THIS island is currently in focus
  useFrame(() => {
    // The island glows only when it's the focused island
    const isFocused = globalPausedIsland === islandIndex;
    setIsNearShip(isFocused);
  });

  return (
    <Html
      center
      distanceFactor={55}
      position={[0, 18, 0]}
      style={{
        pointerEvents: 'none', // Wrapper is none
        cursor: 'default',
      }}
      zIndexRange={[100, 0]}
    >
      <div
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
              url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.1'/%3E%3C/svg%3E")
            `,
            color: theme.ink,
            padding: '12px 16px',
            minWidth: '120px',
            maxWidth: '180px',
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
              fontSize: '18px',
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
              fontSize: '12px',
              fontFamily: 'var(--font-cinzel), serif',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#5c4033', // Sepia-toned text
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
      </div>
    </Html>
  );
}

// ─── Island with label ───────────────────────────────────────────────────────
function Island({
  position,
  event,
  isFirstOfDay,
  onSelect,
  islandIndex,
}: {
  position: [number, number, number];
  event?: { day: number; title: string; time: string };
  isFirstOfDay?: boolean;
  onSelect: (e: any) => void;
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
          totalIslands={ISLAND_POSITIONS.length}
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
  event?: { day: number; title: string; time: string };
  isFirstOfDay?: boolean;
  onSelect: (e: any) => void;
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
          totalIslands={ISLAND_POSITIONS.length}
        />
      )}
    </group>
  );
}

const ISLAND_POSITIONS: [number, number, number][] = (() => {
  const random = seededRandom(12345);
  const positions: [number, number, number][] = [];
  const numIslands = events.length;
  const spacing = 180; // Increased from 130 for more distance between islands

  for (let i = 0; i < numIslands; i++) {
    const isLast = i === numIslands - 1;
    
    // Create Candy Crush style winding pattern
    // Islands alternate: left -> center -> right -> center -> left (like the image)
    const baseX = 60 + i * spacing;
    
    // Determine which "lane" this island is in (left, center, or right)
    const cycle = i % 6; // 6-island cycle for smooth winding
    let laneZ = 0;
    
    if (cycle === 0 || cycle === 1) {
      laneZ = -60; // Left lane
    } else if (cycle === 2 || cycle === 3) {
      laneZ = 0; // Center lane
    } else {
      laneZ = 60; // Right lane
    }
    
    // Add some randomness within the lane
    const randomOffset = (random() - 0.5) * 20;
    
    const x = baseX;
    const y = isLast ? 25 : 10;
    const z = laneZ + randomOffset;
    
    positions.push([x, y, z]);
  }
  return positions;
})();

function Islands({ onSelect }: { onSelect: (e: any) => void }) {
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

  // Start point before first island
  const first = islandPositions[0];
  waypoints.push(new THREE.Vector3(first[0] - 80, 5, first[2]));

  // Create smooth winding path that passes near each island
  for (let i = 0; i < islandPositions.length; i++) {
    const island = islandPositions[i];
    const isLast = i === islandPositions.length - 1;
    
    // Ship approaches island from the side (offset perpendicular to travel direction)
    // Island is positioned to the LEFT of the path
    const approachX = island[0] - 12; // Before island
    const approachZ = island[2] + 25; // Ship passes close on the RIGHT side (25 units offset)
    
    waypoints.push(new THREE.Vector3(approachX, 5, approachZ));
    
    if (!isLast) {
      // Add waypoint passing by the island
      const passX = island[0] + 12; // After island
      const passZ = island[2] + 25; // Maintain 25-unit offset
      waypoints.push(new THREE.Vector3(passX, 5, passZ));
      
      // Add intermediate waypoint between this island and next for smooth curve
      const nextIsland = islandPositions[i + 1];
      const midX = (island[0] + nextIsland[0]) / 2;
      const midZ = (island[2] + nextIsland[2]) / 2 + 25; // Keep 25-unit offset
      waypoints.push(new THREE.Vector3(midX, 5, midZ));
    } else {
      // Final island - add ending waypoint
      waypoints.push(new THREE.Vector3(island[0] + 30, 5, island[2] + 25));
    }
  }

  return new THREE.CatmullRomCurve3(waypoints, false, 'centripetal', 0.5);
}

function Ship({ islandPositions }: { islandPositions: [number, number, number][] }) {
  const shipRef = useRef<THREE.Group>(null);
  const [shipModel, setShipModel] = useState<THREE.Group | null>(null);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const { camera } = useThree();
  const scrollAccumRef = useRef(0);
  const zoomRef = useRef(0.3); // Start zoomed in
  const hasScrolledRef = useRef(false);
  const zoomOutProgressRef = useRef(0);
  const autoZoomRef = useRef(1.0); // Auto-zoom when near islands
  
  // Island pause states
  const [pausedAtIsland, setPausedAtIsland] = useState<number | null>(null);
  const scrollAccumAtIsland = useRef(0);
  const SCROLL_THRESHOLD_TO_CONTINUE = 100; // Reduced scroll amount needed to continue from island
  
  // U-turn states
  const lastScrollDelta = useRef(0);
  const isReversingRef = useRef(false);
  const uTurnProgressRef = useRef(0);
  const uTurnRotationRef = useRef(0);
  
  // Camera lookAt smoothing and focus blend
  const cameraLookAtTarget = useRef(new THREE.Vector3(0, 0, 0));
  const focusBlendRef = useRef(0); // 0 = route view, 1 = island focus

  const curve = useMemo(() => buildShipPath(islandPositions), [islandPositions]);
  const totalIslands = islandPositions.length;

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
        
        // Set initial rotation to face forward along the path
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

  // Scroll handling — pinch/ctrl+wheel = zoom, normal scroll = sail
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        zoomRef.current = Math.max(0.4, Math.min(2.0, zoomRef.current + event.deltaY * 0.005));
        return;
      }

      const clampedDelta = Math.max(-8, Math.min(8, event.deltaY)); // Further reduced for even higher sensitivity
      
      // Detect direction change for U-turn
      // Positive deltaY = scroll down = forward, Negative deltaY = scroll up = backward
      const isScrollingForward = clampedDelta > 0;
      const wasScrollingForward = lastScrollDelta.current > 0;
      
      if (lastScrollDelta.current !== 0 && isScrollingForward !== wasScrollingForward) {
        // Direction changed - trigger U-turn
        uTurnProgressRef.current = 0;
        isReversingRef.current = !isScrollingForward; // Reversing when scrolling up (backward)
      }
      lastScrollDelta.current = clampedDelta;

      // If paused at island, accumulate scroll to continue
      if (pausedAtIsland !== null) {
        scrollAccumAtIsland.current += Math.abs(clampedDelta);
        if (scrollAccumAtIsland.current >= SCROLL_THRESHOLD_TO_CONTINUE) {
          // Resume movement
          setPausedAtIsland(null);
          scrollAccumAtIsland.current = 0;
        }
        return; // Don't move ship while paused
      }

      scrollAccumRef.current += clampedDelta * 1.5; // Increased multiplier for more travel per scroll
      
      // Prevent negative scroll accumulation at start
      scrollAccumRef.current = Math.max(0, scrollAccumRef.current);

      const segmentSize = 400;
      const segments = totalIslands + 1;

      const newTarget = Math.min(
        1,
        Math.max(0, scrollAccumRef.current / (segmentSize * segments))
      );
      targetProgressRef.current = newTarget;
      
      // On first scroll, trigger zoom out animation
      if (!hasScrolledRef.current) {
        hasScrolledRef.current = true;
      }
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
        // Pinch to zoom
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

        const clampedDelta = Math.max(-15, Math.min(15, deltaY * 2.0));
        scrollAccumRef.current += clampedDelta;
        
        // Prevent negative scroll accumulation at start
        scrollAccumRef.current = Math.max(0, scrollAccumRef.current);

        const segmentSize = 400;
        const segments = totalIslands + 1;

        const newTarget = Math.min(
          1,
          Math.max(0, scrollAccumRef.current / (segmentSize * segments))
        );
        targetProgressRef.current = newTarget;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [totalIslands]);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    
    // Handle U-turn animation
    if (uTurnProgressRef.current < 1.0) {
      uTurnProgressRef.current = Math.min(1.0, uTurnProgressRef.current + delta * 2); // 0.5 second turn
      const turnEase = 1 - Math.pow(1 - uTurnProgressRef.current, 3); // Ease out cubic
      uTurnRotationRef.current = turnEase * Math.PI; // 180 degree turn
    }

    progressRef.current += (targetProgressRef.current - progressRef.current) * 0.03;
    const t = Math.max(0, Math.min(1, progressRef.current));

    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);

    if (shipRef.current) {
      shipRef.current.position.set(point.x, point.y, point.z);
      shipRef.current.position.y += Math.sin(elapsed * 1.5) * 0.4;

      // Ship heading with U-turn rotation
      let baseAngle = Math.atan2(tangent.x, tangent.z) - Math.PI / 2;
      
      // If reversing, face the opposite direction
      if (isReversingRef.current) {
        baseAngle += Math.PI;
      }
      
      // Only apply U-turn rotation during the actual turn animation
      if (uTurnProgressRef.current < 1.0) {
        baseAngle += uTurnRotationRef.current; // Add U-turn rotation only while turning
      }
      
      const currentY = shipRef.current.rotation.y;
      let diff = baseAngle - currentY;
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      shipRef.current.rotation.y += diff * 0.15;
      shipRef.current.rotation.z = Math.sin(elapsed * 0.8) * 0.03;
    }
    
    // Check if ship has reached an island and should pause
    if (pausedAtIsland === null) {
      for (let i = 0; i < islandPositions.length; i++) {
        const island = islandPositions[i];
        const distToIsland = Math.sqrt(
          Math.pow(point.x - island[0], 2) +
          Math.pow(point.z - island[2], 2)
        );
        
        // If very close to island, pause here
        if (distToIsland < 35) {
          setPausedAtIsland(i);
          globalPausedIsland = i; // Update global for glow effect
          scrollAccumAtIsland.current = 0;
          break;
        }
      }
    } else {
      // Check if ship has moved away from paused island (allow exit)
      const pausedIsland = islandPositions[pausedAtIsland];
      const distToPausedIsland = Math.sqrt(
        Math.pow(point.x - pausedIsland[0], 2) +
        Math.pow(point.z - pausedIsland[2], 2)
      );
      
      // If ship is far enough from island, clear pause immediately
      // The blend factor will still smoothly transition the camera back
      if (distToPausedIsland > 40) {
        setPausedAtIsland(null);
        globalPausedIsland = null;
      }
    }

    // Camera follows ship — zoom factor modifies height and distance
    // Check if ship is near any island and auto-zoom
    let nearestIslandDist = Infinity;
    islandPositions.forEach((islandPos) => {
      const dist = Math.sqrt(
        Math.pow(point.x - islandPos[0], 2) +
        Math.pow(point.z - islandPos[2], 2)
      );
      if (dist < nearestIslandDist) {
        nearestIslandDist = dist;
      }
    });
    
    // Dynamic zoom based on distance to nearest island
    // Closer = more zoom, farther = less zoom
    let targetAutoZoom = 1.0;
    let nearestIslandPos = null;
    
    islandPositions.forEach((islandPos) => {
      const dist = Math.sqrt(
        Math.pow(point.x - islandPos[0], 2) +
        Math.pow(point.z - islandPos[2], 2)
      );
      if (dist < nearestIslandDist) {
        nearestIslandDist = dist;
        nearestIslandPos = islandPos;
      }
    });
    
    if (nearestIslandDist < 40) {
      targetAutoZoom = 0.65; // Very close - zoom in a lot
    } else if (nearestIslandDist < 70) {
      targetAutoZoom = 0.75; // Medium distance - zoom in moderately
    } else if (nearestIslandDist < 100) {
      targetAutoZoom = 0.9; // Far - slight zoom
    } else {
      targetAutoZoom = 1.1; // Very far (moving between islands) - zoom out more
    }
    autoZoomRef.current += (targetAutoZoom - autoZoomRef.current) * 0.05;
    
    // Update global ship progress for EventLabel components
    globalShipProgress = t;
    
    const zoom = zoomRef.current * autoZoomRef.current;
    const camHeight = 45 * zoom;
    const camDistance = 65 * zoom;

    // Camera behavior with GSAP-based smooth blending
    if (pausedAtIsland !== null && pausedAtIsland < islandPositions.length) {
      // Blend towards island focus using GSAP
      gsap.to(focusBlendRef, {
        current: 1,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true
      });
    } else {
      // Blend back to route view using GSAP
      gsap.to(focusBlendRef, {
        current: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        overwrite: true
      });
    }
    
    // Calculate route camera position (normal following)
    const routeCamX = point.x - tangent.x * 30;
    const routeCamY = camHeight;
    const routeCamZ = point.z + camDistance;
    
    // Calculate route lookAt target
    let routeLookAt;
    if (progressRef.current < 0.05) {
      routeLookAt = new THREE.Vector3(
        point.x + tangent.x * 15,
        5,
        point.z + tangent.z * 10
      );
    } else if (nearestIslandDist < 60 && nearestIslandPos) {
      routeLookAt = new THREE.Vector3(
        nearestIslandPos[0],
        nearestIslandPos[1] + 5,
        nearestIslandPos[2]
      );
    } else {
      routeLookAt = new THREE.Vector3(
        point.x + tangent.x * 15,
        5,
        point.z + tangent.z * 10
      );
    }
    
    // Calculate island focus camera position and lookAt
    let islandCamX = routeCamX;
    let islandCamY = routeCamY;
    let islandCamZ = routeCamZ;
    let islandLookAt = routeLookAt;
    
    if (pausedAtIsland !== null && pausedAtIsland < islandPositions.length) {
      const island = islandPositions[pausedAtIsland];
      islandCamX = island[0] - 40;
      islandCamY = 45;
      islandCamZ = island[2] + 40;
      islandLookAt = new THREE.Vector3(island[0], island[1], island[2]);
    }
    
    // Blend between route and island camera
    const blend = focusBlendRef.current;
    const targetCamX = routeCamX + (islandCamX - routeCamX) * blend;
    const targetCamY = routeCamY + (islandCamY - routeCamY) * blend;
    const targetCamZ = routeCamZ + (islandCamZ - routeCamZ) * blend;
    
    const targetLookX = routeLookAt.x + (islandLookAt.x - routeLookAt.x) * blend;
    const targetLookY = routeLookAt.y + (islandLookAt.y - routeLookAt.y) * blend;
    const targetLookZ = routeLookAt.z + (islandLookAt.z - routeLookAt.z) * blend;
    
    // Smooth camera movement with GSAP
    gsap.to(camera.position, {
      x: targetCamX,
      y: targetCamY,
      z: targetCamZ,
      duration: 0.6,
      ease: 'power1.out',
      overwrite: true
    });
    
    // Smooth lookAt with GSAP
    gsap.to(cameraLookAtTarget.current, {
      x: targetLookX,
      y: targetLookY,
      z: targetLookZ,
      duration: 0.6,
      ease: 'power1.out',
      overwrite: true,
      onUpdate: () => {
        camera.lookAt(cameraLookAtTarget.current);
      }
    });
    
    // Smooth zoom out on first scroll
    if (hasScrolledRef.current && zoomRef.current < 1.0) {
      zoomOutProgressRef.current += 0.015;
      zoomRef.current = 0.3 + (0.7 * Math.min(1, zoomOutProgressRef.current));
    }
  });

  if (!shipModel) return null;

  return (
    <group ref={shipRef} position={[0, 5, 0]}>
      <primitive
        object={shipModel}
        scale={[15, 15, 15]}
        rotation={[0, 0, 0]}
      />
      {/* Boat wake / foam trail */}
      <WakeEffect />
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

  // Create reusable wake ring geometry + material
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

// Main Scene
export default function TimelineScene() {
  const [selectedEvent, setSelectedEvent] = useState<{ day: number; title: string; time: string } | null>(null);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
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
        camera={{ fov: 55, near: 1, far: 3000 }}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          stencil: false,
          depth: true,
        }}
        style={{ background: '#87CEEB' }}
        onCreated={({ gl, scene }) => {
          scene.fog = new THREE.Fog(0x87CEEB, 200, 800);
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

        <Ocean />
        <Islands onSelect={setSelectedEvent} />
        <Ship islandPositions={ISLAND_POSITIONS} />
      </Canvas>

      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent
          className="sm:max-w-[380px] border-none bg-transparent shadow-none p-0 overflow-visible [&>button]:hidden"
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
                      url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")
                    `,
                    borderRadius: '6px',
                    padding: '36px 30px 30px',
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
                   onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.15)')}
                   onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
                 >
                   ✕
                 </button>

                 {/* Corner decorations */}
                 <div style={{ position: 'absolute', top: '8px', left: '8px', width: '16px', height: '16px', borderTop: `2px solid ${theme.border}`, borderLeft: `2px solid ${theme.border}`, opacity: 0.4 }} />
                 <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '16px', height: '16px', borderBottom: `2px solid ${theme.border}`, borderRight: `2px solid ${theme.border}`, opacity: 0.4 }} />

                 {/* Title */}
                 <DialogHeader>
                   <DialogTitle
                     className="text-center text-3xl mb-2 mt-2"
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
