"use client";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  Anchor,
  Code,
  Coffee,
  Flag,
  Mic,
  Ship,
  Trophy,
  Utensils,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { events } from "~/constants/timeline";

const getEventDetails = (event: (typeof events)[0], index: number) => {
  const dateMap: Record<number, { day: string; month: string; year: string }> =
    {
      1: { day: "17", month: "APR", year: "2026" },
      2: { day: "18", month: "APR", year: "2026" },
      3: { day: "19", month: "APR", year: "2026" },
    };
  const date = dateMap[event.day] || { day: "??", month: "APR", year: "2026" };

  const titleLower = event.title.toLowerCase();
  let icon = Ship;
  let accent = "#22d3ee";
  let accentRgb = "34,211,238";

  if (titleLower.includes("check-in") || titleLower.includes("checkout")) {
    icon = Flag;
    accent = "#f87171";
    accentRgb = "248,113,113";
  } else if (
    titleLower.includes("food") ||
    titleLower.includes("lunch") ||
    titleLower.includes("dinner") ||
    titleLower.includes("breakfast") ||
    titleLower.includes("snack")
  ) {
    icon = Utensils;
    accent = "#facc15";
    accentRgb = "250,204,21";
  } else if (titleLower.includes("start") || titleLower.includes("begin")) {
    icon = Anchor;
    accent = "#22d3ee";
    accentRgb = "34,211,238";
  } else if (
    titleLower.includes("end") ||
    titleLower.includes("closing") ||
    titleLower.includes("winner")
  ) {
    icon = Trophy;
    accent = "#eab308";
    accentRgb = "234,179,8";
  } else if (titleLower.includes("hack") || titleLower.includes("code")) {
    icon = Code;
    accent = "#c084fc";
    accentRgb = "192,132,252";
  } else if (titleLower.includes("cool") || titleLower.includes("chill")) {
    icon = Coffee;
    accent = "#60a5fa";
    accentRgb = "96,165,250";
  } else if (
    titleLower.includes("pitch") ||
    titleLower.includes("talk") ||
    titleLower.includes("mic")
  ) {
    icon = Mic;
    accent = "#f472b6";
    accentRgb = "244,114,182";
  } else if (
    titleLower.includes("engagement") ||
    titleLower.includes("activity")
  ) {
    icon = Zap;
    accent = "#4ade80";
    accentRgb = "74,222,128";
  }

  const description = `${event.time} - Prepare for ${event.title.replace(/\n/g, " ")}.`;

  return {
    ...date,
    title: event.title.replace(/\n/g, " "),
    description,
    icon,
    accent,
    accentRgb,
    label: event.day === 1 && index === 0 ? "DAY 1" : undefined,
  };
};

export default function Timeline2D() {
  const richEvents = events.map((e, i) => getEventDetails(e, i));
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <section
      ref={containerRef}
      className="relative z-10 w-full min-h-screen bg-transparent py-20 overflow-hidden"
    >
      {/* Underwater Background Image */}
      <div
        className="absolute inset-0 pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: "url(/images/underwater.jpg)" }}
      />

      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 pointer-events-none bg-black/40" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl md:text-7xl font-pirata font-black text-transparent bg-clip-text bg-linear-to-b from-[#f0e6d2] to-[#c5a059] drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] tracking-wider">
            The Captain’s Route
          </h2>
          <p className="mt-4 text-lg md:text-xl text-[#f0e6d2]/60 font-crimson italic tracking-wide">
            The Captain's log for the 3-day voyage.
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto pb-32">
          {/* Central rope — Desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-[#c5a059]/20">
            <motion.div
              style={{ scaleY, originY: 0 }}
              className="w-full h-full bg-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.5)]"
            />
          </div>

          {/* Left rope — Mobile */}
          <div className="md:hidden absolute left-6 top-0 bottom-0 w-px bg-[#c5a059]/20">
            <motion.div
              style={{ scaleY, originY: 0 }}
              className="w-full h-full bg-[#c5a059] shadow-[0_0_15px_rgba(197,160,89,0.5)]"
            />
          </div>

          <div className="flex flex-col gap-20 md:gap-28">
            {richEvents.map((event, index) => (
              <TimelineItem
                key={`${event.title}-${index}`}
                event={event}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineItem({
  event,
  index,
}: {
  event: ReturnType<typeof getEventDetails>;
  index: number;
}) {
  const isEven = index % 2 === 0;
  const Icon = event.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className={`relative flex items-center flex-row ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      <div className="hidden md:block w-1/2" />

      {/* Node on the rope */}
      <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
        <div
          className="absolute w-20 h-20 rounded-full opacity-25 animate-[ping_3s_ease-in-out_infinite]"
          style={{ backgroundColor: event.accent, filter: "blur(10px)" }}
        />
        <div
          className="w-14 h-14 rounded-full bg-[#0f172a] border-2 backdrop-blur-xl flex items-center justify-center z-10 shadow-lg group"
          style={{ borderColor: event.accent }}
        >
          <Icon
            className="w-6 h-6 group-hover:scale-110 transition-transform duration-300"
            style={{ color: event.accent }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className={`w-full md:w-1/2 pl-20 md:pl-0 pr-2 ${
          isEven ? "md:pr-14 md:pl-0" : "md:pl-14 md:pr-0"
        }`}
      >
        <motion.div
          initial={{ x: isEven ? -20 : 20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
          className="relative group"
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Hover effect only */}
          <div
            className="relative overflow-hidden bg-[#1e293b]/40 backdrop-blur-md border rounded-sm transition-all duration-500 hover:-translate-y-1"
            style={{
              borderColor: `rgba(${event.accentRgb}, 0.2)`,
              boxShadow: `0 10px 30px -10px rgba(0,0,0,0.5)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `rgba(${event.accentRgb}, 0.5)`;
              e.currentTarget.style.boxShadow = `0 20px 40px -10px rgba(${event.accentRgb}, 0.1)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `rgba(${event.accentRgb}, 0.2)`;
              e.currentTarget.style.boxShadow = `0 10px 30px -10px rgba(0,0,0,0.5)`;
            }}
          >
            <div
              className={`relative flex items-center gap-4 p-6 md:p-8 pb-2 md:pb-3 ${
                isEven ? "md:flex-row-reverse md:text-right" : ""
              }`}
            >
              {/* Big day number */}
              <div className="relative shrink-0">
                <span
                  className={`text-6xl md:text-7xl font-pirata leading-none tracking-tight block`}
                  style={{
                    color: event.accent,
                    textShadow: `0 0 20px rgba(${event.accentRgb}, 0.4)`,
                  }}
                >
                  {event.day}
                </span>
              </div>

              {/* Month + year stacked */}
              <div
                className={`flex flex-col ${isEven ? "md:items-end" : "md:items-start"} justify-center`}
              >
                <span
                  className={`text-xl md:text-2xl font-pirata font-bold tracking-[0.15em] leading-tight`}
                  style={{ color: "#f0e6d2" }}
                >
                  {event.month}
                </span>
                <span className="text-sm font-mono text-white/40 tracking-widest">
                  {event.year}
                </span>
              </div>
            </div>

            <div
              className="mx-6 md:mx-8 h-px"
              style={{ backgroundColor: `rgba(${event.accentRgb}, 0.15)` }}
            />

            <div
              className={`p-6 md:p-8 pt-4 md:pt-5 ${
                isEven ? "md:text-right" : "text-left"
              }`}
            >
              <h3 className="text-xl md:text-2xl font-pirata font-bold text-[#f0e6d2] mb-2 drop-shadow-md">
                {event.title}
              </h3>
              <p className="text-[#94a3b8] text-sm md:text-base leading-relaxed font-crimson font-medium">
                {event.description}
              </p>
            </div>

            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-sm"
              style={{
                background: `radial-gradient(ellipse at ${
                  isEven ? "100% 30%" : "0% 30%"
                }, rgba(${event.accentRgb}, 0.06), transparent 70%)`,
              }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
