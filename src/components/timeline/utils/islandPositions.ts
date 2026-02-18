import type { IslandPosition } from "../types/timeline.types";
import { seededRandom } from "./seededRandom";

export function generateIslandPositions(numIslands: number): IslandPosition[] {
  const random = seededRandom(12345);
  const positions: IslandPosition[] = [];
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
}
