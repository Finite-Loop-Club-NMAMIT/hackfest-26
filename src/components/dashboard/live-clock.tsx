"use client";

import { useEffect, useState } from "react";

export function LiveClock() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInternetTime = async () => {
      try {
        const response = await fetch("https://worldtimeapi.org/api/ip");
        const data = (await response.json()) as { datetime: string };
        setCurrentTime(new Date(data.datetime));
      } catch {
        setCurrentTime(new Date());
      } finally {
        setIsLoading(false);
      }
    };

    void fetchInternetTime();
    const syncInterval = setInterval(() => void fetchInternetTime(), 60000);
    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    if (!currentTime) return;
    const timer = setInterval(() => {
      setCurrentTime((prev) => (prev ? new Date(prev.getTime() + 1000) : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentTime]);

  if (isLoading || !currentTime) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-12 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-40 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 shadow-lg">
      <div className="text-lg font-medium text-muted-foreground">
        {currentTime.toLocaleDateString([], { weekday: "long" })}
      </div>
      <div className="mt-1 text-5xl font-bold tracking-tight text-foreground">
        {currentTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })}
      </div>
      <div className="mt-2 text-base text-muted-foreground">
        {currentTime.toLocaleDateString([], {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </div>
    </div>
  );
}
