"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useDayNight } from "~/components/providers/useDayNight";

export default function NotFound() {
  const { isNight } = useDayNight();

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Full-screen background — swaps based on day/night */}
      {/* biome-ignore lint/performance/noImgElement: static 404 page */}
      <img
        src={isNight ? "/images/404-dark.webp" : "/images/404-light.webp"}
        alt="404 – Broken Submarine"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-opacity duration-700"
        key={isNight ? "dark" : "light"}
      />

      {/* Gradient overlay — heavy on the right so text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/50 to-black/10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Content — right-aligned */}
      <div className="relative z-10 flex min-h-screen items-center justify-end px-8 md:px-20">
        <div className="flex flex-col items-start gap-6 max-w-lg">

          {/* 404 badge */}
          <span className="text-sm font-mono font-bold tracking-[0.5em] text-cyan-400/80 uppercase">
            Error 404
          </span>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-pirate font-black tracking-wider text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] leading-tight">
            Lost at
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500">
              Sea
            </span>
          </h1>

          {/* Sub-copy */}
          <p className="text-xl md:text-2xl font-crimson text-white/75 italic leading-relaxed">
            Our submarine took a wrong turn. The page you&apos;re navigating to
            has sunk to the ocean floor.
          </p>

          {/* Go Home — same style as "Explore Timeline" button */}
          <Link href="/" passHref>
            <button
              type="button"
              className="group relative px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-pirate font-bold text-2xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black tracking-wide mt-2"
            >
              <span className="relative z-10">Return to Surface</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </Link>

        </div>
      </div>
    </main>
  );
}
