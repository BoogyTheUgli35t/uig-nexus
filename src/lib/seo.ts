// Shared SEO constants — keep in sync with sitemap.xml.ts's BASE_URL and
// __root.tsx's og:image so structured data, sitemap and social meta all
// point at the same canonical values.
export const SITE_URL = "https://unifiedinnovationsgroup.online";
export const SITE_NAME = "Unified Innovations Group";
export const SITE_LOGO =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e6b25550-beb6-4918-8631-81e4e441b36b";

export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "UIG",
  url: SITE_URL,
  logo: SITE_LOGO,
  description:
    "UIG is Nigeria's leading multi-sector innovation conglomerate — building the infrastructure for Africa's future through technology, agriculture, intelligence and beyond.",
  email: "hello@unifiedinnovationsgroup.online",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Victoria Island, Lagos",
    addressCountry: "NG",
  },
};
