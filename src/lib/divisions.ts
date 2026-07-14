import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  Sprout,
  Building2,
  Truck,
  BrainCircuit,
  FlaskConical,
} from "lucide-react";

// Real, licensed photography (Unsplash — free for commercial use, no attribution
// required) shot by Nigerian photographers, chosen to match each division's actual
// world rather than generic stock imagery. See divisions.gallery below for the
// supporting images used on the public marketing pages.
const heroTechnology = "https://images.unsplash.com/photo-1739302750702-e26a61113758?auto=format&fit=crop&w=1600&q=80";
const heroAgritech = "https://images.unsplash.com/photo-1647463047632-f06655631086?auto=format&fit=crop&w=1600&q=80";
const heroRealEstate = "https://images.unsplash.com/photo-1580239808575-21a119018fb4?auto=format&fit=crop&w=1600&q=80";
const heroLogistics = "https://images.unsplash.com/photo-1611746351408-c0a1346be8e8?auto=format&fit=crop&w=1600&q=80";
const heroIntelligence = "https://images.unsplash.com/photo-1739289671660-b1155422c7b4?auto=format&fit=crop&w=1600&q=80";
const heroInnovationLab = "https://images.unsplash.com/photo-1739303987830-ca19742b19bc?auto=format&fit=crop&w=1600&q=80";

export type DivisionSlug =
  | "technology"
  | "agritech"
  | "real-estate"
  | "logistics"
  | "intelligence"
  | "innovation-lab";

export type AccentKey =
  | "gold"
  | "tech"
  | "agritech"
  | "realestate"
  | "logistics"
  | "intelligence"
  | "innovation";

export type DivisionModule = {
  label: string;
  description: string;
  /** Marketing/feature description for the overview grid. */
  status: "live" | "soon";
};

export type Division = {
  slug: DivisionSlug;
  name: string;
  short: string;
  tagline: string;
  description: string;
  accent: AccentKey;
  /** Tailwind helper class (defined in styles.css) that sets the --acc variable. */
  accentClass: `acc-${AccentKey}`;
  icon: LucideIcon;
  hero: string;
  /** Supporting photography for the public marketing page's story/gallery section. */
  gallery: string[];
  modules: DivisionModule[];
};

export const DIVISIONS: Division[] = [
  {
    slug: "technology",
    name: "UIG Technology",
    short: "Technology",
    tagline: "AI-powered software, portals & automation",
    description:
      "We build the digital infrastructure Africa deserves — custom software, SaaS platforms, automation engines and the integrations that connect them.",
    accent: "tech",
    accentClass: "acc-tech",
    icon: Cpu,
    hero: heroTechnology,
    gallery: [
      "https://images.unsplash.com/photo-1528901166007-3784c7dd3653?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1739300293396-9ad79111c8e4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1635766854982-fc151c6e9278?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1532522953890-ccc87dfeb0b7?auto=format&fit=crop&w=1200&q=80",
    ],
    modules: [
      { label: "Project board", description: "Kanban + timeline across every client engagement.", status: "live" },
      { label: "Client portal", description: "Live project status, invoices and documents.", status: "live" },
      { label: "Automation engine", description: "Trigger-based workflow rules and run history.", status: "soon" },
      { label: "Integration hub", description: "Connect and monitor third-party APIs and services.", status: "live" },
    ],
  },
  {
    slug: "agritech",
    name: "UIG AgriTech",
    short: "AgriTech",
    tagline: "Smart agriculture, IoT & yield intelligence",
    description:
      "Sensors, drones and AI working the land — onboarding farmers and cooperatives, monitoring fields and forecasting yields across Nigeria.",
    accent: "agritech",
    accentClass: "acc-agritech",
    icon: Sprout,
    hero: heroAgritech,
    gallery: [
      "https://images.unsplash.com/photo-1697466587072-048298ed0ab8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560118386-f35cf6a0791d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1572476827103-a83202f1059d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1562009058-f159df1d2608?auto=format&fit=crop&w=1200&q=80",
    ],
    modules: [
      { label: "Farmer onboarding", description: "Register farmers and cooperatives in minutes.", status: "live" },
      { label: "Field dashboard", description: "Map view with live sensor and drone data.", status: "live" },
      { label: "Yield prediction", description: "AI-forecasted yields by field and season.", status: "live" },
      { label: "Cooperative management", description: "Group farmers, share inputs, track output.", status: "soon" },
    ],
  },
  {
    slug: "real-estate",
    name: "UIG Real Estate",
    short: "Real Estate",
    tagline: "Property systems, CRM & investor dashboards",
    description:
      "Smart buildings and smarter operations — property management, tenant portals, investor ROI dashboards and a full sales CRM.",
    accent: "realestate",
    accentClass: "acc-realestate",
    icon: Building2,
    hero: heroRealEstate,
    gallery: [
      "https://images.unsplash.com/photo-1745725427804-4d94df0c5eb7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1618828665347-d870c38c95c7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1701383835696-faf8569ed2d7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1531300365552-da5abe58a725?auto=format&fit=crop&w=1200&q=80",
    ],
    modules: [
      { label: "Property listings", description: "Manage the full portfolio with rich detail.", status: "live" },
      { label: "Tenant portal", description: "Payments, documents and maintenance requests.", status: "live" },
      { label: "Investor dashboard", description: "Portfolio value, ROI and distributions.", status: "live" },
      { label: "CRM pipeline", description: "Track leads from enquiry to close.", status: "live" },
    ],
  },
  {
    slug: "logistics",
    name: "UIG Logistics",
    short: "Logistics",
    tagline: "Fleet intelligence, shipments & routing",
    description:
      "Moving goods across Africa with precision — shipment tracking, fleet and driver management, and AI-assisted route optimization.",
    accent: "logistics",
    accentClass: "acc-logistics",
    icon: Truck,
    hero: heroLogistics,
    gallery: [
      "https://images.unsplash.com/photo-1613463918637-3574cd5d34c0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1738507869660-b44ea20ab037?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1712700004723-4adc42a3532f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1630509866865-feb29d1b8cbb?auto=format&fit=crop&w=1200&q=80",
    ],
    modules: [
      { label: "Shipment tracking", description: "Live status board and map view.", status: "live" },
      { label: "Driver tasks", description: "Mobile-friendly assignments and proof of delivery.", status: "live" },
      { label: "Fleet management", description: "Vehicles, capacity and maintenance records.", status: "live" },
      { label: "Route optimization", description: "Smart routing across multiple waypoints.", status: "live" },
    ],
  },
  {
    slug: "intelligence",
    name: "UIG Intelligence",
    short: "Intelligence",
    tagline: "AI models, predictive analytics & automation",
    description:
      "The brain of the group — predictive analytics, an AI assistant, and the UIG Model Trainer where our proprietary AI is built and deployed across every division.",
    accent: "intelligence",
    accentClass: "acc-intelligence",
    icon: BrainCircuit,
    hero: heroIntelligence,
    gallery: [
      "https://images.unsplash.com/photo-1739287088635-444554e7ac0e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1739298061758-f950267d6d75?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1739289696461-9459f95797ba?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1739303987902-eccc301b09fc?auto=format&fit=crop&w=1200&q=80",
    ],
    modules: [
      { label: "AI assistant", description: "Chat with UIG's models for insight on demand.", status: "live" },
      { label: "Predictive analytics", description: "Forecasts and trends across the group.", status: "live" },
      { label: "Model Trainer", description: "Upload datasets, train and deploy models.", status: "live" },
      { label: "Datasets", description: "Secure dataset library for every division.", status: "live" },
    ],
  },
  {
    slug: "innovation-lab",
    name: "UIG Innovation Lab",
    short: "Innovation Lab",
    tagline: "Venture studio, prototyping & incubation",
    description:
      "Where the next ventures are born — idea submission, prototype tracking, partner collaboration and an experiment log, wired into Intelligence for AI experiments.",
    accent: "innovation",
    accentClass: "acc-innovation",
    icon: FlaskConical,
    hero: heroInnovationLab,
    gallery: [
      "https://images.unsplash.com/photo-1739300293388-c28c70ae80e4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1635766854898-ad3766e5f5e2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1739302750702-e26a61113758?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1739289671660-b1155422c7b4?auto=format&fit=crop&w=1200&q=80",
    ],
    modules: [
      { label: "Idea submission", description: "Capture ideas from every division.", status: "live" },
      { label: "Prototype tracker", description: "Status board from concept to demo.", status: "live" },
      { label: "Partner collaboration", description: "Co-build with partners and investors.", status: "live" },
      { label: "Experiment log", description: "Run AI experiments via the Model Trainer.", status: "live" },
    ],
  },
];

export const DIVISION_MAP: Record<DivisionSlug, Division> = DIVISIONS.reduce(
  (acc, d) => {
    acc[d.slug] = d;
    return acc;
  },
  {} as Record<DivisionSlug, Division>,
);

export function getDivision(slug: string): Division | undefined {
  return DIVISION_MAP[slug as DivisionSlug];
}

export const DIVISION_SLUGS = DIVISIONS.map((d) => d.slug);
