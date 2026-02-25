"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useState } from "react";
import ImageGrid from "./ImageGrid";
import YearSelector from "./YearSelector";
import { GALLERY_YEARS } from "./gallery-data";

const years = GALLERY_YEARS.map((g) => g.year);

export default function GlimpsesSection() {
  const [activeYear, setActiveYear] = useState(years[0] ?? 2025);
  const activeGallery =
    GALLERY_YEARS.find((g) => g.year === activeYear) ?? GALLERY_YEARS[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      {/* Year Selector */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 md:mb-10"
      >
        <YearSelector
          years={years}
          activeYear={activeYear}
          onChange={setActiveYear}
        />
      </motion.section>

      {/* Voyage Title Card */}
      <AnimatePresence mode="wait">
        <motion.section
          key={activeYear}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.35 }}
          className="mb-8 md:mb-10"
        >
          <div className="relative inline-flex items-center gap-3 md:gap-4 px-5 py-3 md:px-6 md:py-4 rounded-lg bg-black/30 backdrop-blur-sm border border-cyan-500/20">
            <MapPin className="w-5 h-5 text-amber-400/70 shrink-0" />

            <div>
              <h2 className="text-2xl md:text-3xl font-pirate text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                {activeGallery.title}
              </h2>
              <p className="text-sm md:text-base text-cyan-200/60 font-crimson mt-0.5">
                {activeGallery.subtitle}
              </p>
            </div>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-500/40 rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-500/40 rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-500/40 rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-500/40 rounded-br-sm" />
          </div>
        </motion.section>
      </AnimatePresence>

      {/* Image Grid */}
      <section className="pb-8">
        <ImageGrid images={activeGallery.images} yearKey={activeYear} />
      </section>

      {/* Bottom ornament */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="flex items-center justify-center gap-3 py-8 md:py-12"
      >
        <div className="h-px w-12 md:w-20 bg-linear-to-r from-transparent to-amber-600/30" />
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
        <div className="h-px w-12 md:w-20 bg-linear-to-l from-transparent to-amber-600/30" />
      </motion.div>
    </div>
  );
}
