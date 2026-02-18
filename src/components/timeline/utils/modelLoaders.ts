import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface ModelCache {
  model: THREE.Group | null;
  loading: boolean;
  callbacks: ((m: THREE.Group) => void)[];
}

const islandModelCache: ModelCache = {
  model: null,
  loading: false,
  callbacks: [],
};

const finalIslandModelCache: ModelCache = {
  model: null,
  loading: false,
  callbacks: [],
};

function setupDracoLoader(): DRACOLoader {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
  );
  dracoLoader.setDecoderConfig({ type: "js" });
  return dracoLoader;
}

function optimizeModel(scene: THREE.Group): void {
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
}

export function loadIslandModel(callback: (model: THREE.Group) => void): void {
  if (islandModelCache.model) {
    callback(islandModelCache.model);
    return;
  }
  islandModelCache.callbacks.push(callback);
  if (islandModelCache.loading) return;

  islandModelCache.loading = true;
  const loader = new GLTFLoader();
  const dracoLoader = setupDracoLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    "/models/island.glb",
    (gltf) => {
      const scene = gltf.scene;
      optimizeModel(scene);
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

export function loadFinalIslandModel(
  callback: (model: THREE.Group) => void,
): void {
  if (finalIslandModelCache.model) {
    callback(finalIslandModelCache.model);
    return;
  }
  finalIslandModelCache.callbacks.push(callback);
  if (finalIslandModelCache.loading) return;

  finalIslandModelCache.loading = true;
  const loader = new GLTFLoader();
  const dracoLoader = setupDracoLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    "/models/Island-Final.glb",
    (gltf) => {
      const scene = gltf.scene;
      optimizeModel(scene);
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
