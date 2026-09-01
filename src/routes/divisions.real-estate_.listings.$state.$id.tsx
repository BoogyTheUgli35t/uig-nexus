import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bed,
  Bath,
  Ruler,
  MapPin,
  Star,
  Building2,
  MessageCircle,
  FileCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getListingDetail } from "@/lib/public-listings.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/sections";
import { MortgageCalculator } from "@/components/site/MortgageCalculator";
import { JsonLd } from "@/components/site/JsonLd";
import { SITE_URL } from "@/lib/seo";
import { resolveImageUrl, cn } from "@/lib/utils";
import { sizedImage } from "@/lib/media";

export const Route = createFileRoute("/divisions/real-estate_/listings/$state/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Property in ${params.state} — UIG Real Estate` }],
  }),
  component: ListingDetailPage,
});

const naira = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`;

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "2348000000000";

function imgUrl(path: string) {
  return resolveImageUrl("property-images", path);
}

function ListingDetailPage() {
  const { state, id } = Route.useParams();
  const [activeImage, setActiveImage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["public-listing-detail", id],
    queryFn: () => getListingDetail({ data: { id } }),
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <Section>
          <div className="h-96 animate-pulse rounded-xl bg-surface/60 border border-border" />
        </Section>
      </SiteLayout>
    );
  }

  if (!data) {
    return (
      <SiteLayout>
        <Section>
          <div className="rounded-xl border border-border bg-surface/40 p-10 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">This listing is no longer available.</p>
            <Link
              to="/divisions/real-estate/listings"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back to listings
            </Link>
          </div>
        </Section>
      </SiteLayout>
    );
  }

  const { property, images, similar } = data;
  const isLand = property.property_type === "land";
  const gallery =
    images.length > 0
      ? images
      : [{ id: "placeholder", storage_path: "", position: 0, caption: null, is_render: false }];
  const active = gallery[activeImage] ?? gallery[0];
  const hasRenders = images.some((img) => img.is_render);

  const waMessage = `Hi UIG — I'm interested in "${property.title}" (${property.city || state}, ${naira(Number(property.price))}${property.listing_type === "rent" ? "/yr" : ""}). Could you share more details?`;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description || undefined,
    url: `${SITE_URL}/divisions/real-estate/listings/${state}/${property.id}`,
    image: images.length > 0 ? images.map((img) => imgUrl(img.storage_path)) : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address || undefined,
      addressLocality: property.city || property.state,
      addressRegion: property.state,
      addressCountry: "NG",
    },
    ...(isLand
      ? {}
      : {
          numberOfBedrooms: property.bedrooms || undefined,
          numberOfBathroomsTotal: property.bathrooms || undefined,
        }),
    floorSize: property.area_sqm
      ? { "@type": "QuantitativeValue", value: property.area_sqm, unitCode: "MTK" }
      : undefined,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "NGN",
      availability:
        property.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      businessFunction:
        property.listing_type === "rent"
          ? "https://schema.org/LeaseOut"
          : "https://schema.org/Sell",
    },
  };

  return (
    <SiteLayout>
      <JsonLd data={listingJsonLd} />
      <Section className="!py-10 sm:!py-14">
        <Link
          to="/divisions/real-estate/listings/$state"
          params={{ state }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Properties in {state}
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-5">
          {/* Gallery */}
          <div className="lg:col-span-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-background">
              {active.storage_path ? (
                <img
                  src={imgUrl(active.storage_path)}
                  alt={active.caption ?? property.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Building2 className="h-10 w-10" />
                </div>
              )}
              {hasRenders && (
                <span className="absolute top-3 left-3 rounded-full border border-border bg-background/80 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur">
                  Illustrative imagery — actual photos to follow
                </span>
              )}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((i) => (i - 1 + gallery.length) % gallery.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 hover:bg-background"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveImage((i) => (i + 1) % gallery.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 hover:bg-background"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              {property.featured && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-gold">
                  <Star className="h-3 w-3 fill-current" /> Featured
                </span>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {gallery.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "aspect-square overflow-hidden rounded-lg border-2 transition",
                      i === activeImage
                        ? "border-gold"
                        : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    {img.storage_path && (
                      <img
                        src={sizedImage(imgUrl(img.storage_path), 200) ?? undefined}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
            {active.caption && (
              <p className="mt-2 text-xs text-muted-foreground">{active.caption}</p>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-2">
            <span
              className={cn(
                "inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                property.listing_type === "rent"
                  ? "bg-surface-elevated border border-border"
                  : "bg-gold text-gold-foreground",
              )}
            >
              {property.listing_type === "rent" ? "For rent" : "For sale"}
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{property.title}</h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {property.address || property.city} · {property.state}
            </p>
            <div className="mt-4 text-3xl font-bold text-gradient-gold">
              {naira(Number(property.price))}
              {property.listing_type === "rent" && (
                <span className="text-base text-muted-foreground"> /year</span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 rounded-xl border border-border bg-surface/60 p-4 text-sm">
              {isLand ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <Ruler className="h-4 w-4 text-gold" /> {property.area_sqm} sqm
                  </div>
                  {property.land_title_type && (
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-gold" /> {property.land_title_type}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <Bed className="h-4 w-4 text-gold" /> {property.bedrooms} beds
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bath className="h-4 w-4 text-gold" /> {property.bathrooms} baths
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Ruler className="h-4 w-4 text-gold" /> {property.area_sqm} sqm
                  </div>
                  {property.year_built && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gold" /> Built {property.year_built}
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="mt-6 text-muted-foreground leading-relaxed">{property.description}</p>

            {Array.isArray(property.amenities) && property.amenities.length > 0 && (
              <div className="mt-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Amenities
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(property.amenities as string[]).map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-surface-elevated border border-border px-2.5 py-1 text-xs capitalize text-muted-foreground"
                    >
                      {a.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {property.listing_type === "sale" && Number(property.price) > 0 && (
              <div className="mt-8">
                <MortgageCalculator price={Number(property.price)} />
              </div>
            )}

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-lg transition hover:brightness-105"
            >
              <MessageCircle className="h-5 w-5" fill="currentColor" strokeWidth={0} />
              Enquire on WhatsApp
            </a>
            <Link
              to="/contact"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-6 py-3.5 font-semibold text-foreground transition hover:border-gold/40"
            >
              Speak to an Investment Advisor
            </Link>
          </div>
        </div>
      </Section>

      {similar.length > 0 && (
        <Section className="!pt-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            More in {state}
          </div>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            {similar.map((s) => {
              const cover = s.coverImagePath ? sizedImage(imgUrl(s.coverImagePath), 600) : null;
              return (
                <Link
                  key={s.id}
                  to="/divisions/real-estate/listings/$state/$id"
                  params={{ state, id: s.id }}
                  className="group overflow-hidden rounded-xl border border-border bg-surface/60 transition hover:border-gold/40"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-background">
                    {cover ? (
                      <img
                        src={cover}
                        alt={s.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-semibold text-sm truncate">{s.title}</div>
                    <div className="text-xs text-gold font-medium mt-0.5">
                      {naira(Number(s.price))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}
    </SiteLayout>
  );
}
