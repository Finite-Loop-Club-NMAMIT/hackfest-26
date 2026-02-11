'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import gsap from 'gsap';

extend({ Water });

// Seeded random number generator for consistent island positions
function seededRandom(seed: number) {
  let value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function Ocean() {
  const waterRef = useRef<any>(null);
  
  const waterGeometry = useMemo(() => new THREE.PlaneGeometry(500, 500), []);
  
  const water = useMemo(() => {
    const waterInstance = new Water(waterGeometry, {
      textureWidth: 128,
      textureHeight: 128,
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
    if (waterRef.current && waterRef.current.material && waterRef.current.material.uniforms) {
      waterRef.current.material.uniforms.time.value += delta * 0.5;
      
      // Make ocean follow camera for infinite effect
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

function Island({ position }: { position: [number, number, number] }) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const islandRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    
    // Set the path to the Draco decoder
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(dracoLoader);
    
    loader.load(
      '/models/island.glb',
      (gltf) => {
        const scene = gltf.scene;
        
        // Optimize the model
        scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            
            // Simplify materials to reduce GPU load
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material = mesh.material[0];
              }
              
              const material = mesh.material as THREE.MeshStandardMaterial;
              if (material.map) material.map.minFilter = THREE.LinearFilter;
              material.needsUpdate = true;
            }
            
            if (mesh.geometry) {
              mesh.geometry.computeBoundingSphere();
            }
          }
        });
        
        setModel(scene);
      },
      undefined,
      (error) => {
        console.error('Error loading island model:', error);
      }
    );
    
    return () => {
      dracoLoader.dispose();
    };
  }, []);

  if (!model) return null;

  return (
    <primitive 
      ref={islandRef}
      object={model.clone()} 
      position={position}
      scale={[40, 40, 40]}
    />
  );
}

function Islands() {
  const islandPositions = useMemo(() => {
    const random = seededRandom(12345); // Fixed seed for consistency
    const positions: [number, number, number][] = [];
    const numIslands = 15; // More islands for better coverage
    const spacing = 80; // Closer spacing so 3+ islands fit in view

    for (let i = 0; i < numIslands; i++) {
      // Start from X=50 to avoid left edge, add random offset
      const x = 50 + i * spacing + (random() - 0.5) * 40;
      // Fixed Y position - all islands at same height above water
      const y = 10;
      // Constrain Z to keep islands within frame (-30 to 30 range)
      const z = (random() - 0.5) * 60;
      positions.push([x, y, z]);
    }

    return positions;
  }, []);

  return (
    <>
      {islandPositions.map((pos, index) => (
        <Island key={index} position={pos} />
      ))}
    </>
  );
}

function Ship({ islandPositions }: { islandPositions: [number, number, number][] }) {
  const shipRef = useRef<THREE.Mesh>(null);
  const targetIslandIndex = useRef(0);
  const { camera } = useThree();
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      
      // Debounce scroll to make it less sensitive
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      scrollTimeout.current = setTimeout(() => {
        // Move to next or previous island based on scroll direction
        if (event.deltaY > 0) {
          // Scroll down - move to next island
          targetIslandIndex.current = Math.min(targetIslandIndex.current + 1, islandPositions.length - 1);
        } else {
          // Scroll up - move to previous island
          targetIslandIndex.current = Math.max(targetIslandIndex.current - 1, 0);
        }
      }, 100); // 100ms debounce
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [islandPositions.length]);
  
  useFrame(() => {
    if (shipRef.current && islandPositions.length > 0) {
      const targetPos = islandPositions[targetIslandIndex.current];
      
      // Smoothly move ship to target island
      shipRef.current.position.x += (targetPos[0] - shipRef.current.position.x) * 0.03;
      shipRef.current.position.y = targetPos[1] + 5; // Slightly above island
      shipRef.current.position.z += (targetPos[2] - shipRef.current.position.z) * 0.03;
      
      // Camera follows ship ONLY in X direction, stays fixed in Y and Z
      const targetCameraX = shipRef.current.position.x;
      
      camera.position.x += (targetCameraX - camera.position.x) * 0.05;
      camera.position.y = 30; // Fixed height
      camera.position.z = 30; // Fixed Z position
      
      // Camera always looks straight down at origin
      camera.lookAt(camera.position.x, 0, 0);
    }
  });
  
  return (
    <mesh ref={shipRef} position={[50, 13, 0]}>
      <boxGeometry args={[3, 2, 5]} />
      <meshStandardMaterial color="black" />
    </mesh>
  );
}


function CameraController() {
  // Camera movement is now handled by Ship component
  return null;
}

export default function TimelineScene() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
      <Canvas 
        camera={{ fov: 75 }}
        gl={{ 
          powerPreference: 'high-performance',
          antialias: false,
          stencil: false,
          depth: true
        }}
        style={{ background: '#87CEEB' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            console.log('WebGL context lost, attempting recovery...');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          });
        }}
      >
        <CameraController />
        {/* Increased lighting for better island visibility */}
        <ambientLight intensity={4} />
        <directionalLight position={[100, 100, 100]} intensity={10} />
        <directionalLight position={[-100, 80, -50]} intensity={8} />
        <directionalLight position={[0, 50, 100]} intensity={8} />
        <Ocean />
        <Islands />
        <Ship islandPositions={[
          [50, 5, 0],
          [130, 3, -20],
          [210, 6, 30],
          [290, 2, -10],
          [370, 7, 20],
          [450, 4, -30],
          [530, 5, 15],
          [610, 3, -25],
          [690, 6, 10],
          [770, 2, -15],
          [850, 7, 25],
          [930, 4, -20],
          [1010, 5, 5],
          [1090, 3, -35],
          [1170, 6, 20],
        ]} />
      </Canvas>
    </div>
  );
}
