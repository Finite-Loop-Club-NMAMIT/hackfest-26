"use client";

import Image from "next/image";
import { useDayNight } from "~/components/providers/useDayNight";

export function TeamPageLayout({ children }: { children: React.ReactNode }) {
  const { isNight } = useDayNight();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 py-12 md:p-12 overflow-hidden text-white">
      {/* --- BACKGROUND IMAGE CONTAINER --- */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <Image
          src={
            isNight
              ? "/images/shipwreck/shipwreckNight.webp"
              : "/images/shipwreck/shipwreckDay.webp"
          }
          alt="Shipwreck background"
          fill
          className="object-cover object-bottom"
          priority
        />
      </div>

      {/* Render the inner page content (which already has z-10) */}
      {children}
    </div>
  );
}
