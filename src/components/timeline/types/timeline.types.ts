export interface TimelineEvent {
  day: number;
  title: string;
  time: string;
}

export interface DayTheme {
  parchment: string;
  border: string;
  ink: string;
  wax: string;
  icon: string;
}

export type IslandPosition = [number, number, number];

export interface ShipControls {
  moveForward: (speed?: number) => void;
  moveBackward: (speed?: number) => void;
}

export interface EventLabelProps {
  event: TimelineEvent;
  onSelect: (e: TimelineEvent) => void;
  position: IslandPosition;
}

export interface IslandProps {
  position: IslandPosition;
  event?: TimelineEvent;
  isFirstOfDay?: boolean;
  onSelect: (e: TimelineEvent) => void;
}
