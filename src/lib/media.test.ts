import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// The generated map is rewritten by scripts/generate-images.mjs on every batch,
// so tests mock it rather than asserting against whatever happens to be
// generated today.
vi.mock("./generated-media", () => ({
  GENERATED_MEDIA: {
    "uig/divisions/technology/hero":
      "https://res.cloudinary.com/demo/image/upload/v1/uig/divisions/technology/hero.jpg",
    "uig/divisions/technology/gallery-01":
      "https://res.cloudinary.com/demo/image/upload/v1/uig/divisions/technology/gallery-01.jpg",
    "uig/divisions/technology/gallery-03":
      "https://res.cloudinary.com/demo/image/upload/v1/uig/divisions/technology/gallery-03.jpg",
  },
}));

const LOCAL_FALLBACK = "/assets/hero-technology-abc123.jpg";

let media: typeof import("./media");

beforeEach(async () => {
  media = await import("./media");
});

afterEach(() => {
  vi.resetModules();
});

describe("media", () => {
  it("returns the generated URL when the slot exists", () => {
    expect(media.media("uig/divisions/technology/hero", LOCAL_FALLBACK)).toContain(
      "res.cloudinary.com",
    );
  });

  it("falls back to the bundled asset when the slot has not been generated", () => {
    // Generation is incremental (daily API quota) — an ungenerated slot must
    // render the local asset, never an empty src.
    expect(media.media("uig/divisions/logistics/hero", LOCAL_FALLBACK)).toBe(LOCAL_FALLBACK);
  });

  it("applies the requested transform to generated URLs", () => {
    const url = media.media("uig/divisions/technology/hero", LOCAL_FALLBACK, "hero");
    expect(url).toContain("/image/upload/f_auto,q_auto,c_fill,ar_16:9,w_1600/");
  });

  it("never rewrites a local fallback, even when a transform is requested", () => {
    expect(media.media("uig/divisions/logistics/hero", LOCAL_FALLBACK, "hero")).toBe(
      LOCAL_FALLBACK,
    );
  });
});

describe("divisionGallery", () => {
  it("returns only the slots generated so far, in order", () => {
    const gallery = media.divisionGallery("technology");
    expect(gallery).toHaveLength(2);
    expect(gallery[0]).toContain("gallery-01");
    expect(gallery[1]).toContain("gallery-03");
  });

  it("returns an empty array for a division with nothing generated", () => {
    // An empty array is what hides the gallery strip entirely — a partially
    // broken strip would be worse than none.
    expect(media.divisionGallery("logistics")).toEqual([]);
  });

  it("sizes gallery images rather than serving originals", () => {
    expect(media.divisionGallery("technology")[0]).toContain("w_1200");
  });
});

describe("sizedImage", () => {
  it("injects width and auto format into Cloudinary URLs", () => {
    const out = media.sizedImage(
      "https://res.cloudinary.com/demo/image/upload/v1/uig/listings/lagos/x/0.jpg",
      800,
    );
    expect(out).toContain("/image/upload/f_auto,q_auto,w_800/");
  });

  it("rewrites the existing width on Unsplash URLs instead of appending a second one", () => {
    const out = media.sizedImage(
      "https://images.unsplash.com/photo-123?auto=format&fit=crop&w=1600&q=80",
      400,
    );
    expect(out).toContain("w=400");
    expect(out).not.toContain("w=1600");
  });

  it("passes through URLs from other hosts untouched", () => {
    const supabaseUrl = "https://xyz.supabase.co/storage/v1/object/public/property-images/a.jpg";
    expect(media.sizedImage(supabaseUrl, 400)).toBe(supabaseUrl);
  });

  it("returns null for missing input rather than an unusable string", () => {
    expect(media.sizedImage(null, 400)).toBeNull();
    expect(media.sizedImage(undefined, 400)).toBeNull();
  });
});

describe("listingImageSection", () => {
  const cases: [string, string][] = [
    // Captions taken verbatim from the seeded property_images rows.
    ["Living room interior", "interior"],
    ["Daytime exterior view", "exterior"],
    ["Frontage detail", "exterior"],
    ["Side elevation", "exterior"],
    ["Low angle view of the building", "exterior"],
    ["Plaza exterior, Central Business District", "exterior"],
    ["Aerial view of the surrounding land", "other"],
    ["Aerial view of the free trade zone plots", "other"],
    ["Access road to the site", "other"],
    ["Estate street view", "other"],
    ["Estate skyline at dusk", "other"],
    ["Cityscape featuring the development and waterfront", "other"],
    ["Development underway on adjoining plot", "other"],
    // A street scene that mentions buildings is context, not a shot of the house.
    ["Road and residential buildings, Old GRA", "other"],
    // Fitted kitchen beats the word "estate" appearing nearby.
    ["Fitted kitchen in the estate show home", "interior"],
  ];

  it.each(cases)("classifies %s as %s", async (caption, expected) => {
    expect(media.listingImageSection(caption, 0)).toBe(expected);
  });

  it("falls back to position when there is no caption", async () => {
    expect(media.listingImageSection(null, 0)).toBe("exterior");
    expect(media.listingImageSection("", 1)).toBe("interior");
    expect(media.listingImageSection(null, 2)).toBe("other");
    expect(media.listingImageSection(null, 7)).toBe("other");
  });

  it("groups images into sections and drops the empty ones", async () => {
    const imgs = [
      { caption: "Daytime exterior view", position: 0 },
      { caption: "Living room interior", position: 1 },
      { caption: "Kitchen", position: 2 },
    ];
    const groups = media.groupListingImages(imgs);
    expect(groups.map((g) => g.section)).toEqual(["exterior", "interior"]);
    expect(groups[1].images).toHaveLength(2);
  });
});
