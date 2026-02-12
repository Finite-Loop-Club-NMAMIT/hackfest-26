export let globalShipProgress = 0;
export let globalPausedIsland: number | null = null;

export function setGlobalShipProgress(progress: number) {
  globalShipProgress = progress;
}

export function setGlobalPausedIsland(island: number | null) {
  globalPausedIsland = island;
}
