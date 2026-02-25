"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Anchor, BookOpen, Feather, Ship } from "lucide-react";
import TestimonialCard from "./TestimonialCard";
import { TESTIMONIALS } from "./testimonial-data";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export default function TestimonialsSection() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      {/* Captain's Log Header */}
      <section className="text-center mb-12 md:mb-16">
        {/* Book icon with feather quill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mb-5"
        >
          <div className="relative">
            <div className="absolute -inset-4 rounded-full border border-amber-500/8" />
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/40 backdrop-blur-sm border border-amber-500/25 flex items-center justify-center">
              <BookOpen
                className="w-7 h-7 md:w-8 md:h-8 text-amber-400/60"
                strokeWidth={1}
              />
            </div>
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: [0, 5, 0] }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <Feather className="w-5 h-5 text-amber-300/30" strokeWidth={1} />
            </motion.div>
            <div className="absolute inset-0 w-full h-full rounded-full bg-amber-400/8 blur-xl" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-4xl md:text-6xl lg:text-7xl font-pirate text-cyan-200 drop-shadow-[0_0_18px_rgba(34,211,238,0.4)] mb-5"
        >
          Voices From the Deck
        </motion.h2>

        {/* Ornate divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-7 flex items-center justify-center gap-3"
        >
          <div className="h-px w-10 md:w-20 bg-linear-to-r from-transparent to-amber-500/25" />
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-0.5 rounded-full bg-amber-400/30" />
            <Ship className="w-4 h-4 text-amber-400/30" />
            <div className="w-0.5 h-0.5 rounded-full bg-amber-400/30" />
          </div>
          <div className="h-px w-10 md:w-20 bg-linear-to-l from-transparent to-amber-500/25" />
        </motion.div>
      </section>

      {/* Testimonial Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key="testimonials-grid"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 lg:gap-7">
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div key={testimonial.id} variants={staggerItem}>
                <TestimonialCard testimonial={testimonial} index={index} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="flex items-center justify-center gap-4 py-10 md:py-14"
      >
        <div className="h-px w-16 md:w-24 bg-linear-to-r from-transparent to-amber-600/15" />
        <div className="flex items-center gap-2">
          <Anchor className="w-3.5 h-3.5 text-amber-500/15" />
          <div className="w-px h-3 bg-amber-500/10" />
          <Anchor className="w-3.5 h-3.5 text-amber-500/15" />
        </div>
        <div className="h-px w-16 md:w-24 bg-linear-to-l from-transparent to-amber-600/15" />
      </motion.div>
    </div>
  );
}
