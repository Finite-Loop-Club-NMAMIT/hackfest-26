import type { DayTheme } from "../types/timeline.types";

export const DAY_THEMES: Record<number, DayTheme> = {
  1: {
    parchment: "#f0e6d2",
    border: "#8B4513",
    ink: "#2A1A0A",
    wax: "#aa2222",
    icon: "⚓",
  },
  2: {
    parchment: "#e8dac0",
    border: "#654321",
    ink: "#2A1A0A",
    wax: "#e69b00",
    icon: "⚔️",
  },
  3: {
    parchment: "#e3dcd2",
    border: "#556B2F",
    ink: "#2A1A0A",
    wax: "#228822",
    icon: "💎",
  },
};

// Sky gradient per island index — [topColor, bottomColor]
export const ISLAND_SKY: Record<number, [string, string]> = {
  0: ["#5BB8D4", "#C8EAF8"],
  1: ["#4AACCC", "#B8E4F5"],
  2: ["#42A8C8", "#B0E0F2"],
  3: ["#5AAECC", "#C0E8F5"],
  4: ["#D4903A", "#F0C870"],
  5: ["#C85020", "#F08040"],
  6: ["#1A0A35", "#3A1A60"],
  7: ["#050510", "#0D1020"],
  8: ["#D06030", "#F0A050"],
  9: ["#42A8C8", "#B0E0F2"],
  10: ["#5AAECC", "#C0E8F5"],
  11: ["#D4903A", "#F0C870"],
  12: ["#1A0A35", "#3A1A60"],
  13: ["#050510", "#0D1020"],
  14: ["#A04020", "#D08050"],
  15: ["#D06030", "#F0A050"],
  16: ["#5BB8D4", "#C8EAF8"],
  17: ["#42A8C8", "#B0E0F2"],
  18: ["#5AAECC", "#C0E8F5"],
  19: ["#5AAECC", "#C0E8F5"],
  20: ["#6AAECC", "#D0E8F5"],
};

export function getSkyForIsland(idx: number): [string, string] {
  return ISLAND_SKY[idx] ?? ["#87CEEB", "#E0F6FF"];
}
