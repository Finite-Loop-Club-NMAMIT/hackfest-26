"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const OceanFloor = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1200 500"
    preserveAspectRatio="xMidYMax slice"
    style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: 0,
    }}
  >
    <defs>
      {/* Top-fade so it blends into the dark section above */}
      <linearGradient id="og-waterFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#020c1a" stopOpacity="0" />
        <stop offset="50%" stopColor="#030e1c" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#010810" stopOpacity="1" />
      </linearGradient>

      {/* Layered rock gradients – slightly lighter tops so they read */}
      <linearGradient id="og-rockBack" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#16324e" />
        <stop offset="100%" stopColor="#060f1d" />
      </linearGradient>
      <linearGradient id="og-rockMid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a3a58" />
        <stop offset="100%" stopColor="#08172a" />
      </linearGradient>
      <linearGradient id="og-rockFront" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1f4268" />
        <stop offset="100%" stopColor="#0a1b30" />
      </linearGradient>
      <linearGradient id="og-sediment" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0c1e32" />
        <stop offset="100%" stopColor="#050d1a" />
      </linearGradient>

      {/* Glow filters */}
      <filter id="og-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="og-strongGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="14" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="og-poolGlow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="22" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* ================================================================
        TERRAIN CONCEPT (matching the sketch):
        - Left mound  (x≈0–320):   peaks around x=160, y≈220
        - Valley 1    (x≈320–440): dips to y≈340
        - Centre mound(x≈440–760): peaks around x=600, y≈180
        - Valley 2    (x≈760–880): dips to y≈340
        - Right mound (x≈880–1200):peaks around x=1050, y≈230
    ================================================================ */}

    {/* ── BACK ridge (softest, furthest) ── */}
    <path
      d="
        M0,310
        C60,290 120,265 160,248
        C200,231 240,240 280,260
        C310,275 340,300 380,318
        C400,326 420,330 440,326
        C460,322 480,308 520,285
        C555,265 578,252 600,245
        C622,238 645,248 678,268
        C710,288 730,308 760,322
        C780,330 800,334 830,330
        C860,326 890,310 940,288
        C980,270 1010,258 1050,252
        C1090,246 1130,258 1170,272
        L1200,280
        L1200,500 L0,500 Z
      "
      fill="url(#og-rockBack)"
      opacity="0.75"
    />

    {/* ── MID ridge (main visible terrain) ── */}
    <path
      d="
        M0,330
        C40,308 90,278 140,258
        C175,244 210,248 245,265
        C272,278 295,300 320,320
        C338,334 358,344 382,342
        C406,340 425,328 455,308
        C480,291 510,272 545,258
        C568,248 590,243 612,248
        C634,253 655,265 685,285
        C712,303 732,322 758,336
        C775,344 795,350 820,347
        C845,344 872,332 910,312
        C945,294 975,278 1010,265
        C1040,254 1070,252 1105,260
        C1135,267 1165,280 1200,292
        L1200,500 L0,500 Z
      "
      fill="url(#og-rockMid)"
    />

    {/* ── FRONT ridge (closest, most detailed) ── */}
    <path
      d="
        M0,360
        C30,342 65,318 100,300
        C128,285 155,280 180,288
        C205,296 222,312 245,330
        C262,344 278,356 300,360
        C320,364 340,360 362,350
        C382,341 400,328 425,314
        C448,301 470,290 500,280
        C522,272 548,268 572,270
        C596,272 618,280 645,294
        C670,308 690,324 712,338
        C730,350 748,358 770,362
        C792,366 815,362 840,352
        C865,342 888,328 918,312
        C945,298 970,286 1000,278
        C1025,271 1055,270 1085,276
        C1112,282 1145,294 1175,308
        L1200,316
        L1200,500 L0,500 Z
      "
      fill="url(#og-rockFront)"
    />

    {/* ── SEDIMENT / fine top layer ── */}
    <path
      d="
        M0,382
        C35,370 70,358 105,350
        C132,344 158,342 182,348
        C206,354 222,366 244,374
        C260,380 278,384 298,382
        C318,380 338,372 360,362
        C380,353 402,344 428,337
        C452,330 476,328 500,330
        C524,332 546,338 570,346
        C592,354 612,362 634,368
        C654,374 676,378 698,376
        C720,374 742,366 766,356
        C790,346 814,336 840,330
        C866,324 892,324 918,328
        C942,332 966,340 992,350
        C1015,359 1040,368 1068,374
        C1094,380 1128,382 1165,376
        L1200,370
        L1200,500 L0,500 Z
      "
      fill="url(#og-sediment)"
    />

    {/* ── Coarse surface detail — pebble/rubble shapes along ridge tops ── */}
    {/* Left mound surface */}
    <ellipse cx="95" cy="302" rx="28" ry="9" fill="#1c3a55" opacity="0.7" />
    <ellipse cx="148" cy="288" rx="20" ry="7" fill="#1a3650" opacity="0.6" />
    <ellipse cx="198" cy="295" rx="16" ry="6" fill="#162e48" opacity="0.65" />

    {/* Left valley */}
    <ellipse cx="350" cy="345" rx="18" ry="6" fill="#0f2236" opacity="0.8" />
    <ellipse cx="390" cy="352" rx="12" ry="4" fill="#0d1e30" opacity="0.7" />

    {/* Centre mound */}
    <ellipse cx="520" cy="282" rx="22" ry="8" fill="#1e4060" opacity="0.65" />
    <ellipse cx="600" cy="268" rx="30" ry="9" fill="#1c3c5a" opacity="0.6" />
    <ellipse cx="672" cy="278" rx="18" ry="7" fill="#183452" opacity="0.65" />

    {/* Right valley */}
    <ellipse cx="800" cy="348" rx="20" ry="6" fill="#0f2236" opacity="0.8" />
    <ellipse cx="840" cy="355" rx="14" ry="5" fill="#0d1e30" opacity="0.7" />

    {/* Right mound */}
    <ellipse cx="940" cy="315" rx="24" ry="8" fill="#1a3a55" opacity="0.65" />
    <ellipse cx="1020" cy="290" rx="26" ry="9" fill="#1c3c58" opacity="0.6" />
    <ellipse cx="1100" cy="298" rx="18" ry="7" fill="#162e48" opacity="0.65" />

    {/* ── Ambient glow pools in valleys and on mound tops ── */}
    <ellipse
      cx="370"
      cy="360"
      rx="120"
      ry="30"
      fill="#062840"
      opacity="0.18"
      filter="url(#og-poolGlow)"
    />
    <ellipse
      cx="600"
      cy="300"
      rx="160"
      ry="45"
      fill="#083850"
      opacity="0.14"
      filter="url(#og-poolGlow)"
    />
    <ellipse
      cx="820"
      cy="362"
      rx="120"
      ry="30"
      fill="#062840"
      opacity="0.18"
      filter="url(#og-poolGlow)"
    />

    {/* ── Bioluminescent dots — valleys glow more ── */}
    {/* Left valley cluster */}
    <circle
      cx="340"
      cy="354"
      r="2.5"
      fill="#22d3ee"
      opacity="0.75"
      filter="url(#og-strongGlow)"
    />
    <circle
      cx="355"
      cy="360"
      r="1.5"
      fill="#67e8f9"
      opacity="0.6"
      filter="url(#og-glow)"
    />
    <circle
      cx="368"
      cy="356"
      r="1.8"
      fill="#0ea5e9"
      opacity="0.65"
      filter="url(#og-glow)"
    />
    <circle
      cx="325"
      cy="358"
      r="1.2"
      fill="#38bdf8"
      opacity="0.5"
      filter="url(#og-glow)"
    />
    <circle
      cx="382"
      cy="362"
      r="1"
      fill="#7dd3fc"
      opacity="0.5"
      filter="url(#og-glow)"
    />

    {/* Right valley cluster */}
    <circle
      cx="800"
      cy="356"
      r="2.5"
      fill="#22d3ee"
      opacity="0.75"
      filter="url(#og-strongGlow)"
    />
    <circle
      cx="816"
      cy="362"
      r="1.5"
      fill="#67e8f9"
      opacity="0.6"
      filter="url(#og-glow)"
    />
    <circle
      cx="829"
      cy="358"
      r="1.8"
      fill="#0ea5e9"
      opacity="0.65"
      filter="url(#og-glow)"
    />
    <circle
      cx="786"
      cy="360"
      r="1.2"
      fill="#38bdf8"
      opacity="0.5"
      filter="url(#og-glow)"
    />
    <circle
      cx="843"
      cy="364"
      r="1"
      fill="#7dd3fc"
      opacity="0.5"
      filter="url(#og-glow)"
    />

    {/* Left mound scattered specks */}
    <circle
      cx="105"
      cy="306"
      r="1.5"
      fill="#22d3ee"
      opacity="0.5"
      filter="url(#og-glow)"
    />
    <circle
      cx="160"
      cy="292"
      r="1"
      fill="#67e8f9"
      opacity="0.45"
      filter="url(#og-glow)"
    />
    <circle
      cx="210"
      cy="300"
      r="1.2"
      fill="#38bdf8"
      opacity="0.5"
      filter="url(#og-glow)"
    />

    {/* Centre mound scattered specks */}
    <circle
      cx="510"
      cy="286"
      r="1.5"
      fill="#22d3ee"
      opacity="0.5"
      filter="url(#og-glow)"
    />
    <circle
      cx="600"
      cy="272"
      r="2"
      fill="#67e8f9"
      opacity="0.55"
      filter="url(#og-strongGlow)"
    />
    <circle
      cx="680"
      cy="282"
      r="1.2"
      fill="#38bdf8"
      opacity="0.5"
      filter="url(#og-glow)"
    />

    {/* Right mound scattered specks */}
    <circle
      cx="945"
      cy="319"
      r="1.5"
      fill="#22d3ee"
      opacity="0.5"
      filter="url(#og-glow)"
    />
    <circle
      cx="1022"
      cy="294"
      r="2"
      fill="#67e8f9"
      opacity="0.55"
      filter="url(#og-strongGlow)"
    />
    <circle
      cx="1105"
      cy="302"
      r="1.2"
      fill="#38bdf8"
      opacity="0.5"
      filter="url(#og-glow)"
    />

    {/* Lone sparse specks elsewhere */}
    <circle
      cx="60"
      cy="348"
      r="1"
      fill="#a5f3fc"
      opacity="0.4"
      filter="url(#og-glow)"
    />
    <circle
      cx="460"
      cy="342"
      r="1"
      fill="#a5f3fc"
      opacity="0.4"
      filter="url(#og-glow)"
    />
    <circle
      cx="740"
      cy="340"
      r="1"
      fill="#a5f3fc"
      opacity="0.4"
      filter="url(#og-glow)"
    />
    <circle
      cx="1150"
      cy="320"
      r="1"
      fill="#a5f3fc"
      opacity="0.4"
      filter="url(#og-glow)"
    />

    {/* ── Water fade overlay (top transparency blend) ── */}
    <rect x="0" y="0" width="1200" height="500" fill="url(#og-waterFade)" />
  </svg>
);

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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-md md:h-112 rounded-full bg-yellow-500/5 blur-2xl" />

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

      {/* Card — overflow-hidden clips SVG + all children to rounded corners */}
      <div className="relative w-full max-w-4xl mx-auto z-10">
        <div
          className="relative w-full overflow-hidden rounded-3xl border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)]"
          style={{ minHeight: "clamp(340px, 60vw, 640px)" }}
        >
          {/* Ocean floor */}
          <OceanFloor />

          {/* Prize chests */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between gap-0 sm:gap-4 pt-10 pb-20 sm:pb-4 mb-4">
            {/* 3rd Place — sits on left mound */}
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

            {/* 1st Place — sits on centre peak */}
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

            {/* 2nd Place — sits on right mound */}
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
