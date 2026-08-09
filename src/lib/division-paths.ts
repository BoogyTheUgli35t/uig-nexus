import type { DivisionSlug } from "@/lib/divisions";

/**
 * Concrete workspace routes per division. Each division owns a real index
 * route, so links must target those paths directly instead of a catch-all
 * `$slug` route (which produced router "generated path matched other route"
 * warnings and rendered a duplicate shell).
 */
const DIVISION_PATHS = {
  technology: "/portal/divisions/technology",
  agritech: "/portal/divisions/agritech",
  "real-estate": "/portal/divisions/real-estate",
  logistics: "/portal/divisions/logistics",
  intelligence: "/portal/divisions/intelligence",
  "innovation-lab": "/portal/divisions/innovation-lab",
} as const;

export type DivisionPath = (typeof DIVISION_PATHS)[DivisionSlug];

export function divisionPath(slug: DivisionSlug): DivisionPath {
  return DIVISION_PATHS[slug];
}
