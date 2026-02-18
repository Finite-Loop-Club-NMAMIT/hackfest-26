"use client";

import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";

extend({ Water });

function Ocean() {
  const waterRef = useRef<THREE.Mesh>(null);

  const waterGeometry = useMemo(
    () => new THREE.PlaneGeometry(10000, 10000),
    [],
  );

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
      sunDirection: new THREE.Vector3(),
      sunColor: 0xfff6d5,
      waterColor: 0x1aa0d8,
      distortionScale: 16.0,
      fog: false,
    });

    waterInstance.material.transparent = true;
    waterInstance.material.opacity = 0.95;
    return waterInstance;
  }, [waterGeometry]);

  useFrame((_state, delta) => {
    if (waterRef.current) {
      (waterRef.current.material as THREE.ShaderMaterial).uniforms.time.value +=
        delta * 0.5;
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

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 100, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

export default function WaterBackground() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ fov: 75 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <CameraSetup />
        <ambientLight intensity={0.8} />
        <directionalLight position={[0, 10, 0]} intensity={1.2} />
        <Ocean />
      </Canvas>
    </div>
  );
}
