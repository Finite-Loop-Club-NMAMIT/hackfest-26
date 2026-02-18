import * as THREE from "three";
import type { IslandPosition } from "../types/timeline.types";

export function buildShipPath(
  islandPositions: IslandPosition[],
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
    } else {
      waypoints.push(new THREE.Vector3(island[0] + 30, 5, island[2] + 25));
    }
  }

  return new THREE.CatmullRomCurve3(waypoints, false, "centripetal", 0.5);
}
