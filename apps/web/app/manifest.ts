import type { MetadataRoute } from "next";
import { getDictionary } from "@stayboost/i18n";

export default function manifest(): MetadataRoute.Manifest {
  const t = getDictionary().common;
  return {
    name: `${t.brand} — ${t.tagline}`,
    short_name: t.brand,
    description:
      "More bookings, more revenue, automated operations and happier guests — powered by AI.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0ea5e9",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
