"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { DAY_THEMES } from "../constants/dayThemes";
import { useIsMobile } from "../hooks/useIsMobile";
import type { TimelineEvent } from "../types/timeline.types";

interface FocusDialogProps {
  selectedEvent: TimelineEvent | null;
  onClose: () => void;
}

export function FocusDialog({ selectedEvent, onClose }: FocusDialogProps) {
  const isMobile = useIsMobile();

  return (
    <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[90vw] max-w-[90vw] sm:w-auto sm:max-w-2xl border-none bg-transparent shadow-none p-0 overflow-visible [&>button]:hidden"
        style={{ perspective: "1000px" }}
      >
        {selectedEvent &&
          (() => {
            const theme = DAY_THEMES[selectedEvent.day] || DAY_THEMES[1];
            return (
              <div
                style={{
                  background: theme.parchment,
                  backgroundImage:
                    "linear-gradient(to bottom right, rgba(0,0,0,0.05), transparent)",
                  borderRadius: "6px",
                  padding: isMobile ? "40px 24px 32px" : "48px 44px 40px",
                  position: "relative",
                  boxShadow:
                    "0 20px 50px rgba(0,0,0,0.5), inset 0 0 60px rgba(139, 69, 19, 0.2)",
                  border: `3px solid ${theme.border}`,
                }}
              >
                {/* Wax seal */}
                <div
                  style={{
                    position: "absolute",
                    top: isMobile ? "-16px" : "-18px",
                    left: isMobile ? "-16px" : "-18px",
                    width: isMobile ? "60px" : "56px",
                    height: isMobile ? "60px" : "56px",
                    backgroundColor: theme.wax,
                    backgroundImage:
                      "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25), transparent 60%)",
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.15)",
                    boxShadow:
                      "0 4px 12px rgba(0,0,0,0.5), inset 0 -2px 6px rgba(0,0,0,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: "rotate(-10deg)",
                    zIndex: 20,
                  }}
                >
                  <div
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: isMobile ? "12px" : "11px",
                      fontFamily: "var(--font-cinzel), serif",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                      letterSpacing: "1px",
                    }}
                  >
                    Day {selectedEvent.day}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      inset: "4px",
                      borderRadius: "50%",
                      border: "1.5px dashed rgba(255,255,255,0.35)",
                    }}
                  />
                </div>

                {/* Close button */}
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "12px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: `1.5px solid ${theme.border}`,
                    background: "rgba(0,0,0,0.08)",
                    color: theme.ink,
                    fontSize: "16px",
                    fontFamily: "var(--font-pirata), serif",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s",
                    zIndex: 20,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.15)";
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.15)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.08)";
                  }}
                >
                  ✕
                </button>

                {/* Corner decorations */}
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    width: "16px",
                    height: "16px",
                    borderTop: `2px solid ${theme.border}`,
                    borderLeft: `2px solid ${theme.border}`,
                    opacity: 0.4,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    width: "16px",
                    height: "16px",
                    borderBottom: `2px solid ${theme.border}`,
                    borderRight: `2px solid ${theme.border}`,
                    opacity: 0.4,
                  }}
                />

                <DialogHeader>
                  <DialogTitle
                    className={`text-center mb-2 mt-2 ${isMobile ? "text-3xl" : "text-4xl"}`}
                    style={{
                      fontFamily: "var(--font-pirata), serif",
                      color: theme.ink,
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedEvent.title.replace(/\\n/g, " ")}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Event details
                  </DialogDescription>
                </DialogHeader>

                <div
                  className="w-4/5 mx-auto h-px my-4"
                  style={{
                    background: `linear-gradient(to right, transparent, ${theme.border}, transparent)`,
                    opacity: 0.5,
                  }}
                />

                <div
                  className="flex items-center justify-center gap-3"
                  style={{
                    color: theme.ink,
                    fontFamily: "var(--font-cinzel), serif",
                  }}
                >
                  <span style={{ fontSize: isMobile ? "40px" : "28px" }}>
                    {theme.icon}
                  </span>
                  <span
                    style={{
                      fontSize: isMobile ? "28px" : "24px",
                      fontWeight: 700,
                    }}
                  >
                    {selectedEvent.time}
                  </span>
                </div>
              </div>
            );
          })()}
      </DialogContent>
    </Dialog>
  );
}
