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
