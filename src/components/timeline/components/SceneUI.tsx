"use client";
import { Line } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo } from "react";
import * as THREE from "three";
import { ISLAND_POSITIONS } from "./Islands";

export const PathLine = memo(function PathLine({
  curve,
}: {
  curve: THREE.CatmullRomCurve3;
}) {
  const points = useMemo(() => curve.getPoints(300), [curve]);
  return (
    <Line
      ref={(r) => {
        if (r) (r as unknown as THREE.Object3D).layers.set(1);
      }}
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
});

export function CameraLayerSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.layers.enable(1);
  }, [camera]);
  return null;
}

export const StartLine = memo(function StartLine() {
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
      <group position={[x, 0, z - 40]}>
        <mesh position={[0, 10, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 20, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
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
});
