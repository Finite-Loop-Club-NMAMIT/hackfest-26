"use client";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { DAY_THEMES } from "../constants/dayThemes";
import { useIsMobile } from "../hooks/useIsMobile";
import type { EventLabelProps } from "../types/timeline.types";
import { globalShipPosition } from "../utils/globalState";

const RENDER_DIST = 200;
const CLOSE_DIST = 40;
const FADE_START = RENDER_DIST * 0.8;

export function EventLabel({ event, onSelect, position }: EventLabelProps) {
  const theme = DAY_THEMES[event.day] ?? DAY_THEMES[1];
  const displayTitle = event.title.replace(/\\n/g, "\n").replace(/\n/g, " ");
  const isMobile = useIsMobile();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useFrame(() => {
    if (!wrapperRef.current) return;
    const dist = Math.sqrt(
      (globalShipPosition.x - position[0]) ** 2 +
        (globalShipPosition.z - position[2]) ** 2,
    );

    const isNear = dist < RENDER_DIST;
    wrapperRef.current.style.display = isNear ? "block" : "none";
    if (!isNear) return;

    const opacity =
      dist > FADE_START
        ? Math.max(0.3, 1 - (dist - FADE_START) / (RENDER_DIST - FADE_START))
        : 1;
    wrapperRef.current.style.opacity = String(opacity);

    if (buttonRef.current) {
      const isClose = dist < CLOSE_DIST;
      buttonRef.current.style.transform = isClose
        ? isMobile
          ? "scale(1.2)"
          : "scale(1.5)"
        : "scale(1)";
      buttonRef.current.style.animation = isClose
        ? "noteGlow 2s ease-in-out infinite"
        : "none";
    }
  });

  return (
    <Html
      center
      distanceFactor={40}
      position={[0, 18, 0]}
      style={{ pointerEvents: "none", cursor: "default" }}
      sprite
      zIndexRange={[100, 0]}
    >
      <div ref={wrapperRef} style={{ display: "none" }}>
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(event);
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            userSelect: "none",
            filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.6))",
            cursor: "pointer",
            pointerEvents: "auto",
            transition:
              "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            background: "none",
            border: "none",
            padding: 0,
          }}
          className="hover:scale-110 active:scale-95"
        >
          <div
            style={{
              position: "absolute",
              top: "-14px",
              right: "-12px",
              height: "22px",
              minWidth: "48px",
              padding: "0 8px",
              background: theme.wax,
              borderRadius: "11px",
              border: "2px solid rgba(255,255,255,0.25)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.95)",
                fontSize: "11px",
                fontFamily: "var(--font-cinzel), serif",
                fontWeight: 700,
                letterSpacing: "0.5px",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                whiteSpace: "nowrap",
              }}
            >
              Day {event.day}
            </span>
          </div>

          <div
            style={{
              background: theme.parchment,
              backgroundImage:
                "linear-gradient(to bottom right, rgba(0,0,0,0.05), transparent)",
              color: theme.ink,
              padding: isMobile ? "16px 20px" : "18px 24px",
              minWidth: "200px",
              maxWidth: isMobile ? "320px" : "300px",
              textAlign: "center",
              position: "relative",
              borderRadius: "2px",
              boxShadow:
                "inset 0 0 20px rgba(139, 69, 19, 0.15), 0 0 0 1px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)",
              clipPath: "polygon(2% 0%, 98% 2%, 100% 98%, 0% 100%)",
              border: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "4px",
                left: "4px",
                width: "8px",
                height: "8px",
                borderTop: `2px solid ${theme.border}`,
                borderLeft: `2px solid ${theme.border}`,
                opacity: 0.6,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "4px",
                right: "4px",
                width: "8px",
                height: "8px",
                borderBottom: `2px solid ${theme.border}`,
                borderRight: `2px solid ${theme.border}`,
                opacity: 0.6,
              }}
            />
            <div
              style={{
                fontSize: isMobile ? "26px" : "28px",
                fontFamily: "var(--font-pirata), serif",
                fontWeight: 400,
                lineHeight: "1.1",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {displayTitle}
            </div>
            <div
              style={{
                height: "1px",
                width: "60%",
                margin: "0 auto 6px auto",
                background: `linear-gradient(to right, transparent, ${theme.border}, transparent)`,
                opacity: 0.5,
              }}
            />
            <div
              style={{
                fontSize: isMobile ? "16px" : "18px",
                fontFamily: "var(--font-cinzel), serif",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                color: "#5c4033",
              }}
            >
              <span style={{ fontSize: "14px" }}>{theme.icon}</span>
              {event.time}
            </div>
          </div>

          <div
            style={{
              marginTop: "4px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "2px",
                height: "15px",
                borderLeft: "2px dashed rgba(255, 255, 255, 0.6)",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
              }}
            />
            <div
              style={{
                color: "#d00",
                fontSize: "16px",
                fontWeight: "bold",
                fontFamily: "var(--font-pirata), serif",
                lineHeight: 1,
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                transform: "translateY(-4px)",
              }}
            >
              X
            </div>
          </div>
        </button>
      </div>
    </Html>
  );
}
