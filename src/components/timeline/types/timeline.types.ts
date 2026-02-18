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

export interface EventLabelProps {
  event: TimelineEvent;
  isFirstOfDay: boolean;
  onSelect: (e: TimelineEvent) => void;
  islandIndex: number;
  totalIslands: number;
}

export interface IslandProps {
  position: IslandPosition;
  event?: TimelineEvent;
  isFirstOfDay?: boolean;
  onSelect: (e: TimelineEvent) => void;
  islandIndex: number;
}
