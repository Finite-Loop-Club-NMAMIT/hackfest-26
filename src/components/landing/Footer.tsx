"use client";

import { Instagram, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDayNight } from "~/components/providers/useDayNight";

const social = [
  {
    link: "https://www.instagram.com/hackfest.dev",
    icon: <Instagram className="h-6 w-6 transition-colors" />,
    name: "Instagram",
  },
  {
    link: "mailto:admin@hackfest.dev",
    icon: <Mail className="h-6 w-6 transition-colors" />,
    name: "E-mail",
  },
];

const Footer = ({ overlayNeeded = false }: { overlayNeeded?: boolean }) => {
  const { isNight } = useDayNight();

  return (
    <footer className="relative z-20 w-full flex flex-col">
      <div className="relative h-45 w-full overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 z-10 bg-transparent bg-[url('/images/corals_cropped.png')] bg-repeat-x bg-size-[auto_100%] bg-top-left pointer-events-none transition-all duration-1000"
          style={{
            filter: isNight
              ? "brightness(0.5) saturate(0.8) sepia(0.2) hue-rotate(180deg)"
              : "brightness(0.6) saturate(0.8) hue-rotate(-5deg) contrast(1.0)",
          }}
        />
      </div>
      <div
        className={`relative z-20 w-full flex-col overflow-hidden border-t transition-colors duration-1000 bg-linear-to-b md:backdrop-blur-md ${
          isNight
            ? "border-sky-900/40 from-[#0f2a3f] via-[#091a2a] to-[#040e1a]"
            : "border-sky-300/40 from-[#8e8071] via-[#6b5e50] to-[#42392f]"
        }`}
      >
        <div // [RAHUL]: Have put noisy overlay here, in case it gives any issues have to remove
          className={`${overlayNeeded ? "hidden md:block" : "hidden"} absolute inset-0 pointer-events-none z-0 mix-blend-overlay transition-opacity duration-1000`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-evenly space-y-12 p-4 py-8 lg:flex-row">
          {/* Glow effect */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-linear-to-r from-transparent to-transparent blur-sm transition-colors duration-1000 ${isNight ? "via-sky-600/50" : "via-amber-300/60"}`}
          />

          <div className="flex flex-col items-center gap-8 z-10">
            <div
              className={`flex flex-col items-center justify-center gap-4 transition-all duration-1000`}
            >
              <div className="flex flex-row items-center justify-center gap-6">
                <Link href="/" className="relative z-50 pointer-events-auto">
                  <Image
                    src="/logo.webp"
                    priority
                    alt="Logo - Hackfest"
                    width={95}
                    height={50}
                    className={`transition-all duration-1000 ${isNight ? "drop-shadow-[0_0_15px_rgba(2,132,199,0.6)]" : "drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]"}`}
                  />
                </Link>
                <Link
                  href="https://finiteloop.club/"
                  target="_blank"
                  className="relative z-50 pointer-events-auto"
                >
                  <Image
                    src="/logos/flc_logo_crop.png"
                    priority
                    alt="Logo - Finite Loop Club"
                    width={75}
                    height={50}
                    className="opacity-85 hover:opacity-100 transition-all duration-1000"
                  />
                </Link>
              </div>
              <Link
                href="https://nitte.edu.in/nmamit/"
                target="_blank"
                className="relative z-50 pointer-events-auto"
              >
                <Image
                  src="/logos/NMAMITLogo.png"
                  priority
                  alt="Logo - NMAMIT"
                  width={180}
                  height={100}
                  className="opacity-85 hover:opacity-100 transition-all duration-1000"
                  style={{
                    filter: isNight
                      ? "brightness(0) invert(1) opacity(0.8)"
                      : "brightness(0) invert(1) opacity(0.95)",
                  }}
                />
              </Link>
            </div>
            <div className="flex flex-col items-center gap-4 md:gap-4">
              <p
                className={`text-base font-medium transition-colors duration-1000 ${isNight ? "text-stone-300" : "text-amber-50"}`}
              >
                Connect with us:
              </p>
              <ul className="flex gap-6 md:gap-6">
                {social.map((link) => (
                  <li
                    key={link.name}
                    className="relative z-50 pointer-events-auto"
                  >
                    <Link
                      href={link.link}
                      className={`block text-2xl transition-all duration-1000 hover:scale-110 ${isNight ? "text-sky-400 hover:text-sky-300" : "text-amber-100 hover:text-white"}`}
                      target={
                        link.link.startsWith("mailto:") ? undefined : "_blank"
                      }
                    >
                      {link.icon}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center gap-8 z-10">
            <div className="flex flex-col items-center justify-center gap-10 md:flex-row">
              <div
                data-lenis-prevent
                className={`overflow-hidden rounded-lg border transition-colors duration-1000 relative z-30 ${isNight ? "border-sky-800/40 shadow-[0_0_15px_rgba(2,132,199,0.15)]" : "border-amber-600/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]"}`}
                style={{ touchAction: "auto", overscrollBehavior: "contain" }}
                onWheel={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <iframe
                  title="Maps"
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15538.662520521424!2d74.93399100000002!3d13.18347!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbb56415ad85e5b%3A0x10b77ac6f6afc7fa!2sNitte%20Mahalinga%20Adyantaya%20Memorial%20Institute%20of%20Technology%20-%20NMAMIT!5e0!3m2!1sen!2sin!4v1771872967031!5m2!1sen!2sin"
                  width="250"
                  height="180"
                  style={{
                    border: 0,
                    touchAction: "auto",
                    pointerEvents: "auto",
                  }}
                  className={`relative z-30 filter transition-all duration-1000 ${isNight ? "sepia-0 grayscale opacity-80 hover:opacity-100 hover:grayscale-50" : "sepia-[0.3] hue-rotate-15 saturate-[0.9] hover:sepia-0 hover:saturate-100"}`}
                  aria-hidden="false"
                  loading="lazy"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="flex flex-col gap-2 text-center">
                <p
                  className={`text-lg font-bold transition-colors duration-1000 ${isNight ? "text-sky-300" : "text-amber-100"}`}
                >
                  NMAM Institute of Technology, Nitte
                </p>
                <p
                  className={`text-sm font-medium transition-colors duration-1000 ${isNight ? "text-stone-400" : "text-amber-50/80"}`}
                >
                  Karkala, Udupi District, Karnataka
                </p>
              </div>
            </div>
            <p
              className={`text-center text-base font-medium transition-colors duration-1000 ${isNight ? "text-stone-300" : "text-amber-50/90"}`}
            >
              Interested to sponsor? Let us know{" "}
              <Link
                href="mailto:sponsor@hackfest.dev"
                className={`relative z-50 pointer-events-auto underline font-bold transition-all duration-1000 hover:scale-105 inline-block ${isNight ? "text-sky-400 hover:text-sky-300" : "text-amber-100 hover:text-white"}`}
              >
                sponsor@hackfest.dev
              </Link>
            </p>
          </div>
        </div>
        <div
          className={`w-full border-t py-4 text-center font-medium text-sm transition-colors duration-1000 ${isNight ? "border-sky-900/40 text-stone-500" : "border-amber-900/40 text-amber-50/60"}`}
        >
          <p>2026 &copy; Hackfest | All rights reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
