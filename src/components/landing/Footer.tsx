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
  {
    link: "https://discord.gg/d9hQV8Hcv6",
    // TODO[RAHUL]: Add Discord icon and link update
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 512"
        className="h-6 w-6 fill-current transition-colors"
        aria-label="Discord"
      >
        <title>Discord</title>
        <path d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.135a1.814,1.814,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.814,1.814,0,0,1,1.924.233c2.944,2.418,6.027,4.855,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.856,167.451,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z" />
      </svg>
    ),
    name: "Discord",
  },
];

const Footer = ({ overlayNeeded = false }: { overlayNeeded?: boolean }) => {
  const { isNight } = useDayNight();

  return (
    <footer className="relative z-20 w-full flex flex-col">
      <div
        className={`relative h-45 ${overlayNeeded ? "bg-black/50" : ""} w-full overflow-hidden`}
      >
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
          className={`hidden md:block absolute inset-0 pointer-events-none z-0 mix-blend-overlay transition-opacity duration-1000`}
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
                <Image
                  src="/logo.webp"
                  priority
                  alt="Logo - Hackfest"
                  width={95}
                  height={50}
                  className=""
                />
                <Link href="https://www.finiteloop.club/" target="_blank">
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
              <Link href="https://nitte.edu.in/nmamit/" target="_blank">
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
                  <li key={link.name}>
                    <Link
                      href={link.link}
                      className={`block text-2xl transition-all duration-1000 hover:scale-110 ${isNight ? "text-sky-400 hover:text-sky-300" : "text-amber-100 hover:text-white"}`}
                      target="_blank"
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
                className={`overflow-hidden rounded-lg border transition-colors duration-1000 ${isNight ? "border-sky-800/40 shadow-[0_0_15px_rgba(2,132,199,0.15)]" : "border-amber-600/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]"}`}
              >
                <iframe
                  title="Maps"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3884.6730533394866!2d74.93141407492217!3d13.183002587152156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbb56415ad85e5b%3A0x10b77ac6f6afc7fa!2sN.M.A.M.%20Institute%20of%20Technology!5e0!3m2!1sen!2sin!4v1705002903689!5m2!1sen!2sin"
                  width="250"
                  height="180"
                  style={{ border: 0 }}
                  className={`filter transition-all duration-1000 ${isNight ? "sepia-0 grayscale opacity-80 hover:opacity-100 hover:grayscale-50" : "sepia-[0.3] hue-rotate-15 saturate-[0.9] hover:sepia-0 hover:saturate-100"}`}
                  aria-hidden="false"
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
                className={`underline font-bold transition-all duration-1000 hover:scale-105 inline-block ${isNight ? "text-sky-400 hover:text-sky-300" : "text-amber-100 hover:text-white"}`}
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
