"use client";
import { Home } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import Timeline2D from "../../components/timeline/components/Timeline2D";
import WaterBackground from "../../components/timeline/components/WaterBackground";

const TimelineScene = dynamic(
  () => import("../../components/timeline/components/TimelineScene"),
  {
    ssr: false,
  },
);

export default function TimelinePage() {
  const [is3D, setIs3D] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("timeline-mode");
    if (saved === "2d") setIs3D(false);
    if (saved === "3d") setIs3D(true);
  }, []);

  const handleToggle = () => {
    setIs3D((prev) => {
      const next = !prev;
      window.localStorage.setItem("timeline-mode", next ? "3d" : "2d");
      return next;
    });
  };

  return (
    <div className="relative w-full h-screen">
      {/* Home Button */}
      <Link
        href="/"
        aria-label="Go to home"
        className="fixed top-6 left-6 z-50 transition-transform duration-300 hover:scale-105 active:scale-95"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          borderRadius: "22px",
          background: "#2A1A0A",
          border: "2px solid #8B4513",
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(0,0,0,0.5)",
          textDecoration: "none",
        }}
      >
        <Home
          size={18}
          style={{
            color: "#f8f1e0",
            filter: "drop-shadow(0 0 4px rgba(248,241,224,0.5))",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-pirata), serif",
            color: "#f8f1e0",
            fontSize: "18px",
            textShadow: "0 0 8px rgba(248,241,224,0.4)",
            letterSpacing: "0.05em",
          }}
        >
          Home
        </span>
      </Link>

      <button
        type="button"
        onClick={handleToggle}
        className="fixed top-6 right-6 z-50 transition-all duration-300"
        aria-label="Toggle 2D and 3D mode"
      >
        <div
          style={{
            position: "relative",
            width: "120px",
            height: "44px",
            borderRadius: "22px",
            background: "#2A1A0A",
            border: "2px solid #8B4513",
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px",
            cursor: "pointer",
          }}
        >
          {/* Background Text */}
          <div className="absolute inset-0 flex items-center justify-between px-4 w-full h-full pointer-events-none">
            <span
              style={{
                fontFamily: "var(--font-pirata), serif",
                color: "#8B4513",
                fontSize: "18px",
                textShadow: "0 1px 1px rgba(255,255,255,0.1)",
              }}
            >
              3D
            </span>
            <span
              style={{
                fontFamily: "var(--font-pirata), serif",
                color: "#8B4513",
                fontSize: "18px",
                fontWeight: 400,
                textShadow: "0 1px 1px rgba(255,255,255,0.1)",
              }}
            >
              2D
            </span>
          </div>

          {/* Sliding Nob */}
          <div
            style={{
              width: "56px",
              height: "34px",
              background: "#f0e6d2",
              backgroundImage: "linear-gradient(to bottom, #f8f1e0, #e0d0b0)",
              borderRadius: "18px",
              border: "1px solid #8B4513",
              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              transform: is3D ? "translateX(0)" : "translateX(54px)",
              transition:
                "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-pirata), serif",
                color: "#2A1A0A",
                fontSize: "20px",
                fontWeight: 400,
              }}
            >
              {is3D ? "3D" : "2D"}
            </span>
          </div>
        </div>
      </button>

      {/* Keyboard Arrow Hint (Only shows on Desktop) */}
      {is3D && (
        <div className="hidden md:flex flex-col items-end fixed top-[84px] right-6 z-40 opacity-80 gap-1 animate-pulse pointer-events-none">
          <div className="flex flex-col items-end gap-2 p-2">
            <div className="flex items-center gap-3 pr-2">
              <span className="text-lg font-pirata tracking-wider text-[#2A1A0A] drop-shadow-md bg-white/40 px-2 rounded backdrop-blur-sm">
                Forward
              </span>
              <div className="w-8 h-8 rounded-lg bg-black border border-white/20 flex items-center justify-center shadow-md">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Forward</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-3 pr-2">
              <span className="text-lg font-pirata tracking-wider text-[#2A1A0A] drop-shadow-md bg-white/40 px-2 rounded backdrop-blur-sm">
                Backward
              </span>
              <div className="w-8 h-8 rounded-lg bg-black border border-white/20 flex items-center justify-center shadow-md">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Backward</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {is3D ? <TimelineScene /> : <WaterBackground />}
      {!is3D && <Timeline2D />}
    </div>
  );
}
