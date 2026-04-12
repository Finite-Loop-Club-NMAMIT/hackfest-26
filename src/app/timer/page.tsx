"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TimerData = {
  label: string;
  status: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED";
  remaining: number;
  durationSeconds: number;
} | null;

type AnnouncementData = {
  message: string;
} | null;

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return {
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
  };
}

function formatLiveDateTime(date: Date) {
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "long",
    day: "numeric",
  };
  return {
    time: date.toLocaleTimeString("en-IN", timeOpts),
    date: date.toLocaleDateString("en-IN", dateOpts),
  };
}

/* ─── Digit flip component ─── */
function FlipDigit({
  value,
  prevValue,
  className = "",
}: {
  value: string;
  prevValue: string;
  className?: string;
}) {
  const changed = value !== prevValue;
  return (
    <span
      className={`relative inline-block overflow-hidden ${className}`}
      style={{ width: "1ch" }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={changed ? { y: "-100%", opacity: 0, scale: 0.8 } : false}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: "100%", opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ─── Floating particle ─── */
function Particle({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: Math.random() * 6 + 2,
        height: Math.random() * 6 + 2,
        background: `radial-gradient(circle, rgba(251,191,36,${Math.random() * 0.8 + 0.2}), transparent)`,
        left: `${Math.random() * 100}%`,
        bottom: "-5%",
      }}
      animate={{
        y: [0, -(Math.random() * 600 + 300)],
        x: [0, (Math.random() - 0.5) * 150],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: Math.random() * 6 + 4,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeOut",
      }}
    />
  );
}

export default function TimerPage() {
  const [timerData, setTimerData] = useState<TimerData>(null);
  const [announcement, setAnnouncement] = useState<AnnouncementData>(null);
  const [prevTime, setPrevTime] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [isMobile, setIsMobile] = useState(false);
  const [liveDate, setLiveDate] = useState(new Date());

  const prevTimeRef = useRef({ hours: "00", minutes: "00", seconds: "00" });
  const retryRef = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const fetchInternetTime = async () => {
      try {
        const response = await fetch("https://worldtimeapi.org/api/ip");
        const data = (await response.json()) as { datetime: string };
        setLiveDate(new Date(data.datetime));
      } catch {
        setLiveDate(new Date());
      }
    };

    void fetchInternetTime();
    const syncInterval = setInterval(() => void fetchInternetTime(), 60000);
    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    const intv = setInterval(() => {
      setLiveDate((prev) => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(intv);
  }, []);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // SSE Connection
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/timer/stream");
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setTimerData(data.timer);
        setAnnouncement(data.announcement);
        retryRef.current = 0;
      } catch {
        // Ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
      retryRef.current += 1;
      setTimeout(connectSSE, delay);
    };
  }, []);

  useEffect(() => {
    connectSSE();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connectSSE]);

  // Track previous time for flip animation
  const currentTime = useMemo(
    () => formatTime(timerData?.remaining ?? 0),
    [timerData?.remaining],
  );

  useEffect(() => {
    setPrevTime(prevTimeRef.current);
    prevTimeRef.current = currentTime;
  }, [currentTime]);

  const status = timerData?.status ?? "IDLE";

  const isPausedDesktop = status === "PAUSED" && !isMobile;
  const isCompleted = status === "COMPLETED";

  // Generate particle positions stably
  const particles = useMemo(
    () => Array.from({ length: 30 }, (_, i) => i * 0.4),
    [],
  );

  const { time: liveTimeString, date: liveDateString } =
    formatLiveDateTime(liveDate);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0a0604] text-white selection:bg-amber-500/30">
      {/* Deep ocean/dark background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f08] via-[#0d0805] to-[#050302]" />

      {/* Animated ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(139,69,19,0.12) 0%, transparent 100%)",
            "radial-gradient(ellipse 80% 60% at 45% 50%, rgba(139,69,19,0.15) 0%, transparent 100%)",
            "radial-gradient(ellipse 70% 50% at 55% 45%, rgba(139,69,19,0.12) 0%, transparent 100%)",
          ],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Floating particles (when running or completed) */}
      {(status === "RUNNING" || status === "COMPLETED") && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((delay) => (
            <Particle key={`p-${delay}`} delay={delay} />
          ))}
        </div>
      )}

      {/* Top nav bar & Corner Live Time */}
      <div className="fixed top-0 left-0 w-full z-50 pointer-events-none">
        <div className="flex items-start justify-between px-6 py-6 md:px-12 md:py-8">
          <div className="flex flex-col gap-4 pointer-events-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 w-max rounded-xl transition-transform duration-300 hover:scale-105 active:scale-95"
              style={{
                background: "#2A1A0A",
                border: "2px solid #8B4513",
                boxShadow:
                  "0 4px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(0,0,0,0.5)",
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
                className="font-pirate text-lg tracking-wider"
                style={{
                  color: "#f8f1e0",
                  textShadow: "0 0 8px rgba(248,241,224,0.4)",
                }}
              >
                Home
              </span>
            </Link>

            <AnimatePresence>
              {status !== "IDLE" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col drop-shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                >
                  <span className="font-mono text-2xl md:text-3xl font-bold text-amber-200/80">
                    {liveTimeString}
                  </span>
                  <span className="font-pirate tracking-wider text-amber-500/50 mt-1 md:text-lg">
                    {liveDateString}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/"
            className="relative w-16 h-16 md:w-20 md:h-20 pointer-events-auto transition-transform hover:scale-105"
          >
            <Image
              src="/logos/logowithglow.webp"
              alt="Hackfest Logo"
              fill
              className="object-contain drop-shadow-[0_0_15px_rgba(251,191,36,0.7)]"
            />
          </Link>
        </div>
      </div>

      {/* ─── Paused desktop top-right minibar ─── */}
      <AnimatePresence>
        {isPausedDesktop && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-8 right-1/2 translate-x-1/2 md:translate-x-0 md:right-32 z-50 w-max"
          >
            <div
              className="flex items-center gap-4 px-6 py-4 rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(42,26,10,0.95), rgba(30,18,8,0.95))",
                border: "2px solid rgba(139,69,19,0.6)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(251,191,36,0.2)",
              }}
            >
              <motion.div
                className="w-3 h-3 rounded-full bg-amber-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              />
              <span className="font-mono text-2xl text-amber-200 tracking-widest font-bold tabular-nums">
                {currentTime.hours}:{currentTime.minutes}:{currentTime.seconds}
              </span>
              <span className="text-amber-400/60 text-sm font-pirate tracking-widest uppercase">
                PAUSED
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pb-12 pt-24">
        <div
          className={`w-full flex flex-col items-center justify-center transition-all duration-500 ${isPausedDesktop ? "order-2 mt-4 flex-none" : "order-1 flex-1"}`}
        >
          <AnimatePresence mode="wait">
            {status === "IDLE" ? (
              /* ─── IDLE View: Giant Live Clock ─── */
              <motion.div
                key="idle-view"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center text-center w-full"
              >
                <h2 className="font-pirate text-2xl md:text-4xl text-amber-500/50 tracking-widest uppercase mb-6">
                  Awaiting The Signal...
                </h2>

                <div
                  className="font-mono font-bold tracking-tighter"
                  style={{
                    fontSize: "clamp(3rem, 10vw, 8rem)",
                    lineHeight: "1",
                    color: "#fde68a",
                    textShadow:
                      "0 0 40px rgba(251,191,36,0.3), 0 0 100px rgba(251,191,36,0.1), 0 4px 6px rgba(0,0,0,0.8)",
                  }}
                >
                  {liveTimeString.split(" ")[0]}
                  <span className="text-xl md:text-3xl lg:text-5xl ml-2 tracking-normal text-amber-400/70 font-pirate">
                    {liveTimeString.split(" ")[1]}
                  </span>
                </div>
                <p
                  className="font-pirate tracking-widest uppercase mt-4"
                  style={{
                    fontSize: "clamp(1.2rem, 3vw, 2.5rem)",
                    color: "#fbbf24",
                    textShadow: "0 0 20px rgba(251,191,36,0.5)",
                  }}
                >
                  {liveDateString}
                </p>
              </motion.div>
            ) : !isPausedDesktop ? (
              /* ─── RUNNING/COMPLETED/MOBILE-PAUSED View: Giant Countdown ─── */
              <motion.div
                key="timer-view"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto flex-1"
              >
                <motion.h1
                  className="font-pirate text-3xl md:text-5xl lg:text-6xl uppercase tracking-widest text-[#fbbf24] mb-8 text-center"
                  style={{
                    textShadow: isCompleted
                      ? "0 0 30px rgba(220,38,38,0.6), 0 4px 8px rgba(0,0,0,0.8)"
                      : "0 0 40px rgba(251,191,36,0.6), 0 4px 8px rgba(0,0,0,0.8)",
                    color: isCompleted ? "#f87171" : "#fbbf24",
                  }}
                  animate={status === "RUNNING" ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                >
                  {timerData?.label ?? "Hackfest Timer"}
                </motion.h1>

                {/* Huge Countdown Digits */}
                <div
                  className="font-mono font-black flex items-center justify-center gap-1 md:gap-3 lg:gap-6"
                  style={{
                    fontSize: "clamp(4rem, 12vw, 10rem)",
                    lineHeight: "1",
                    color: isCompleted ? "#fca5a5" : "#fef3c7",
                    textShadow: isCompleted
                      ? "0 0 40px rgba(220,38,38,0.7), 0 0 100px rgba(220,38,38,0.4), 0 8px 16px rgba(0,0,0,0.9)"
                      : "0 0 60px rgba(251,191,36,0.6), 0 0 120px rgba(251,191,36,0.3), 0 8px 16px rgba(0,0,0,0.9)",
                  }}
                >
                  <div className="flex bg-black/20 px-2 rounded-2xl md:px-4 backdrop-blur-sm border border-amber-900/30">
                    <FlipDigit
                      value={currentTime.hours[0]}
                      prevValue={prevTime.hours[0]}
                    />
                    <FlipDigit
                      value={currentTime.hours[1]}
                      prevValue={prevTime.hours[1]}
                    />
                  </div>
                  <motion.span
                    className="mb-4 md:mb-8"
                    animate={status === "RUNNING" ? { opacity: [1, 0, 1] } : {}}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  >
                    :
                  </motion.span>
                  <div className="flex bg-black/20 px-2 rounded-2xl md:px-4 backdrop-blur-sm border border-amber-900/30">
                    <FlipDigit
                      value={currentTime.minutes[0]}
                      prevValue={prevTime.minutes[0]}
                    />
                    <FlipDigit
                      value={currentTime.minutes[1]}
                      prevValue={prevTime.minutes[1]}
                    />
                  </div>
                  <motion.span
                    className="mb-4 md:mb-8"
                    animate={status === "RUNNING" ? { opacity: [1, 0, 1] } : {}}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  >
                    :
                  </motion.span>
                  <div className="flex bg-black/20 px-2 rounded-2xl md:px-4 backdrop-blur-sm border border-amber-900/30">
                    <FlipDigit
                      value={currentTime.seconds[0]}
                      prevValue={prevTime.seconds[0]}
                    />
                    <FlipDigit
                      value={currentTime.seconds[1]}
                      prevValue={prevTime.seconds[1]}
                    />
                  </div>
                </div>

                {/* Status Indicator */}
                <motion.div className="mt-8 md:mt-12 flex flex-col items-center gap-4">
                  {status === "RUNNING" && (
                    <motion.div
                      className="flex items-center gap-4 px-6 py-2 md:px-8 md:py-3 rounded-full bg-green-900/20 border border-green-500/30 backdrop-blur-md"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <motion.div
                        className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-400"
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                        transition={{
                          duration: 1.5,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                        style={{ boxShadow: "0 0 20px rgba(74,222,128,0.8)" }}
                      />
                      <p className="font-pirate text-xl md:text-3xl text-green-400 tracking-widest uppercase">
                        The Voyage is On
                      </p>
                    </motion.div>
                  )}

                  {status === "PAUSED" && isMobile && (
                    <motion.div
                      className="flex items-center gap-4 px-6 py-2 md:px-8 md:py-3 rounded-full"
                      style={{
                        background: "rgba(139,69,19,0.3)",
                        border: "1px solid rgba(251,191,36,0.4)",
                        backdropFilter: "blur(10px)",
                      }}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      <motion.div
                        className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-amber-400"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      />
                      <p className="font-pirate text-xl md:text-2xl text-amber-300 tracking-widest uppercase">
                        Anchored
                      </p>
                    </motion.div>
                  )}

                  {isCompleted && (
                    <motion.div
                      className="flex flex-col items-center gap-4"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        damping: 10,
                        stiffness: 100,
                      }}
                    >
                      <motion.p
                        className="font-pirate text-4xl md:text-6xl text-red-500 tracking-widest uppercase"
                        style={{
                          textShadow:
                            "0 0 40px rgba(220,38,38,0.7), 0 0 80px rgba(220,38,38,0.4)",
                        }}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{
                          duration: 1.5,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      >
                        Time&apos;s Up!
                      </motion.p>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            ) : (
              /* ─── PAUSED View (Desktop): Centered overlay since timer is top right ─── */
              <motion.div
                key="paused-overlay"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-4 md:mt-8"
              >
                <motion.div
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(139,69,19,0.2) 0%, transparent 70%)",
                    border: "2px solid rgba(139,69,19,0.4)",
                    boxShadow: "0 0 40px rgba(251,191,36,0.1)",
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="md:w-[32px] md:h-[32px]"
                  >
                    <title>Paused</title>
                    <rect
                      x="6"
                      y="4"
                      width="4"
                      height="16"
                      rx="1"
                      fill="rgba(251,191,36,0.6)"
                    />
                    <rect
                      x="14"
                      y="4"
                      width="4"
                      height="16"
                      rx="1"
                      fill="rgba(251,191,36,0.6)"
                    />
                  </svg>
                </motion.div>

                <h2
                  className="font-pirate font-black text-3xl md:text-5xl text-amber-500/80 mb-3 uppercase tracking-widest"
                  style={{
                    textShadow:
                      "0 0 20px rgba(251,191,36,0.2), 0 2px 5px rgba(0,0,0,0.8)",
                  }}
                >
                  Anchored
                </h2>
                <p className="font-pirate text-lg md:text-xl text-amber-500/50 max-w-xl text-center leading-relaxed tracking-wider">
                  The countdown rests in the corner. Awaiting the captain&apos;s
                  command to set sail once more.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Massive Announcement Block ─── */}
          <div
            className={`transition-all duration-500 w-full ${isPausedDesktop ? "order-1 mb-2 flex-none" : "order-2 mt-8 md:mt-12"}`}
          >
            <AnimatePresence>
              {announcement && (
                <motion.div
                  key="announcement-block"
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="mt-8 md:mt-12 w-full max-w-5xl mx-auto rounded-3xl overflow-hidden relative overflow-y-visible"
                >
                  {/* Inner container with styling */}
                  <div
                    className="relative px-6 py-8 md:px-12 md:py-10 text-center border-y-2 border-amber-600/40 bg-black/40 backdrop-blur-md"
                    style={{
                      boxShadow:
                        "0 0 80px rgba(139,69,19,0.3) inset, 0 10px 40px rgba(0,0,0,0.8)",
                    }}
                  >
                    {/* Decorative corner pieces */}
                    <div className="absolute top-0 left-0 w-6 h-6 md:w-8 md:h-8 border-t-2 border-l-2 border-amber-400/60 rounded-tl-xl -mt-[2px] -ml-[2px]" />
                    <div className="absolute top-0 right-0 w-6 h-6 md:w-8 md:h-8 border-t-2 border-r-2 border-amber-400/60 rounded-tr-xl -mt-[2px] -mr-[2px]" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 md:w-8 md:h-8 border-b-2 border-l-2 border-amber-400/60 rounded-bl-xl -mb-[2px] -ml-[2px]" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 md:w-8 md:h-8 border-b-2 border-r-2 border-amber-400/60 rounded-br-xl -mb-[2px] -mr-[2px]" />

                    {/* Gentle pulsing ambient glow */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      animate={{ opacity: [0.1, 0.4, 0.1] }}
                      transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                      style={{
                        background:
                          "radial-gradient(ellipse at center, rgba(251,191,36,0.15) 0%, transparent 70%)",
                      }}
                    />

                    <p className="font-pirate text-amber-500/80 tracking-[0.2em] md:tracking-[0.3em] uppercase text-lg md:text-2xl xl:text-3xl mb-4 md:mb-8 flex items-center justify-center gap-3 md:gap-4">
                      <span className="h-px w-8 md:w-16 bg-amber-600/50 block" />
                      Update from the Captain
                      <span className="h-px w-8 md:w-16 bg-amber-600/50 block" />
                    </p>

                    <h3
                      className={`font-pirate transition-all duration-500 ${isPausedDesktop ? "text-5xl md:text-7xl lg:text-8xl" : "text-3xl md:text-5xl lg:text-6xl"} leading-tight text-amber-100`}
                      style={{
                        textShadow:
                          "0 0 30px rgba(251,191,36,0.5), 0 4px 8px rgba(0,0,0,0.9)",
                      }}
                    >
                      {announcement.message}
                    </h3>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      {/* Bottom decorative border */}
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-600/40 to-transparent z-20 shadow-[0_-5px_20px_rgba(139,69,19,0.5)]" />
    </main>
  );
}
