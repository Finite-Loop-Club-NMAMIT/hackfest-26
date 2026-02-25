"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Anchor, Compass } from "lucide-react";
import { useState } from "react";
import GlimpsesSection from "./GlimpsesSection";
import SectionSwitcher, { type GallerySection } from "./SectionSwitcher";
import TestimonialsSection from "./TestimonialsSection";

export default function GalleryPage() {
  const [activeSection, setActiveSection] =
    useState<GallerySection>("glimpses");

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Page Header */}
      <section className="text-center mb-8 md:mb-10 px-4 md:px-6 lg:px-8">
        {/* Compass icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-center mb-4"
        >
          <div className="relative">
            <Compass
              className="w-10 h-10 md:w-12 md:h-12 text-amber-500/60"
              strokeWidth={1}
            />
            <div className="absolute inset-0 w-full h-full rounded-full bg-amber-400/10 blur-xl" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-pirate text-cyan-200 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] mb-4"
        >
          The Captain&apos;s Gallery
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-cyan-100/80 max-w-2xl mx-auto font-crimson"
        >
          A treasure trove of memories from every voyage scroll through the
          logbook of past expeditions and relive the adventure.
        </motion.p>

        {/* Decorative divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 flex items-center justify-center gap-3"
        >
          <div className="h-px w-16 md:w-24 bg-linear-to-r from-transparent to-cyan-500/40" />
          <Anchor className="w-4 h-4 text-cyan-400/50" />
          <div className="h-px w-16 md:w-24 bg-linear-to-l from-transparent to-cyan-500/40" />
        </motion.div>
      </section>

      {/* Section Switcher */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-10 md:mb-14 px-4 md:px-6 lg:px-8"
      >
        <SectionSwitcher active={activeSection} onChange={setActiveSection} />
      </motion.section>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {activeSection === "glimpses" ? (
          <motion.div
            key="glimpses"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <GlimpsesSection />
          </motion.div>
        ) : (
          <motion.div
            key="testimonials"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <TestimonialsSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
