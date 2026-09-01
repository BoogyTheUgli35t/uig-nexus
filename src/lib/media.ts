import { GENERATED_MEDIA } from "./generated-media";

/** Named delivery transforms (see docs/image-pipeline-design.md). Applied inline
 * so a single generated asset serves every surface at the right size/format. */
const TRANSFORMS = {
  hero: "f_auto,q_auto,c_fill,ar_16:9,w_1600",
  card: "f_auto,q_auto,c_fill,ar_16:10,w_800",
  thumb: "f_auto,q_auto,c_fill,ar_4:3,w_400",
  gallery: "f_auto,q_auto,c_fill,ar_4:3,w_1200",
} as const;

export type MediaTransform = keyof typeof TRANSFORMS;

/** Insert a transform into a Cloudinary delivery URL. Non-Cloudinary URLs
 * (local bundled assets) pass through untouched. */
export function withTransform(url: string, transform: MediaTransform): string {
  if (!url.includes("/image/upload/")) return url;
  return url.replace("/image/upload/", `/image/upload/${TRANSFORMS[transform]}/`);
}

/**
 * Resolve a media slot to a delivery URL.
 *
 * Generation is incremental (daily API quota), so a slot may not exist yet —
 * every call passes the bundled local asset as `fallback`, which means the site
 * always renders real imagery and upgrades to the generated version the moment
 * that slot lands in generated-media.ts. No broken images, ever.
 */
export function media(slot: string, fallback: string, transform?: MediaTransform): string {
  const generated = GENERATED_MEDIA[slot];
  if (!generated) return fallback;
  return transform ? withTransform(generated, transform) : generated;
}

/**
 * Right-size an arbitrary remote image for the slot it renders in.
 *
 * Property photos are stored at 1600px but rendered into ~400–800px cards, so
 * without this every listing grid downloads several megabytes it cannot use.
 * Handles both of the CDNs actually present in the data (Cloudinary for
 * generated imagery, Unsplash for seeded photos) and passes anything else —
 * including Supabase Storage objects — through untouched.
 */
export function sizedImage(url: string | null | undefined, width: number): string | null {
  if (!url) return null;
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
  }
  if (url.includes("images.unsplash.com")) {
    return url.replace(/([?&])w=\d+/, `$1w=${width}`);
  }
  return url;
}

/** Division hero: `uig/divisions/<slug>/hero`. */
export function divisionHero(slug: string, fallback: string): string {
  return media(`uig/divisions/${slug}/hero`, fallback, "hero");
}

/** Division marketing gallery — returns only the slots generated so far, so the
 * gallery strip either shows real images or is hidden entirely. */
export function divisionGallery(slug: string): string[] {
  return [1, 2, 3, 4]
    .map((n) => GENERATED_MEDIA[`uig/divisions/${slug}/gallery-${String(n).padStart(2, "0")}`])
    .filter((url): url is string => Boolean(url))
    .map((url) => withTransform(url, "gallery"));
}

// =============== Listing gallery sections ===============
//
// Buyers browse a property in three passes: what it looks like from the
// street, what it looks like inside, and where it sits. `property_images` has
// no category column, so the section is derived from the caption (which every
// seeded row has) and falls back to position. Deriving rather than storing
// keeps this working for portal uploads and generated renders alike; when a
// real column arrives, only this function changes.

export const LISTING_SECTIONS = ["exterior", "interior", "other"] as const;

export type ListingSection = (typeof LISTING_SECTIONS)[number];

export const LISTING_SECTION_LABELS: Record<ListingSection, string> = {
  exterior: "Outside",
  interior: "Indoors",
  other: "Area & more",
};

// Order matters. Unambiguous interior words win outright; then explicit
// exterior words ("exterior", "frontage", "elevation"); then context shots,
// so "Road and residential buildings" reads as street context rather than a
// picture of the house; then softer exterior words.
const INTERIOR = [
  "interior",
  "indoor",
  "inside",
  "living room",
  "sitting room",
  "bedroom",
  "kitchen",
  "bathroom",
  "washroom",
  "lounge",
  "dining",
  "hallway",
  "corridor",
  "staircase",
  "stairwell",
  "en-suite",
  "ensuite",
  "wardrobe",
  "ceiling",
  "flooring",
  "fitted",
];

const EXTERIOR_STRONG = ["exterior", "facade", "façade", "frontage", "elevation", "front view"];

const CONTEXT = [
  "aerial",
  "drone",
  "street",
  "road",
  "neighbourhood",
  "neighborhood",
  "skyline",
  "cityscape",
  "district",
  "surrounding",
  "adjoining",
  "access",
  "plot",
  "land",
  "survey",
  "map",
  "waterfront",
  "waterside",
  "estate street",
  "context",
];

const EXTERIOR_SOFT = [
  "building",
  "house",
  "home",
  "bungalow",
  "duplex",
  "compound",
  "gate",
  "garden",
  "pool",
  "driveway",
  "carport",
  "backyard",
  "roof",
  "balcony",
  "terrace",
  "porch",
  "verandah",
  "veranda",
];

const hits = (haystack: string, needles: string[]) => needles.some((n) => haystack.includes(n));

/**
 * Classify one listing photo into a gallery section.
 *
 * `caption` is the signal; `position` is the tiebreak for uncaptioned rows,
 * mirroring how the generator lays slots out (first shot outside, second
 * inside, the rest context).
 */
export function listingImageSection(
  caption: string | null | undefined,
  position = 0,
): ListingSection {
  const c = (caption ?? "").toLowerCase();
  if (c) {
    if (hits(c, INTERIOR)) return "interior";
    if (hits(c, EXTERIOR_STRONG)) return "exterior";
    if (hits(c, CONTEXT)) return "other";
    if (hits(c, EXTERIOR_SOFT)) return "exterior";
  }
  if (position === 0) return "exterior";
  if (position === 1) return "interior";
  return "other";
}

/** Group images into sections, preserving order and dropping empty sections. */
export function groupListingImages<T extends { caption: string | null; position: number }>(
  images: T[],
): { section: ListingSection; label: string; images: T[] }[] {
  return LISTING_SECTIONS.map((section) => ({
    section,
    label: LISTING_SECTION_LABELS[section],
    images: images.filter((i) => listingImageSection(i.caption, i.position) === section),
  })).filter((g) => g.images.length > 0);
}
