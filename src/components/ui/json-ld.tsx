"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

export function JsonLd() {
  const pathname = usePathname();

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hackathon",
    name: "Hackfest",
    description:
      "Hackfest is a 36-hour National Level Hackathon organised by Finite Loop Club, NMAMIT, Nitte",
    url: "https://hackfest.dev",
    organizer: {
      "@type": "Organization",
      name: "Finite Loop Club",
      url: "https://finiteloop.club",
    },
    location: {
      "@type": "Place",
      name: "NMAM Institute of Technology",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Nitte, Karkala",
        addressRegion: "Karnataka",
        addressCountry: "IN",
      },
    },
    startDate: "2026-04-17T09:00:00+05:30",
    endDate: "2026-04-19T21:00:00+05:30",
  };

  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: injecting json-ld
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      strategy="afterInteractive"
    />
  );
}
