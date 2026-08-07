import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Unauthenticated server functions for the public real-estate listings pages
// (marketing site, not the portal CRM). These deliberately do NOT use the
// requireSupabaseAuth middleware — they run as the Supabase `anon` role,
// which is granted narrow read access to non off-market properties by
// 20260714120000_public_listings.sql. Never select or return owner_id,
// leads, tenants, or any other internal-CRM-only column here.

export const LISTING_TYPES = ["sale", "rent"] as const;
export const LISTING_PROPERTY_TYPES = ["residential", "commercial", "land", "mixed_use"] as const;

const PUBLIC_PROPERTY_FIELDS =
  "id, title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured, land_title_type";

// =============== Locations (state/city groups) ===============

/** Every location (state) with at least one listable property — counts,
 * price range, sale/rent/land mix and a cover photo — for the public
 * "choose your location" picker. */
export const getListingLocations = createServerFn({ method: "GET" }).handler(async () => {
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, state, city, price, listing_type, property_type, featured, status")
    .neq("status", "off_market")
    .not("state", "is", null);
  if (error) throw new Error(error.message);

  const rows = properties ?? [];
  const byState = new Map<string, typeof rows>();
  for (const p of rows) {
    if (!p.state) continue;
    if (!byState.has(p.state)) byState.set(p.state, []);
    byState.get(p.state)!.push(p);
  }

  const ids = rows.map((p) => p.id);
  const { data: images } = ids.length
    ? await supabase
        .from("property_images")
        .select("property_id, storage_path")
        .in("property_id", ids)
        .eq("position", 0)
    : { data: [] as { property_id: string; storage_path: string }[] };
  const coverByProperty = new Map<string, string>();
  for (const img of images ?? []) coverByProperty.set(img.property_id, img.storage_path);

  const locations = Array.from(byState.entries()).map(([state, props]) => {
    const forSale = props.filter((p) => p.listing_type === "sale").length;
    const forRent = props.filter((p) => p.listing_type === "rent").length;
    const featured = props.find((p) => p.featured) ?? props[0];
    const prices = props.map((p) => Number(p.price ?? 0)).filter((n) => n > 0);
    return {
      state,
      city: props[0]?.city ?? state,
      totalListings: props.length,
      forSale,
      forRent,
      hasLand: props.some((p) => p.property_type === "land"),
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      coverImage: featured ? (coverByProperty.get(featured.id) ?? null) : null,
    };
  });

  return locations.sort((a, b) => b.totalListings - a.totalListings);
});

// =============== Listings within a location ===============

const ListingsByLocationSchema = z.object({
  state: z.string().trim().min(1),
  listingType: z.enum(LISTING_TYPES).optional(),
  propertyType: z.enum(LISTING_PROPERTY_TYPES).optional(),
  minBedrooms: z.coerce.number().int().min(0).optional(),
});

export const getListingsByLocation = createServerFn({ method: "GET" })
  .validator((i: unknown) => ListingsByLocationSchema.parse(i))
  .handler(async ({ data }) => {
    let query = supabase
      .from("properties")
      .select(PUBLIC_PROPERTY_FIELDS)
      .eq("state", data.state)
      .neq("status", "off_market")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (data.listingType) query = query.eq("listing_type", data.listingType);
    if (data.propertyType) query = query.eq("property_type", data.propertyType);
    if (typeof data.minBedrooms === "number") query = query.gte("bedrooms", data.minBedrooms);

    const { data: properties, error } = await query;
    if (error) throw new Error(error.message);

    const ids = (properties ?? []).map((p) => p.id);
    const { data: images } = ids.length
      ? await supabase
          .from("property_images")
          .select("property_id, storage_path, position")
          .in("property_id", ids)
          .order("position", { ascending: true })
      : { data: [] as { property_id: string; storage_path: string; position: number }[] };

    const coverByProperty = new Map<string, string>();
    for (const img of images ?? []) {
      if (!coverByProperty.has(img.property_id)) coverByProperty.set(img.property_id, img.storage_path);
    }

    return (properties ?? []).map((p) => ({
      ...p,
      coverImagePath: coverByProperty.get(p.id) ?? null,
    }));
  });

// =============== Listing detail ===============

const ListingIdSchema = z.object({ id: z.string().uuid() });

export const getListingDetail = createServerFn({ method: "GET" })
  .validator((i: unknown) => ListingIdSchema.parse(i))
  .handler(async ({ data }) => {
    const [{ data: property, error }, { data: images }] = await Promise.all([
      supabase
        .from("properties")
        .select(PUBLIC_PROPERTY_FIELDS)
        .eq("id", data.id)
        .neq("status", "off_market")
        .maybeSingle(),
      supabase
        .from("property_images")
        .select("id, storage_path, position, caption, is_render")
        .eq("property_id", data.id)
        .order("position", { ascending: true }),
    ]);
    if (error) throw new Error(error.message);
    if (!property) throw new Error("Listing not found or no longer available");

    // A few similar listings in the same state, to keep browsing going.
    const { data: similar } = await supabase
      .from("properties")
      .select("id, title, state, price, listing_type, property_type, bedrooms")
      .eq("state", property.state ?? "")
      .neq("id", data.id)
      .neq("status", "off_market")
      .limit(3);

    const similarIds = (similar ?? []).map((s) => s.id);
    const { data: similarImages } = similarIds.length
      ? await supabase
          .from("property_images")
          .select("property_id, storage_path")
          .in("property_id", similarIds)
          .eq("position", 0)
      : { data: [] as { property_id: string; storage_path: string }[] };
    const similarCover = new Map<string, string>();
    for (const img of similarImages ?? []) similarCover.set(img.property_id, img.storage_path);

    return {
      property,
      images: images ?? [],
      similar: (similar ?? []).map((s) => ({ ...s, coverImagePath: similarCover.get(s.id) ?? null })),
    };
  });
