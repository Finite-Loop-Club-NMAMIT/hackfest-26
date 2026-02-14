"use client";

import Image from "next/image";
import { useDayNight } from "~/components/providers/useDayNight";

export function TeamPageLayout({ children }: { children: React.ReactNode }) {
  const { isNight } = useDayNight();

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center justify-center p-6 py-12 md:p-12 overflow-hidden text-white transition-colors duration-1000 ${
        isNight
          ? "bg-linear-to-b from-[#0f172a] via-[#1e1a78] to-[#2d5f7c]"
          : "bg-linear-to-b from-[#10569c] via-[#61b2e4] to-[#eef7fb]"
      }`}
    >
      <div className="absolute inset-0 w-full h-full z-0 opacity-20 pointer-events-none mix-blend-multiply">
        <Image
          src="/images/palm-tree.png"
          alt="Palm trees"
          fill
          className="object-cover object-bottom"
          priority
        />
      </div>

      {/* --- DECORATIVE LAYERS (The Beach - adjusted for night) --- */}
      <div
        className={`absolute -bottom-[5%] left-[-20%] w-[140%] h-[25vh] md:h-[35vh] rounded-[100%] blur-3xl z-0 pointer-events-none transition-colors duration-1000 ${
          isNight ? "bg-[#1e1b4b]/40" : "bg-[#fffac2]/40"
        }`}
      />
      <div
        className={`absolute -bottom-[12%] left-[-10%] w-[120%] h-[20vh] md:h-[30vh] rounded-[50%] z-0 pointer-events-none transition-colors duration-1000 ${
          isNight
            ? "bg-[#312e81] shadow-[0_-10px_50px_rgba(30,27,75,0.8)]"
            : "bg-[#fbf6db] shadow-[0_-10px_50px_rgba(240,230,180,0.8)]"
        }`}
      />

      {children}
    </div>
  );
}
