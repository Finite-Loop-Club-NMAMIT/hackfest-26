'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Water } from 'three/examples/jsm/objects/Water.js';
import * as THREE from 'three';
import { useRef, useMemo, useEffect } from 'react';
import { extend } from '@react-three/fiber';

extend({ Water });

function Ocean() {
  const waterRef = useRef<any>(null);
  
  const waterGeometry = useMemo(() => new THREE.PlaneGeometry(10000, 10000), []);
  
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
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x0a4d8c,
      distortionScale: 8.0,
      fog: false,
    });
    
    return waterInstance;
  }, [waterGeometry]);

  useFrame((state, delta) => {
    if (waterRef.current) {
      waterRef.current.material.uniforms.time.value += delta * 0.5;
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
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ fov: 75 }}>
        <CameraSetup />
        <ambientLight intensity={0.8} />
        <directionalLight position={[0, 10, 0]} intensity={1.2} />
        <Ocean />
      </Canvas>
    </div>
  );
}
