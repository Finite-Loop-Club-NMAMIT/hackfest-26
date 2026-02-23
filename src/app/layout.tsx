import type { Metadata } from "next";
import { Crimson_Text, Pirata_One, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { ToasterWrapper } from "~/components/providers/toaster-wrapper";
import { DayNightProvider } from "~/components/providers/useDayNight";
import { GlobalLoader } from "~/components/ui/global-loader";
import { ThemeToggle } from "~/components/ui/theme-toggle";
import "./globals.css";
import { JsonLd } from "~/components/ui/json-ld";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const pirata = Pirata_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pirata",
});

const crimson = Crimson_Text({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-crimson",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hackfest.dev"),
  title: {
    template: "%s | Hackfest",
    default: "Hackfest",
  },
  description:
    "Hackfest is a 36-hour National Level Hackathon organised by Finite Loop Club, NMAMIT, Nitte",
  keywords: [
    "Hackfest",
    "Hackfest 26",
    "Karnataka Hackathons",
    "Hackathon",
    "Finite Loop Club",
    "NMAMIT",
    "Nitte",
  ],
  authors: [{ name: "Finite Loop Club" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://hackfest.dev",
    title: "Hackfest",
    description:
      "Hackfest is a 36-hour National Level Hackathon organised by Finite Loop Club, NMAMIT, Nitte",
    siteName: "Hackfest",
  },
  twitter: {
    images: ["/logos/hflogowithbg.webp"],
    card: "summary_large_image",
    title: "Hackfest",
    description:
      "Hackfest is a 36-hour National Level Hackathon organised by Finite Loop Club, NMAMIT, Nitte",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${pirata.variable} ${crimson.variable} antialiased dark select-none`}
      >
        {/* <ReactScan /> */}
        <SessionProvider>
          <DayNightProvider>
            <GlobalLoader />
            {children}
            <ThemeToggle />
            <ToasterWrapper />
            <JsonLd />
          </DayNightProvider>
        </SessionProvider>
        {/* Umami Analytics */}
        <Script
          defer
          src="https://analytics.finiteloop.club/script.js"
          data-website-id="3c904eb5-16f5-428c-9c63-146a683de618"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
