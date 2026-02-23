import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://hackfest.dev";

  const routes = [
    "",
    "/about",
    "/contact",
    "/login",
    "/register",
    "/teams",
    "/timeline",
    "/brochure",
  ];

  const sitemapRoutes: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));

  return sitemapRoutes;
}
