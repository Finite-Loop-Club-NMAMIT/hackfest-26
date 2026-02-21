"use client";
import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useIsMobile } from "../hooks/useIsMobile";
import type { IslandPosition, ShipControls } from "../types/timeline.types";
import { globalShipPosition } from "../utils/globalState";
import { buildShipPath } from "../utils/pathBuilder";
import { PathLine } from "./SceneUI";

const SEGMENT_SIZE = 400;

function WakeEffect() {
  const wakeRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<
    { mesh: THREE.Mesh; age: number; maxAge: number }[]
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
      ring.position.set((Math.random() - 0.5) * 0.5, -4.5, 2);
      ring.rotation.x = -Math.PI / 2;
      const worldPos = new THREE.Vector3();
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
      const s = 1 + life * 6;
      p.mesh.scale.set(s, s, s);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - life);
      return true;
    });
  });

  return <group ref={wakeRef} />;
}

interface ShipProps {
  islandPositions: IslandPosition[];
  onProgress?: () => void;
  onDock?: (idx: number | null) => void;
}

export const Ship = forwardRef<ShipControls, ShipProps>(
  ({ islandPositions, onProgress, onDock }, ref) => {
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
    const SCROLL_THRESHOLD = 40;
    const lastExitedIsland = useRef<number | null>(null);

    const [isReversing, setIsReversing] = useState(false);
    const [isTurning, setIsTurning] = useState(false);
    const turnProgressRef = useRef(1);
    const directionLockDist = useRef(0);
    const MIN_TURN_DIST = 50;

    const cameraLookAtTarget = useRef(new THREE.Vector3());
    const focusBlendRef = useRef(0);
    const focusStateRef = useRef(false);

    const curve = useMemo(
      () => buildShipPath(islandPositions),
      [islandPositions],
    );
    const totalIslands = islandPositions.length;
    const totalScroll = SEGMENT_SIZE * (totalIslands + 1);

    useImperativeHandle(
      ref,
      () => ({
        moveForward: (speed = 1) => {
          if (pausedAtIsland !== null) {
            scrollAccumAtIsland.current += 10 * speed;
            if (scrollAccumAtIsland.current >= SCROLL_THRESHOLD) {
              lastExitedIsland.current = pausedAtIsland;
              setPausedAtIsland(null);
              scrollAccumAtIsland.current = 0;
            }
            return;
          }
          const d = 5 * speed;
          if (isReversing && !isTurning && turnProgressRef.current >= 1) {
            directionLockDist.current += d;
            if (directionLockDist.current >= MIN_TURN_DIST) {
              setIsReversing(false);
              setIsTurning(true);
              turnProgressRef.current = 0;
              directionLockDist.current = 0;
            }
          }
          scrollAccumRef.current = Math.max(0, scrollAccumRef.current + d);
          targetProgressRef.current = Math.min(
            1,
            Math.max(0, scrollAccumRef.current / totalScroll),
          );
        },
        moveBackward: (speed = 1) => {
          if (pausedAtIsland !== null) {
            scrollAccumAtIsland.current += 10 * speed;
            if (scrollAccumAtIsland.current >= SCROLL_THRESHOLD) {
              lastExitedIsland.current = pausedAtIsland;
              setPausedAtIsland(null);
              scrollAccumAtIsland.current = 0;
            }
            return;
          }
          const d = 5 * speed;
          if (!isReversing && !isTurning && turnProgressRef.current >= 1) {
            directionLockDist.current += d;
            if (directionLockDist.current >= MIN_TURN_DIST) {
              setIsReversing(true);
              setIsTurning(true);
              turnProgressRef.current = 0;
              directionLockDist.current = 0;
            }
          }
          scrollAccumRef.current = Math.max(0, scrollAccumRef.current - d);
          targetProgressRef.current = Math.min(
            1,
            Math.max(0, scrollAccumRef.current / totalScroll),
          );
        },
      }),
      [pausedAtIsland, isReversing, isTurning, totalScroll],
    );

    useEffect(() => {
      const loader = new GLTFLoader();
      const draco = new DRACOLoader();
      draco.setDecoderPath(
        "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
      );
      draco.setDecoderConfig({ type: "js" });
      loader.setDRACOLoader(draco);
      loader.load(
        "/models/Ship.glb",
        (gltf) => {
          const s = gltf.scene;
          s.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mat = (child as THREE.Mesh)
                .material as THREE.MeshStandardMaterial;
              if (mat?.map) mat.map.minFilter = THREE.LinearFilter;
              if (mat) mat.needsUpdate = true;
            }
          });
          if (curve) {
            const t = curve.getTangentAt(0);
            s.rotation.y = Math.atan2(t.x, t.z) - Math.PI / 2;
          }
          setShipModel(s);
          draco.dispose();
        },
        undefined,
        (err) => console.error("Ship load error:", err),
      );
    }, [curve]);

    useEffect(() => {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          zoomRef.current = Math.max(
            0.4,
            Math.min(2.0, zoomRef.current + e.deltaY * 0.005),
          );
          return;
        }
        const isTrackpad = Math.abs(e.deltaY) < 50;
        const delta = e.deltaY * (isTrackpad ? 0.005 : 0.15);
        if (Math.abs(delta) < 0.5) return;
        directionLockDist.current += Math.abs(delta);
        const wantsRev = delta < 0;
        if (
          wantsRev !== isReversing &&
          turnProgressRef.current >= 1 &&
          directionLockDist.current >= MIN_TURN_DIST
        ) {
          setIsReversing(wantsRev);
          setIsTurning(true);
          turnProgressRef.current = 0;
          directionLockDist.current = 0;
          return;
        }
        if (pausedAtIsland !== null) {
          if (pausedAtIsland === totalIslands - 1 && delta > 0) return;
          scrollAccumAtIsland.current += Math.abs(delta);
          if (scrollAccumAtIsland.current >= SCROLL_THRESHOLD) {
            lastExitedIsland.current = pausedAtIsland;
            setPausedAtIsland(null);
            scrollAccumAtIsland.current = 0;
          } else return;
        }
        scrollAccumRef.current = Math.max(0, scrollAccumRef.current + delta);
        targetProgressRef.current = Math.min(
          1,
          Math.max(0, scrollAccumRef.current / totalScroll),
        );
      };

      let touchStartY = 0;
      let touchStartDist = 0;
      const getTouchDist = (t: TouchList) =>
        t.length < 2
          ? 0
          : Math.sqrt(
              (t[1].clientX - t[0].clientX) ** 2 +
                (t[1].clientY - t[0].clientY) ** 2,
            );
      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) touchStartY = e.touches[0].clientY;
        else if (e.touches.length === 2)
          touchStartDist = getTouchDist(e.touches);
      };
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 2) {
          const d = getTouchDist(e.touches);
          zoomRef.current = Math.max(
            0.4,
            Math.min(2.0, zoomRef.current + (touchStartDist - d) * 0.01),
          );
          touchStartDist = d;
          return;
        }
        if (e.touches.length === 1) {
          const clamped = Math.max(
            -15,
            Math.min(15, (touchStartY - e.touches[0].clientY) * 0.6),
          );
          touchStartY = e.touches[0].clientY;
          if (Math.abs(clamped) < 0.5) return;
          directionLockDist.current += Math.abs(clamped);
          const wantsRev = clamped < 0;
          if (
            wantsRev !== isReversing &&
            turnProgressRef.current >= 1 &&
            directionLockDist.current >= MIN_TURN_DIST
          ) {
            setIsReversing(wantsRev);
            setIsTurning(true);
            turnProgressRef.current = 0;
            directionLockDist.current = 0;
            return;
          }
          if (pausedAtIsland !== null) {
            if (pausedAtIsland === totalIslands - 1 && clamped > 0) return;
            scrollAccumAtIsland.current += Math.abs(clamped);
            if (scrollAccumAtIsland.current >= SCROLL_THRESHOLD) {
              lastExitedIsland.current = pausedAtIsland;
              setPausedAtIsland(null);
              scrollAccumAtIsland.current = 0;
            } else return;
          }
          scrollAccumRef.current = Math.max(
            0,
            scrollAccumRef.current + clamped,
          );
          targetProgressRef.current = Math.min(
            1,
            Math.max(0, scrollAccumRef.current / totalScroll),
          );
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          // Reversed: Up arrow moves forward (positive delta), Down arrow moves back
          const delta = e.key === "ArrowUp" ? 10.0 : -10.0;

          directionLockDist.current += Math.abs(delta);
          const wantsRev = delta < 0;
          if (
            wantsRev !== isReversing &&
            turnProgressRef.current >= 1 &&
            directionLockDist.current >= MIN_TURN_DIST
          ) {
            setIsReversing(wantsRev);
            setIsTurning(true);
            turnProgressRef.current = 0;
            directionLockDist.current = 0;
            return;
          }
          if (pausedAtIsland !== null) {
            if (pausedAtIsland === totalIslands - 1 && delta > 0) return;
            scrollAccumAtIsland.current += Math.abs(delta);
            if (scrollAccumAtIsland.current >= SCROLL_THRESHOLD) {
              lastExitedIsland.current = pausedAtIsland;
              setPausedAtIsland(null);
              scrollAccumAtIsland.current = 0;
            } else return;
          }
          scrollAccumRef.current = Math.max(0, scrollAccumRef.current + delta);
          targetProgressRef.current = Math.min(
            1,
            Math.max(0, scrollAccumRef.current / totalScroll),
          );
        }
      };

      // Always allow keyboard controls even if mobile (e.g. iPad with keyboard)
      window.addEventListener("keydown", handleKeyDown, { passive: false });

      if (!isMobile) {
        window.addEventListener("wheel", handleWheel, { passive: false });
        window.addEventListener("touchstart", handleTouchStart, {
          passive: true,
        });
        window.addEventListener("touchmove", handleTouchMove, {
          passive: false,
        });
      }
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        if (!isMobile) {
          window.removeEventListener("wheel", handleWheel);
          window.removeEventListener("touchstart", handleTouchStart);
          window.removeEventListener("touchmove", handleTouchMove);
        }
      };
    }, [totalIslands, totalScroll, pausedAtIsland, isReversing, isMobile]);

    useFrame((state, delta) => {
      const elapsed = state.clock.elapsedTime;
      if (onProgress) onProgress();

      if (isTurning) {
        turnProgressRef.current = Math.min(
          1,
          turnProgressRef.current + delta * 1.2,
        );
        if (turnProgressRef.current >= 1) setIsTurning(false);
      } else {
        progressRef.current +=
          (targetProgressRef.current - progressRef.current) * 0.03;
      }
      const t = Math.max(0, Math.min(1, progressRef.current));
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      if (shipRef.current) {
        shipRef.current.position.set(
          point.x,
          point.y + 3 + Math.sin(elapsed * 1.5) * 0.4,
          point.z,
        );
        globalShipPosition.set(point.x, point.y, point.z);
        const base = Math.atan2(tangent.x, tangent.z) - Math.PI / 2;
        const target = isReversing ? base + Math.PI : base;
        let diff = target - shipRef.current.rotation.y;
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        shipRef.current.rotation.y += diff * (isTurning ? 0.2 : 0.15);
        shipRef.current.rotation.z = Math.sin(elapsed * 0.8) * 0.03;
      }

      if (pausedAtIsland === null) {
        for (let i = 0; i < islandPositions.length; i++) {
          if (i === lastExitedIsland.current) continue;
          const isle = islandPositions[i];
          const dist = Math.sqrt(
            (point.x - isle[0]) ** 2 + (point.z - isle[2]) ** 2,
          );
          const isLast = i === islandPositions.length - 1;
          if (isLast) {
            if (progressRef.current >= 0.995) {
              setPausedAtIsland(i);
              targetProgressRef.current = 1.0;
              scrollAccumRef.current = totalScroll;
              scrollAccumAtIsland.current = 0;
              if (onDock) onDock(i);
              break;
            }
            continue;
          }
          if (dist < 35) {
            setPausedAtIsland(i);
            targetProgressRef.current = progressRef.current;
            scrollAccumRef.current = progressRef.current * totalScroll;
            scrollAccumAtIsland.current = 0;
            if (onDock) onDock(i);
            break;
          }
        }
        if (lastExitedIsland.current !== null) {
          const isLastEx =
            lastExitedIsland.current === islandPositions.length - 1;
          if (isLastEx) {
            if (progressRef.current < 0.99) lastExitedIsland.current = null;
          } else {
            const ex = islandPositions[lastExitedIsland.current];
            if (Math.sqrt((point.x - ex[0]) ** 2 + (point.z - ex[2]) ** 2) > 60)
              lastExitedIsland.current = null;
          }
        }
      } else {
        const pausedIsle = islandPositions[pausedAtIsland];
        const dist = Math.sqrt(
          (point.x - pausedIsle[0]) ** 2 + (point.z - pausedIsle[2]) ** 2,
        );
        if (dist > (pausedAtIsland === islandPositions.length - 1 ? 150 : 40)) {
          setPausedAtIsland(null);
          if (onDock) onDock(null);
        }
      }

      let nearestDist = Infinity;
      for (const ip of islandPositions) {
        const d = Math.sqrt((point.x - ip[0]) ** 2 + (point.z - ip[2]) ** 2);
        if (d < nearestDist) nearestDist = d;
      }
      const taz =
        nearestDist < 40
          ? 0.65
          : nearestDist < 70
            ? 0.75
            : nearestDist < 100
              ? 0.9
              : 1.1;
      autoZoomRef.current += (taz - autoZoomRef.current) * 0.05;
      const zoom = zoomRef.current * autoZoomRef.current;
      const camH = (isMobile ? 30 : 45) * zoom;
      const camD = (isMobile ? 70 : 65) * zoom;

      const wantsFocus =
        pausedAtIsland !== null && pausedAtIsland < islandPositions.length;
      if (wantsFocus !== focusStateRef.current) {
        focusStateRef.current = wantsFocus;
        gsap.to(focusBlendRef, {
          current: wantsFocus ? 1 : 0,
          duration: 0.8,
          ease: wantsFocus ? "power2.out" : "power2.inOut",
          overwrite: true,
        });
      }

      const tm = isReversing ? 1 : -1;
      const off = isMobile ? 20 : 30;
      const lOff = isMobile ? (isReversing ? -15 : 15) : 0;
      let cx = point.x + tangent.x * off * tm;
      let cy = camH;
      let cz = point.z + camD;
      let lx = point.x + lOff;
      let ly = 5;
      let lz = point.z;

      if (pausedAtIsland !== null && pausedAtIsland < islandPositions.length) {
        const isl = islandPositions[pausedAtIsland];
        const b = focusBlendRef.current;
        cx = cx + (isl[0] - 40 - cx) * b;
        cy = cy + (45 - cy) * b;
        cz = cz + (isl[2] + 40 - cz) * b;
        lx = lx + (isl[0] - lx) * b;
        ly = ly + (isl[1] - ly) * b;
        lz = lz + (isl[2] - lz) * b;
      }

      const spd = isMobile ? 0.4 : 0.6;
      gsap.to(camera.position, {
        x: cx,
        y: cy,
        z: cz,
        duration: spd,
        ease: "power1.out",
        overwrite: true,
      });
      gsap.to(cameraLookAtTarget.current, {
        x: lx,
        y: ly,
        z: lz,
        duration: spd,
        ease: "power1.out",
        overwrite: true,
        onUpdate: () => camera.lookAt(cameraLookAtTarget.current),
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
  },
);

Ship.displayName = "Ship";
