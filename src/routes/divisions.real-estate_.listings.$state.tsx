import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bed, Bath, Ruler, MapPin, Star, Building2 } from "lucide-react";
import {
  getListingsByLocation,
  LISTING_TYPES,
  LISTING_PROPERTY_TYPES,
} from "@/lib/public-listings.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section } from "@/components/site/sections";
import { resolveImageUrl, cn } from "@/lib/utils";
import { sizedImage } from "@/lib/media";

export const Route = createFileRoute("/divisions/real-estate_/listings/$state")({
  head: ({ params }) => ({
    meta: [
      { title: `Properties in ${params.state} — UIG Real Estate` },
      {
        name: "description",
        content: `Houses, apartments, commercial space and land for sale or rent in ${params.state}.`,
      },
    ],
  }),
  component: LocationListingsPage,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

/** Listing cards render at ~800px wide; the stored originals are 1600px. */
function coverUrl(path: string | null) {
  if (!path) return null;
  return sizedImage(resolveImageUrl("property-images", path), 800);
}

function LocationListingsPage() {
  const { state } = Route.useParams();
  const [listingType, setListingType] = useState<(typeof LISTING_TYPES)[number] | "all">("all");
  const [propertyType, setPropertyType] = useState<(typeof LISTING_PROPERTY_TYPES)[number] | "all">(
    "all",
  );

  const { data: listings, isLoading, isError } = useQuery({
    queryKey: ["public-listings", state, listingType, propertyType],
    retry: 1,
    queryFn: () =>
      getListingsByLocation({
        data: {
          state,
          listingType: listingType === "all" ? undefined : listingType,
          propertyType: propertyType === "all" ? undefined : propertyType,
        },
      }),
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow="UIG Real Estate · Listings"
        title={
          <>
            Properties in <span className="text-gradient-gold">{state}.</span>
          </>
        }
        subtitle="Houses, apartments, commercial space and land — filter by what you're looking for."
      >
        <Link
          to="/divisions/real-estate/listings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All locations
        </Link>
      </PageHero>

      <Section>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">Type:</span>
          {(["all", ...LISTING_TYPES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setListingType(t)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs capitalize transition",
                listingType === t
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "all" ? "All" : t === "sale" ? "For sale" : "For rent"}
            </button>
          ))}
          <span className="text-xs uppercase tracking-wider text-muted-foreground ml-4 mr-1">
            Category:
          </span>
          {(["all", ...LISTING_PROPERTY_TYPES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPropertyType(t)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs capitalize transition",
                propertyType === t
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "all" ? "All" : t.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-surface/60 border border-border" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="mt-8 rounded-xl border border-border bg-surface/40 p-10 text-center text-muted-foreground">
            Listings are temporarily unavailable — please try again shortly.
          </div>
        )}

        {!isLoading && !isError && (!listings || listings.length === 0) && (
          <div className="mt-8 rounded-xl border border-border bg-surface/40 p-10 text-center text-muted-foreground">
            No listings match those filters right now.
          </div>
        )}

        {!isLoading && listings && listings.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((p) => {
              const cover = coverUrl(p.coverImagePath);
              const isLand = p.property_type === "land";
              return (
                <Link
                  key={p.id}
                  to="/divisions/real-estate/listings/$state/$id"
                  params={{ state, id: p.id }}
                  className="group overflow-hidden rounded-xl border border-border bg-surface/60 transition hover:border-gold/40 hover:bg-surface"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-background">
                    {cover ? (
                      <img
                        src={cover}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Building2 className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          p.listing_type === "rent"
                            ? "bg-background/90 text-foreground"
                            : "bg-gold text-gold-foreground",
                        )}
                      >
                        {p.listing_type === "rent" ? "For rent" : "For sale"}
                      </span>
                      {p.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-gold">
                          <Star className="h-2.5 w-2.5 fill-current" /> Featured
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-lg font-bold text-gradient-gold">{naira(Number(p.price))}</div>
                    <h3 className="mt-1 font-semibold leading-snug">{p.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {p.city || state}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      {isLand ? (
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3.5 w-3.5" /> {p.area_sqm} sqm
                        </span>
                      ) : (
                        <>
                          <span className="flex items-center gap-1">
                            <Bed className="h-3.5 w-3.5" /> {p.bedrooms}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5" /> {p.bathrooms}
                          </span>
                          <span className="flex items-center gap-1">
                            <Ruler className="h-3.5 w-3.5" /> {p.area_sqm} sqm
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Section>
    </SiteLayout>
  );
}
