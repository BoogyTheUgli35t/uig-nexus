import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://unifiedinnovationsgroup.online";

const paths = [
  "/",
  "/about",
  "/services",
  "/divisions",
  "/divisions/technology",
  "/divisions/agritech",
  "/divisions/real-estate",
  "/divisions/logistics",
  "/divisions/intelligence",
  "/divisions/innovation-lab",
  "/careers",
  "/insights",
  "/contact",
];

const insightSlugs: string[] = [
  "nigeria-agriculture-tech-opportunity",
  "case-for-native-african-ai",
  "lagos-real-estate-2025",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const all = [...paths, ...insightSlugs.map((s) => `/insights/${s}`)];
        const urls = all
          .map(
            (p) =>
              `  <url>\n    <loc>${BASE_URL}${p}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
