"use client";

import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

type YearSelectorProps = {
  years: number[];
  activeYear: number;
  onChange: (year: number) => void;
};

export default function YearSelector({
  years,
  activeYear,
  onChange,
}: YearSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
      {years.map((year) => {
        const isActive = year === activeYear;

        return (
          <button
            key={year}
            type="button"
            onClick={() => onChange(year)}
            className={cn(
              "relative px-5 py-2 md:px-6 md:py-2.5 rounded-lg cursor-pointer",
              "font-pirate text-sm md:text-base tracking-wide",
              "transition-colors duration-300 select-none",
              "border",
              isActive
                ? "text-amber-200 border-amber-500/40 bg-amber-900/30 shadow-[0_0_16px_rgba(251,191,36,0.1)]"
                : "text-cyan-200/35 border-white/5 bg-black/20 hover:text-cyan-100/55 hover:border-white/10 hover:bg-black/30",
            )}
          >
            {year}

            {/* Active underline glow */}
            {isActive && (
              <motion.div
                layoutId="year-selector-glow"
                className="absolute -bottom-px left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-amber-400/60 to-transparent"
                transition={{ type: "spring", stiffness: 350, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
