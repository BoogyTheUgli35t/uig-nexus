import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { FLAGS } from "@/lib/flags";
import { SITE_URL } from "@/lib/seo";
import { insights } from "@/lib/insights";

/** How often each kind of page is worth recrawling. */
type Freq = "daily" | "weekly" | "monthly" | "yearly";

const paths: [string, Freq][] = [
  ["/", "weekly"],
  ["/about", "monthly"],
  ["/services", "monthly"],
  ["/divisions", "weekly"],
  ["/divisions/technology", "weekly"],
  ["/divisions/agritech", "weekly"],
  ["/divisions/real-estate", "weekly"],
  ["/divisions/logistics", "weekly"],
  ["/divisions/intelligence", "weekly"],
  ["/divisions/innovation-lab", "weekly"],
  ["/careers", "weekly"],
  ["/insights", "weekly"],
  ["/contact", "monthly"],
  ["/track", "monthly"],
  // Legal pages change rarely but are linked from every page in the footer and
  // are crawled anyway — they were the four live routes missing here.
  ["/privacy", "yearly"],
  ["/terms", "yearly"],
  ["/cookies", "yearly"],
];

/** Pages behind feature flags. Advertising a URL that redirects wastes crawl
 * budget and can look like cloaking, so a dark-launched page stays out of the
 * sitemap until it's actually live. */
const flaggedPaths: [string, boolean, Freq][] = [
  ["/divisions/real-estate/listings", FLAGS.realEstateListings, "daily"],
  ["/divisions/innovation-lab/submit", FLAGS.innovationIntake, "monthly"],
  ["/status", FLAGS.statusPage, "daily"],
];

/**
 * Every live listing URL, generated at request time.
 *
 * The sitemap listed `/divisions/real-estate/listings` and stopped there, so
 * every state page and every individual property — the highest-intent URLs on
 * the site, the ones someone searching "3 bedroom Lekki" would land on — was
 * invisible to crawlers. Queried directly with the anon client, exactly as the
 * public listing pages do; a failure returns nothing rather than 500ing the
 * whole sitemap.
 */
async function listingPaths(): Promise<[string, Freq][]> {
  if (!FLAGS.realEstateListings) return [];
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("properties")
      .select("id, state")
      .neq("status", "off_market")
      .not("state", "is", null);
    if (error || !data) return [];

    const states = new Set<string>();
    const out: [string, Freq][] = [];
    for (const p of data) {
      if (!p.state) continue;
      states.add(p.state);
      out.push([
        `/divisions/real-estate/listings/${encodeURIComponent(p.state)}/${p.id}`,
        "weekly",
      ]);
    }
    return [
      ...Array.from(states).map(
        (s) =>
          [`/divisions/real-estate/listings/${encodeURIComponent(s)}`, "daily"] as [string, Freq],
      ),
      ...out,
    ];
  } catch {
    return [];
  }
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const all: [string, Freq][] = [
          ...paths,
          ...flaggedPaths
            .filter(([, enabled]) => enabled)
            .map(([p, , f]) => [p, f] as [string, Freq]),
          // Slugs come from the same module the pages render from, so a new
          // article can't be published without appearing here.
          ...insights.map((i) => [`/insights/${i.slug}`, "monthly"] as [string, Freq]),
          ...(await listingPaths()),
        ];

        const urls = all
          .map(
            ([p, freq]) =>
              `  <url>\n    <loc>${SITE_URL}${p}</loc>\n    <changefreq>${freq}</changefreq>\n  </url>`,
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
