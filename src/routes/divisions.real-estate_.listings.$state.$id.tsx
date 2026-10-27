import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bed,
  Bath,
  Ruler,
  MapPin,
  Building2,
  MessageCircle,
  FileCheck,
  Calendar,
} from "lucide-react";
import { getListingDetail } from "@/lib/public-listings.functions";

type ListingDetail = Awaited<ReturnType<typeof getListingDetail>>;
import { SiteLayout } from "@/components/site/SiteLayout";
import { FLAGS } from "@/lib/flags";
import { Section } from "@/components/site/sections";
import { MortgageCalculator } from "@/components/site/MortgageCalculator";
import { JsonLd } from "@/components/site/JsonLd";
import { SITE_URL, canonical, whatsappHref } from "@/lib/seo";
import { ListingGallery } from "@/components/site/ListingGallery";
import { resolveImageUrl, cn } from "@/lib/utils";
import { sizedImage } from "@/lib/media";

const naira = (n: number) => `₦${Number(n).toLocaleString("en-NG")}`;

function imgUrl(path: string) {
  return resolveImageUrl("property-images", path);
}

/** One-line summary of a property, for the meta description and share cards. */
function listingSummary(p: {
  property_type: string;
  listing_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  city: string | null;
  state: string | null;
  price: number | string;
  description: string | null;
}) {
  if (p.description) return p.description.slice(0, 180);
  const bits = [
    p.property_type === "land"
      ? "Land"
      : [p.bedrooms ? `${p.bedrooms}-bedroom` : null, p.property_type].filter(Boolean).join(" "),
    p.area_sqm ? `${p.area_sqm}m²` : null,
    [p.city, p.state].filter(Boolean).join(", ") || null,
    `${naira(Number(p.price))}${p.listing_type === "rent" ? " per year" : ""}`,
  ].filter(Boolean);
  return `${bits.join(" · ")}. Verified title, managed by UIG Real Estate.`;
}

export const Route = createFileRoute("/divisions/real-estate_/listings/$state/$id")({
  // Same VITE_FLAG_REAL_ESTATE_LISTINGS gate as the listings index. Repeated
  // rather than inherited: the index is a leaf route, not this route's parent.
  beforeLoad: () => {
    if (!FLAGS.realEstateListings) throw redirect({ to: "/divisions/real-estate" });
  },

  // Fetched in the loader rather than with useQuery so `head` can see the
  // property. Every listing in Lagos used to share the title "Property in
  // Lagos — UIG Real Estate", with no description and no og: tags at all —
  // these are the highest-intent URLs on the site and they were indexing and
  // sharing as identical pages.
  loader: ({ params }): Promise<ListingDetail> => getListingDetail({ data: { id: params.id } }),

  head: ({ loaderData, params }) => {
    const property = loaderData?.property;
    if (!property) {
      return {
        meta: [
          { title: "Listing unavailable — UIG Real Estate" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${property.title} — ${[property.city, property.state].filter(Boolean).join(", ")} | UIG Real Estate`;
    const description = listingSummary(property);
    const hero = loaderData?.images?.[0];
    const image = hero ? imgUrl(hero.storage_path) : undefined;
    return {
      links: [canonical(`/divisions/real-estate/listings/${params.state}/${params.id}`)],
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        ...(image ? [{ property: "og:image", content: image }] : []),
        ...(image ? [{ name: "twitter:card", content: "summary_large_image" }] : []),
      ],
    };
  },

  component: ListingDetailPage,
});

function ListingDetailPage() {
  const { state } = Route.useParams();
  // Annotated rather than inferred: `useLoaderData()` resolves through the
  // generated route tree, which imports this file, so the inference is
  // circular and silently widens to `any` — which only shows up as an
  // implicit-any error after the route tree is regenerated.
  const data = Route.useLoaderData() as ListingDetail;

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

  const waMessage = `Hi UIG — I'm interested in "${property.title}" (${property.city || state}, ${naira(Number(property.price))}${property.listing_type === "rent" ? "/yr" : ""}). Could you share more details?`;
  // `null` when no WhatsApp line is configured — better to show only the
  // contact-form route than a button that dials a number nobody owns.
  const waHref = whatsappHref(waMessage);

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
            <ListingGallery
              images={images}
              title={property.title}
              featured={property.featured}
              resolve={imgUrl}
            />
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

            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-lg transition hover:brightness-105"
              >
                <MessageCircle className="h-5 w-5" fill="currentColor" strokeWidth={0} />
                Enquire on WhatsApp
              </a>
            )}
            <Link
              to="/contact"
              search={{ interest: "real-estate", ref: property.title }}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-6 py-3.5 font-semibold text-foreground transition hover:border-gold/40",
                waHref ? "mt-3" : "mt-8",
              )}
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
