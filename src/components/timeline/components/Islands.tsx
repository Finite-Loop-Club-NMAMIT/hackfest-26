"use client";
import { memo, useEffect, useState } from "react";
import * as THREE from "three";
import { events } from "~/constants/timeline";
import type { IslandProps, TimelineEvent } from "../types/timeline.types";
import { generateIslandPositions } from "../utils/islandPositions";
import { loadFinalIslandModel, loadIslandModel } from "../utils/modelLoaders";
import { EventLabel } from "./EventLabel";

export const ISLAND_POSITIONS = generateIslandPositions(events.length);

const Island = memo(function Island({
  position,
  event,
  onSelect,
}: IslandProps) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  useEffect(() => {
    loadIslandModel(setModel);
  }, []);
  if (!model) return null;
  return (
    <group position={position}>
      <primitive object={model.clone()} scale={[40, 40, 40]} />
      {event && (
        <EventLabel event={event} onSelect={onSelect} position={position} />
      )}
    </group>
  );
});

const FinalIsland = memo(function FinalIsland({
  position,
  event,
  onSelect,
}: IslandProps) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  useEffect(() => {
    loadFinalIslandModel(setModel);
  }, []);
  if (!model) return null;
  return (
    <group position={position}>
      <primitive object={model.clone()} scale={[90, 90, 90]} />
      {event && (
        <EventLabel event={event} onSelect={onSelect} position={position} />
      )}
    </group>
  );
});

export function Islands({
  onSelect,
}: {
  onSelect: (e: TimelineEvent) => void;
}) {
  const seenDays = new Set<number>();
  const lastIndex = ISLAND_POSITIONS.length - 1;
  return (
    <>
      {ISLAND_POSITIONS.map((pos, index) => {
        const event = events[index];
        const isFirstOfDay = event ? !seenDays.has(event.day) : false;
        if (event) seenDays.add(event.day);
        const key = `island-${pos[0]}-${pos[2]}`;
        if (index === lastIndex)
          return (
            <FinalIsland
              key={key}
              position={pos}
              event={event}
              isFirstOfDay={isFirstOfDay}
              onSelect={onSelect}
            />
          );
        return (
          <Island
            key={key}
            position={pos}
            event={event}
            isFirstOfDay={isFirstOfDay}
            onSelect={onSelect}
          />
        );
      })}
    </>
  );
}

export const DockMarkers = memo(function DockMarkers({
  activeIsland,
}: {
  activeIsland: number;
}) {
  return (
    <>
      {ISLAND_POSITIONS.map((pos, i) => {
        const isActive = i === activeIsland;
        return (
          <group
            key={`dock-${pos[0]}-${pos[2]}`}
            position={[pos[0], 1.5, pos[2] + 25]}
          >
            <mesh>
              <sphereGeometry args={[isActive ? 3 : 2, 12, 12]} />
              <meshStandardMaterial
                color={isActive ? "#ffdd44" : "#66ccff"}
                emissive={isActive ? "#ffaa00" : "#44aaff"}
                emissiveIntensity={isActive ? 2.5 : 1.2}
                transparent
                opacity={isActive ? 1 : 0.7}
              />
            </mesh>
            <mesh rotation-x={-Math.PI / 2}>
              <ringGeometry
                args={[isActive ? 3.5 : 2.5, isActive ? 5.5 : 4, 24]}
              />
              <meshBasicMaterial
                color={isActive ? "#ffaa00" : "#44aaff"}
                transparent
                opacity={isActive ? 0.5 : 0.25}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
});
