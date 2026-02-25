"use client";

import { motion } from "framer-motion";
import { cn } from "~/lib/utils";

export type GallerySection = "glimpses" | "testimonials";

type SectionSwitcherProps = {
  active: GallerySection;
  onChange: (section: GallerySection) => void;
};

const SECTIONS: {
  id: GallerySection;
  label: string;
}[] = [
  { id: "glimpses", label: "Glimpses" },
  { id: "testimonials", label: "Testimonials" },
];

export default function SectionSwitcher({
  active,
  onChange,
}: SectionSwitcherProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-cyan-300/40 text-xs font-crimson uppercase tracking-[0.35em]"
      >
        The Captain&apos;s Archive of Past Voyages
      </motion.p>

      {/* Switcher container */}
      <div className="relative flex items-center gap-1 p-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-amber-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        {/* Sliding gold indicator */}
        <motion.div
          layoutId="gallery-section-bg"
          className="absolute inset-y-1.5 rounded-lg bg-linear-to-b from-amber-900/50 via-amber-950/40 to-black/50 border border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.08),inset_0_1px_0_rgba(251,191,36,0.1)]"
          style={{
            left: active === "glimpses" ? "6px" : "calc(50% + 0px)",
            width: "calc(50% - 9px)",
          }}
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
        />

        {SECTIONS.map((section) => {
          const isActive = active === section.id;
          // const Icon = section.icon;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onChange(section.id)}
              className={cn(
                "relative z-10 flex items-center justify-center gap-2 md:gap-2.5",
                "px-5 py-2.5 md:px-7 md:py-3 rounded-lg",
                "min-w-35 md:min-w-42.5",
                "transition-colors duration-400 cursor-pointer",
                "select-none",
                isActive
                  ? "text-amber-200"
                  : "text-cyan-200/35 hover:text-cyan-100/55",
              )}
            >
              {/* <Icon
                className={cn(
                  "w-4 h-4 transition-all duration-400 shrink-0",
                  isActive
                    ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                    : "text-cyan-400/25",
                )}
                strokeWidth={isActive ? 2 : 1.5}
              /> */}

              <span
                className={cn(
                  "font-pirate text-sm md:text-base leading-tight transition-colors duration-400",
                  isActive ? "text-amber-200" : "text-cyan-200/35",
                )}
              >
                {section.label}
              </span>

              {/* Active glow line */}
              {isActive && (
                <motion.div
                  layoutId="gallery-section-glow"
                  className="absolute -bottom-px left-1/4 right-1/4 h-px bg-linear-to-r from-transparent via-amber-400/50 to-transparent"
                  transition={{ type: "spring", stiffness: 350, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
