import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Pirata_One, Cinzel } from "next/font/google";
import Script from "next/script";
import { ToasterWrapper } from "~/components/providers/toaster-wrapper";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const pirata = Pirata_One({
  weight: "400",
  variable: "--font-pirata",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hackfest",
  description:
    "Hackfest is a 36-hour National Level Hackathon organised by Finite Loop Club, NMAMIT, Nitte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${pirata.variable} ${cinzel.variable} antialiased dark`}>
        {children}
        <ToasterWrapper />
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
