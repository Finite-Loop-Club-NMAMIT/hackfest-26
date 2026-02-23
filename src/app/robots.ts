import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://hackfest.dev";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api", "/profile"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
