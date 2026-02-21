"use client";
import { useCallback, useEffect, useRef } from "react";
import type { ShipControls } from "../types/timeline.types";

export function MobileControls({
  shipControls,
}: {
  shipControls: React.RefObject<ShipControls | null>;
}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const speedRef = useRef(1);
  const directionRef = useRef<"forward" | "backward" | null>(null);

  const stopMovement = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    speedRef.current = 1;
    directionRef.current = null;
  }, []);

  const startMovement = useCallback(
    (direction: "forward" | "backward") => {
      stopMovement();
      directionRef.current = direction;
      speedRef.current = 1;
      if (direction === "forward")
        shipControls.current?.moveForward(speedRef.current);
      else shipControls.current?.moveBackward(speedRef.current);
      intervalRef.current = setInterval(() => {
        if (!directionRef.current) {
          stopMovement();
          return;
        }
        speedRef.current = Math.min(2.5, speedRef.current + 0.08);
        if (directionRef.current === "forward")
          shipControls.current?.moveForward(speedRef.current);
        else shipControls.current?.moveBackward(speedRef.current);
      }, 50);
    },
    [shipControls, stopMovement],
  );

  useEffect(() => () => stopMovement(), [stopMovement]);

  const handleDown = (dir: "forward" | "backward", el: HTMLElement) => {
    el.style.transform = "scale(0.95)";
    el.style.background = "rgba(139, 69, 19, 1)";
    startMovement(dir);
  };

  const handleUp = (el: HTMLElement) => {
    el.style.transform = "scale(1)";
    el.style.background = "rgba(139, 69, 19, 0.9)";
    stopMovement();
  };

  const btnStyle: React.CSSProperties = {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "rgba(139, 69, 19, 0.9)",
    border: "3px solid #8B4513",
    color: "#f0e6d2",
    fontSize: "28px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    transition: "all 0.2s",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTouchCallout: "none" as React.CSSProperties["WebkitTouchCallout"],
    touchAction: "none",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "40px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        zIndex: 1000,
        userSelect: "none",
      }}
    >
      {(["forward", "backward"] as const).map((dir) => (
        <button
          key={dir}
          type="button"
          style={btnStyle}
          onTouchStart={(e) => {
            e.preventDefault();
            handleDown(dir, e.currentTarget);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleUp(e.currentTarget);
          }}
          onTouchCancel={(e) => {
            e.preventDefault();
            handleUp(e.currentTarget);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            handleDown(dir, e.currentTarget);
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            handleUp(e.currentTarget);
          }}
          onMouseLeave={(e) => handleUp(e.currentTarget)}
        >
          {dir === "forward" ? "▲" : "▼"}
        </button>
      ))}
    </div>
  );
}
