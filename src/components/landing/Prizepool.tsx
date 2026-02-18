"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function PrizePool() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const y2 = useTransform(scrollYProgress, [0, 1], [20, -20]);
  const y3 = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <motion.section
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center px-4 py-0 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      <div className="relative z-10 flex flex-col items-center text-center w-full pt-16 pb-0">
        <motion.h2
          className="text-5xl md:text-7xl font-pirate font-black text-center mb-16 text-transparent bg-clip-text bg-linear-to-b from-yellow-200 to-yellow-600 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] tracking-wide"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Prize Pool
        </motion.h2>

        <motion.div
          className="relative mb-12 flex flex-col items-center"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, duration: 1.2 }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 rounded-full border border-yellow-500/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-72 md:h-72 rounded-full border border-yellow-500/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-[28rem] md:h-[28rem] rounded-full bg-yellow-500/5 blur-2xl" />

          <span className="text-sm md:text-lg font-mono font-bold tracking-[0.5em] text-yellow-400/60 uppercase mb-2">
            Worth Over
          </span>
          <span
            className="text-6xl md:text-8xl lg:text-[12rem] font-black font-sans leading-none tracking-tight"
            style={{
              color: "#eab308",
              textShadow: "0 0 40px rgba(234,179,8,0.4)",
            }}
          >
            ₹3,00,000
            <span className="text-yellow-400/70">+</span>
          </span>
          <span className="text-lg md:text-2xl font-pirate text-yellow-300/50 tracking-[0.3em] mt-2">
            IN PRIZES
          </span>
        </motion.div>
      </div>

      <div className="relative w-full max-w-4xl mx-auto z-10">
        <div
          className="relative w-full"
          style={{ minHeight: "clamp(340px, 60vw, 640px)" }}
        >
          {/* Apply brochure card styles here */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between gap-0 sm:gap-4 rounded-3xl border border-cyan-500/30 backdrop-brightness-60 shadow-[0_0_50px_rgba(6,182,212,0.15)] pt-10 pb-4 mb-4">
            <motion.div
              style={{ y: y3 }}
              className="relative flex flex-col items-center"
              initial={{ opacity: 0, x: -60, y: 30 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.4,
                type: "spring",
                bounce: 0.3,
              }}
            >
              <motion.span
                className="text-xl sm:text-3xl md:text-4xl font-black font-mono mb-1 sm:mb-2"
                style={{
                  color: "#5bbbd4",
                  textShadow: "0 0 20px rgba(91,187,212,0.5)",
                }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                Rs. 50,000
              </motion.span>
              <img
                src="/images/prizes/3rdPrizemixed.png"
                alt="3rd Prize"
                className="w-28 sm:w-40 md:w-52 lg:w-64 h-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)]"
                style={{ marginBottom: "clamp(16px,4vw,48px)" }}
              />
            </motion.div>

            <motion.div
              style={{ y: y1 }}
              className="relative flex flex-col items-center z-10"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.1,
                type: "spring",
                bounce: 0.35,
              }}
            >
              <motion.span
                className="text-2xl sm:text-4xl md:text-5xl font-black font-mono mb-1 sm:mb-2"
                style={{
                  color: "#60c4de",
                  textShadow: "0 0 30px rgba(96,196,222,0.7)",
                }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Rs. 80,000
              </motion.span>
              <img
                src="/images/prizes/1stPrizemixed.png"
                alt="1st Prize"
                className="w-36 sm:w-52 md:w-68 lg:w-80 h-auto object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.9)]"
                style={{ marginBottom: "clamp(20px,5vw,60px)" }}
              />
            </motion.div>

            <motion.div
              style={{ y: y2 }}
              className="relative flex flex-col items-center"
              initial={{ opacity: 0, x: 60, y: 30 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.25,
                type: "spring",
                bounce: 0.3,
              }}
            >
              <motion.span
                className="text-xl sm:text-3xl md:text-4xl font-black font-mono mb-1 sm:mb-2"
                style={{
                  color: "#5bbbd4",
                  textShadow: "0 0 20px rgba(91,187,212,0.5)",
                }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Rs. 30,000
              </motion.span>
              <img
                src="/images/prizes/2ndPrizemixed.png"
                alt="2nd Prize"
                className="w-28 sm:w-40 md:w-52 lg:w-64 h-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)]"
                style={{ marginBottom: "clamp(16px,4vw,48px)" }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
