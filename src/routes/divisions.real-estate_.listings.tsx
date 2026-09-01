import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Home, ArrowRight, Building2 } from "lucide-react";
import { getListingLocations } from "@/lib/public-listings.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, Eyebrow } from "@/components/site/sections";
import { NigeriaListingsMap } from "@/components/site/NigeriaListingsMap";
import { resolveImageUrl } from "@/lib/utils";
import { sizedImage } from "@/lib/media";
import { FLAGS } from "@/lib/flags";

export const Route = createFileRoute("/divisions/real-estate_/listings")({
  // Gated by VITE_FLAG_REAL_ESTATE_LISTINGS so the public browse experience can
  // be dark-launched (deployed but not exposed) ahead of the division going
  // live — the Phase 6 release-behind-a-flag step.
  beforeLoad: () => {
    if (!FLAGS.realEstateListings) throw redirect({ to: "/divisions/real-estate" });
  },
  head: () => ({
    meta: [
      { title: "Browse Listings by Location — UIG Real Estate" },
      {
        name: "description",
        content:
          "Explore houses, apartments and land for sale or rent across Lagos, Abuja, Port Harcourt, Enugu and Kano.",
      },
    ],
  }),
  component: ListingsHubPage,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

/** Location cards render at ~400px wide — serving the stored 1600px original
 * wasted several MB per page load. */
function coverUrl(path: string | null) {
  if (!path) return null;
  return sizedImage(resolveImageUrl("property-images", path), 800);
}

function ListingsHubPage() {
  const {
    data: locations,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-listing-locations"],
    queryFn: () => getListingLocations(),
    retry: 1,
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow="UIG Real Estate · Listings"
        title={
          <>
            Choose a location, <span className="text-gradient-gold">then browse.</span>
          </>
        }
        subtitle="Every listing on UIG Real Estate is grouped by state, so you only see houses, apartments and land in the market you actually care about."
      />

      <Section>
        <Eyebrow>Locations</Eyebrow>
        <h2 className="mt-5 text-3xl sm:text-4xl font-bold max-w-2xl">
          Live listings across Nigeria.
        </h2>

        {isLoading && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-xl bg-surface/60 border border-border"
              />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="mt-10 rounded-xl border border-border bg-surface/40 p-10 text-center text-muted-foreground">
            Listings are temporarily unavailable — please try again shortly.
          </div>
        )}

        {!isLoading && !isError && (!locations || locations.length === 0) && (
          <div className="mt-10 rounded-xl border border-border bg-surface/40 p-10 text-center text-muted-foreground">
            No listings are live yet — check back soon.
          </div>
        )}

        {!isLoading && locations && locations.length > 0 && (
          <div className="mt-10">
            <NigeriaListingsMap locations={locations} />
          </div>
        )}

        {!isLoading && locations && locations.length > 0 && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc) => {
              const cover = coverUrl(loc.coverImage);
              return (
                <Link
                  key={loc.state}
                  to="/divisions/real-estate/listings/$state"
                  params={{ state: loc.state }}
                  className="group relative overflow-hidden rounded-xl border border-border bg-surface/60 transition hover:border-gold/40 hover:bg-surface"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-background">
                    {cover ? (
                      <img
                        src={cover}
                        alt={loc.state}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Building2 className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
                    <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white">
                      <MapPin className="h-4 w-4 text-gold" />
                      <span className="font-display text-lg font-semibold">{loc.state}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {loc.totalListings} listing{loc.totalListings === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-gold font-medium">
                        View{" "}
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                      {loc.forSale > 0 && (
                        <span className="rounded-full bg-gold/10 text-gold px-2 py-0.5">
                          {loc.forSale} for sale
                        </span>
                      )}
                      {loc.forRent > 0 && (
                        <span className="rounded-full bg-surface-elevated border border-border px-2 py-0.5 text-muted-foreground">
                          {loc.forRent} for rent
                        </span>
                      )}
                      {loc.hasLand && (
                        <span className="rounded-full bg-surface-elevated border border-border px-2 py-0.5 text-muted-foreground">
                          Land available
                        </span>
                      )}
                    </div>
                    {loc.minPrice > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Home className="h-3.5 w-3.5" />
                        From {naira(loc.minPrice)}
                      </div>
                    )}
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
