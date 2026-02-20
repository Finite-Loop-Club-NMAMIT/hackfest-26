"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { triggerWaveTransition } from "~/lib/waveTransition";

type DayNightContextType = {
  isNight: boolean;
  /** Smooth 0.0 (day) → 1.0 (night) progress driven by the wave animation */
  nightProgressRef: React.RefObject<number>;
  toggleTheme: () => void;
};

const DayNightContext = createContext<DayNightContextType | undefined>(
  undefined,
);

export function DayNightProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const [isNight, setIsNight] = useState(false);
  const nightProgressRef = useRef(0);

  useEffect(() => {
    const hours = new Date().getHours();
    const isNightTime = hours < 6 || hours >= 16;
    setIsNight(isNightTime);
    nightProgressRef.current = isNightTime ? 1 : 0;
  }, []);

  const toggleTheme = useCallback(() => {
    const goingToNight = !isNight;

    triggerWaveTransition(
      () => setIsNight(goingToNight),
      (waveProgress: number) => {
        if (goingToNight) {
          nightProgressRef.current = waveProgress;
        } else {
          nightProgressRef.current = 1 - waveProgress;
        }
      },
    );
  }, [isNight]);

  return (
    <DayNightContext.Provider
      value={{ isNight, nightProgressRef, toggleTheme }}
    >
      {children}
    </DayNightContext.Provider>
  );
}

export function useDayNight() {
  const context = useContext(DayNightContext);
  if (context === undefined) {
    throw new Error("useDayNight must be used within a DayNightProvider");
  }
  return context;
}
