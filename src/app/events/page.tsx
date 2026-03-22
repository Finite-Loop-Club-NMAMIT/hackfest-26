import type { Metadata } from "next";
import { Suspense } from "react";
import { auth as eventAuth } from "~/auth/event-config";
import Events from "~/components/events/layout";
import Footer from "~/components/landing/Footer";
import { Navbar } from "~/components/landing/Navbar";

export const metadata: Metadata = {
  title: {
    absolute: "Hackfest'26 Side Quests | CTF, Treasure Hunt & Tech Banter",
  },
  description:
    "Explore Hackfest'26 Side Quests — CTF challenges, treasure hunt and tech banter. Exciting additional events at NMAMIT, Nitte (April 17–19). Participate, compete, and win.",
  keywords: [
    "CTF",
    "Capture The Flag",
    "CTF challenge NMAMIT",
    "treasure hunt",
    "tech banter",
    "Hackfest side quests",
    "Hackfest events",
    "Hackfest 2026 events",
    "college tech events",
    "hackathon side events",
    "NMAMIT events",
    "Nitte tech fest",
    "coding competition",
  ],
  alternates: {
    canonical: "https://hackfest.dev/events",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Hackfest",
    title: "Hackfest'26 Side Quests | CTF, Treasure Hunt & Tech Banter",
    description:
      "Explore Hackfest'26 Side Quests — CTF challenges, treasure hunt and tech banter. Exciting additional events at NMAMIT, Nitte (April 17–19). Participate, compete, and win.",
    url: "https://hackfest.dev/events",
    images: [
      {
        url: "/logos/hflogowithbg.webp",
        width: 1200,
        height: 630,
        alt: "Hackfest Events | Side Quests",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hackfest'26 Side Quests | CTF, Treasure Hunt & Tech Banter",
    description:
      "Explore Hackfest'26 Side Quests — CTF challenges, treasure hunt and tech banter. Exciting additional events at NMAMIT, Nitte (April 17–19). Participate, compete, and win.",
    images: ["/logos/hflogowithbg.webp"],
  },
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await eventAuth();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar isUnderwater={true} session={session} authType="event" />
      </div>
      <Events session={session} searchParams={searchParams} />
      <Footer />
    </Suspense>
  );
}
