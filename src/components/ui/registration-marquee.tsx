"use client";

import { usePathname } from "next/navigation";

const MarqueeItem = () => (
  <span className="inline-flex items-center gap-3 px-8 text-sm tracking-wide">
    <span className="font-crimson text-amber-100 font-semibold">
      Registrations Extended!
    </span>
    <span className="text-amber-400/60">•</span>
    <span className="font-crimson text-amber-200/90">
      Last date to register:{" "}
      <strong className="text-amber-300">20th March, 11:59 PM</strong>
    </span>
    <span className="text-amber-400/60">•</span>
    <span className="font-crimson text-amber-200/80 italic">
      Don&apos;t miss out, set sail now!
    </span>
  </span>
);

export function RegistrationMarquee() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) return null;

  return (
    <div className="relative z-50 overflow-hidden bg-linear-to-r from-amber-900/90 via-yellow-800/90 to-amber-900/90 border-b border-amber-600/40">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjE1LDAsMC4wOCkiLz48L3N2Zz4=')] opacity-50" />
      <div className="marquee-track flex whitespace-nowrap py-1">
        <div className="flex shrink-0 min-w-full justify-around">
          <MarqueeItem />
          <MarqueeItem />
          <MarqueeItem />
        </div>
        <div className="flex shrink-0 min-w-full justify-around">
          <MarqueeItem />
          <MarqueeItem />
          <MarqueeItem />
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          animation: marquee-scroll 20s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
