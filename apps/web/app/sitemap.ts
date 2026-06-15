import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stayboost.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only list routes that exist today; add /signup, /login as those features
  // ship so we never advertise a 404 to crawlers.
  const routes = ["", "/pricing", "/analyzer", "/contact"];
  const lastModified = new Date();
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
