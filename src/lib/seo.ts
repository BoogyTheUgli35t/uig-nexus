// Shared SEO + contact constants — keep in sync with sitemap.xml.ts's BASE_URL
// and __root.tsx's og:image so structured data, sitemap and social meta all
// point at the same canonical values.
export const SITE_URL = "https://unifiedinnovationsgroup.online";
export const SITE_NAME = "Unified Innovations Group";
export const SITE_LOGO =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e6b25550-beb6-4918-8631-81e4e441b36b";

/**
 * The one contact address for the whole site.
 *
 * The contact page used to print `hello@uig.africa` while the footer and the
 * structured data both said `hello@unifiedinnovationsgroup.online` — so one of
 * the two addresses on the site was silently dropping mail, and the wrong one
 * was on the page whose entire job is getting people to write in. Everything
 * reads this constant now; change it here and it changes everywhere.
 *
 * `hello@unifiedinnovationsgroup.online` is configured as an alias on the same
 * domain, so mail to either address arrives — this is just the one the site
 * displays.
 */
export const CONTACT_EMAIL = "UIG@unifiedinnovationsgroup.online";

/** Where UIG actually is. Used by the footer, the About page and the JSON-LD. */
export const HQ = {
  locality: "Victoria Island, Lagos",
  region: "Lagos",
  country: "NG",
  countryName: "Nigeria",
} as const;

/**
 * Company registration.
 *
 * Deliberately empty until the real CAC number is to hand: a fabricated
 * registration number on a site pitching government and enterprise accounts
 * is a false official record, not a placeholder. Set it and it appears on the
 * About page and in the organisation's structured data; leave it and both
 * simply omit the line.
 */
export const COMPANY_REGISTRATION = {
  /** CAC RC number, e.g. "RC 1234567". */
  rcNumber: "",
  /** Year UIG was incorporated, e.g. 2024. Shown in the founding story. */
  foundedYear: null as number | null,
} as const;

/**
 * The UIG WhatsApp Business line, E.164 digits only.
 *
 * Deliberately empty when unset rather than a plausible-looking placeholder:
 * a fake number renders a floating chat button on every public page and the
 * primary enquiry button on every property listing, both of which dial a line
 * that doesn't exist. Callers must treat an empty value as "don't render".
 */
export const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

/** Build a wa.me link, or `null` when no number is configured. */
export function whatsappHref(message: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Public profiles, for the footer and schema.org `sameAs`.
 *
 * `href: null` means the account doesn't exist yet: the footer renders the
 * label muted and non-clickable, and it's left out of `sameAs`. That's the
 * honest state — the footer used to ship three `href="#"` links that jumped to
 * the top of whatever page you were on, which reads as a broken site rather
 * than a young one. Fill in a URL and it becomes a real link, with nothing
 * else to change.
 */
export const SOCIAL_LINKS: { label: string; href: string | null }[] = [
  { label: "LinkedIn", href: null },
  { label: "Twitter", href: null },
  { label: "Instagram", href: null },
];

export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "UIG",
  url: SITE_URL,
  logo: SITE_LOGO,
  description:
    "UIG is Nigeria's leading multi-sector innovation conglomerate — building the infrastructure for Africa's future through technology, agriculture, intelligence and beyond.",
  email: CONTACT_EMAIL,
  address: {
    "@type": "PostalAddress",
    addressLocality: HQ.locality,
    addressRegion: HQ.region,
    addressCountry: HQ.country,
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "sales",
      email: CONTACT_EMAIL,
      areaServed: "NG",
      availableLanguage: ["en"],
    },
  ],
  ...(COMPANY_REGISTRATION.foundedYear
    ? { foundingDate: String(COMPANY_REGISTRATION.foundedYear) }
    : {}),
  ...(COMPANY_REGISTRATION.rcNumber
    ? {
        identifier: { "@type": "PropertyValue", name: "CAC", value: COMPANY_REGISTRATION.rcNumber },
      }
    : {}),
  ...(liveSocialLinks().length > 0 ? { sameAs: liveSocialLinks() } : {}),
};

/** Only the profiles that actually exist, for `sameAs`. */
function liveSocialLinks() {
  return SOCIAL_LINKS.map((s) => s.href).filter((h): h is string => Boolean(h));
}

/**
 * The `<link rel="canonical">` for a page.
 *
 * There was no canonical anywhere on the site, which with flag-gated routes
 * that redirect and parametrised listing URLs invites duplicate-content
 * splits — the same property reachable by two paths counts as two pages.
 */
export function canonical(pathname: string) {
  const path = pathname === "/" ? "" : pathname.replace(/\/+$/, "");
  return { rel: "canonical", href: `${SITE_URL}${path}` };
}
