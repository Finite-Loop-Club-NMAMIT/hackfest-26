"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type DayNightContextType = {
  isNight: boolean;
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

  useEffect(() => {
    const hours = new Date().getHours();
    const isNightTime = hours < 6 || hours >= 16;
    setIsNight(isNightTime);
  }, []);

  const toggleTheme = () => {
    setIsNight((prev) => !prev);
  };

  return (
    <DayNightContext.Provider value={{ isNight, toggleTheme }}>
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
