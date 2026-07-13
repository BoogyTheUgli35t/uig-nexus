import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Cpu,
  Brain,
  Building2,
  Truck,
  Sprout,
  Beaker,
  ArrowRight,
  Code2,
  Cloud,
  Shield,
  ShoppingCart,
  Workflow,
  Plug,
  MessageSquare,
  LineChart,
  Zap,
  Languages,
  Home,
  FileCheck,
  ClipboardList,
  TrendingUp,
  Map,
  Warehouse,
  Snowflake,
  PackageCheck,
  Plane,
  Droplets,
  Store,
  CloudSun,
  Rocket,
  GraduationCap,
  Lightbulb,
  Coins,
  Handshake,
  Building,
  Globe2,
  CheckCircle2,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, Eyebrow, CTABand, FeatureCard } from "@/components/site/sections";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "UIG Services — Every Capability of the Group, in One Place" },
      {
        name: "description",
        content:
          "The full UIG service catalogue across Technology, Intelligence, Real Estate, Logistics, AgriTech and the Innovation Lab — plus partner, government and enterprise programmes.",
      },
      { property: "og:title", content: "UIG Services — Cross-Division Capabilities" },
      {
        property: "og:description",
        content:
          "Every service the UIG group delivers — built for serious operators across Africa.",
      },
    ],
  }),
  component: ServicesPage,
});

import { ComponentType } from "react";

type ServiceItem = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};
type Division = {
  to: string;
  eyebrow: string;
  headline: string;
  pitch: string;
  icon: ComponentType<{ className?: string }>;
  services: ServiceItem[];
  cta: string;
};

const divisions: Division[] = [
  {
    to: "/divisions/technology",
    eyebrow: "UIG Technology",
    headline: "Software, cloud and digital transformation.",
    pitch:
      "We build the platforms, products and pipelines that run modern Nigerian and African businesses.",
    icon: Cpu,
    services: [
      {
        title: "Custom Software Development",
        description:
          "Web, iOS and Android apps, internal tools and enterprise platforms — stack-agnostic, scalable.",
        icon: Code2,
      },
      {
        title: "SaaS Product Design & Build",
        description:
          "Wireframe to revenue. Full product lifecycle for clients entering new digital markets.",
        icon: Rocket,
      },
      {
        title: "Digital Transformation Consulting",
        description: "Audit legacy stacks, design transformation roadmaps and execute end-to-end.",
        icon: Workflow,
      },
      {
        title: "Cloud Infrastructure & DevOps",
        description:
          "AWS, GCP and Azure setup, CI/CD, containers and monitoring built for cost and uptime.",
        icon: Cloud,
      },
      {
        title: "API & Systems Integration",
        description: "Connect ERPs, CRMs, payment rails and third-party tools. End the data silos.",
        icon: Plug,
      },
      {
        title: "Cybersecurity Advisory",
        description:
          "Vulnerability assessments, security architecture and Nigerian compliance readiness.",
        icon: Shield,
      },
      {
        title: "E-Commerce Development",
        description:
          "Storefronts wired to Paystack, Flutterwave, Stripe, inventory and delivery APIs.",
        icon: ShoppingCart,
      },
      {
        title: "Enterprise IT Consulting",
        description: "Practical, affordable strategy for SMEs and large operators alike.",
        icon: Cpu,
      },
    ],
    cta: "Talk to UIG Technology",
  },
  {
    to: "/divisions/intelligence",
    eyebrow: "UIG Intelligence",
    headline: "AI built for African languages, contexts and economics.",
    pitch:
      "Native-language LLMs, predictive analytics and automation engineered for Nigerian enterprise and public sector workloads.",
    icon: Brain,
    services: [
      {
        title: "Native African Language LLMs",
        description:
          "Yoruba, Igbo, Hausa, Pidgin and more — local idiom, local context, local accuracy.",
        icon: Languages,
      },
      {
        title: "AI Chatbots for Nigerian Businesses",
        description:
          "Sales, support and service bots on WhatsApp, web and mobile, trained on your products.",
        icon: MessageSquare,
      },
      {
        title: "Machine Learning Solutions",
        description:
          "Custom ML for fraud, demand forecasting, crop disease prediction and clinical triage.",
        icon: Brain,
      },
      {
        title: "Predictive Analytics Dashboards",
        description:
          "Sales, churn, inventory and financial anomaly detection from your operational data.",
        icon: LineChart,
      },
      {
        title: "Business Process Automation",
        description:
          "Document processing, invoice matching, report generation and email triage at scale.",
        icon: Zap,
      },
      {
        title: "AI Integration Consulting",
        description:
          "Vendor selection through to custom-model deployment — full integration journey.",
        icon: Workflow,
      },
    ],
    cta: "Request an AI Audit",
  },
  {
    to: "/divisions/real-estate",
    eyebrow: "UIG Real Estate",
    headline: "Property intelligence, smart developments and investor advisory.",
    pitch:
      "We combine property expertise with technology so investors, developers and homebuyers operate with an edge.",
    icon: Building2,
    services: [
      {
        title: "Property Sourcing & Acquisition",
        description:
          "Title-verified, data-driven opportunities across Lagos, Abuja, PH and emerging cities.",
        icon: Building2,
      },
      {
        title: "Smart Residential Development",
        description:
          "Homes built with security automation, energy management and connectivity from day one.",
        icon: Home,
      },
      {
        title: "Commercial Development",
        description: "Office, retail and mixed-use projects for Nigeria's growing business class.",
        icon: Building,
      },
      {
        title: "Investment Advisory",
        description:
          "Diaspora and HNI structuring, due diligence and quarterly performance reporting.",
        icon: TrendingUp,
      },
      {
        title: "Title & Documentation Verification",
        description: "C of O, excision, governor's consent — protecting buyers from costly fraud.",
        icon: FileCheck,
      },
      {
        title: "Property Management Tech",
        description:
          "Tenant management, rent automation, maintenance tracking, occupancy optimisation.",
        icon: ClipboardList,
      },
    ],
    cta: "Speak to an Investment Advisor",
  },
  {
    to: "/divisions/logistics",
    eyebrow: "UIG Logistics",
    headline: "Last-mile, fleet, warehousing and supply chain intelligence.",
    pitch:
      "We move goods across Nigeria with technology, reliability and live visibility — and rent the same stack to your platform.",
    icon: Truck,
    services: [
      {
        title: "Last-Mile Delivery",
        description:
          "Trackable delivery across Lagos, Abuja, PH, Kano and Ibadan with live updates.",
        icon: Truck,
      },
      {
        title: "Fleet Tracking & Management",
        description:
          "GPS, driver behaviour, fuel analytics and predictive maintenance in one platform.",
        icon: Map,
      },
      {
        title: "E-Commerce Fulfillment",
        description:
          "Receive, store, pick-pack-ship and returns — so online businesses focus on selling.",
        icon: PackageCheck,
      },
      {
        title: "Warehouse Management",
        description: "Barcode/RFID inventory, automated stock alerts and e-commerce integrations.",
        icon: Warehouse,
      },
      {
        title: "Cold-Chain Logistics",
        description:
          "IoT temperature-monitored storage and transport for pharma, food and medical supplies.",
        icon: Snowflake,
      },
      {
        title: "Logistics API for Platforms",
        description:
          "Booking, tracking and rate calculation API for any e-commerce or marketplace platform.",
        icon: Plug,
      },
    ],
    cta: "Integrate Our Delivery API",
  },
  {
    to: "/divisions/agritech",
    eyebrow: "UIG AgriTech",
    headline: "AI, drones and farm-to-market intelligence.",
    pitch:
      "Cut post-harvest loss, raise yields and connect smallholders to real buyers — operationally, not theoretically.",
    icon: Sprout,
    services: [
      {
        title: "AI-Powered Crop Monitoring",
        description:
          "Satellite + sensor data flagging disease, drought and nutrient stress before losses hit.",
        icon: Sprout,
      },
      {
        title: "Drone Surveillance & Spraying",
        description:
          "Aerial monitoring, precision spraying, field mapping and yield estimation at any scale.",
        icon: Plane,
      },
      {
        title: "Smart Irrigation Systems",
        description: "Soil moisture sensors and weather APIs schedule irrigation automatically.",
        icon: Droplets,
      },
      {
        title: "Farm-to-Market Platform",
        description:
          "Marketplace connecting farmers to processors, supermarkets, restaurants and exporters.",
        icon: Store,
      },
      {
        title: "Weather Intelligence (SMS)",
        description: "Hyperlocal Nigerian-climate predictions in Yoruba, Igbo and Hausa via SMS.",
        icon: CloudSun,
      },
      {
        title: "Cold-Chain for Perishables",
        description:
          "Temperature-controlled storage and transport in partnership with UIG Logistics.",
        icon: Snowflake,
      },
    ],
    cta: "Request a Farm Assessment",
  },
  {
    to: "/divisions/innovation-lab",
    eyebrow: "UIG Innovation Lab",
    headline: "Incubation, acceleration, R&D and venture capital.",
    pitch: "We back, build and ship the companies that will define Nigeria's next decade.",
    icon: Beaker,
    services: [
      {
        title: "Startup Incubation Programme",
        description:
          "6-month cohort with workspace, mentorship, infra access, intros and seed pathway.",
        icon: Beaker,
      },
      {
        title: "Startup Acceleration",
        description:
          "Growth capital, ops support and customer intros across the UIG Group network.",
        icon: Rocket,
      },
      {
        title: "UIG Innovation Hub (Lagos)",
        description: "Premium co-working, podcast studio, prototyping lab and event space.",
        icon: Building2,
      },
      {
        title: "Corporate Innovation Consulting",
        description: "Internal innovation programmes, hackathons and intrapreneur identification.",
        icon: Lightbulb,
      },
      {
        title: "Tech Talent Development",
        description: "Software, data, AI and product training in partnership with universities.",
        icon: GraduationCap,
      },
      {
        title: "UIG Ventures (Investment Arm)",
        description:
          "Pre-seed and seed equity into startups aligned with UIG's multi-sector vision.",
        icon: Coins,
      },
    ],
    cta: "Visit the Innovation Hub",
  },
];

const partnerships = [
  {
    icon: Handshake,
    title: "Enterprise Engagements",
    description:
      "Multi-year programmes spanning two or more UIG divisions — single point of contact, group-wide capability.",
  },
  {
    icon: Building,
    title: "Government & Public Sector",
    description:
      "Federal, state and parastatal partnerships across digital infrastructure, agriculture, housing and AI services.",
  },
  {
    icon: Globe2,
    title: "Diaspora & International Investors",
    description:
      "Structured exposure to Nigerian real estate, agritech and venture deals — verified, reported, governed.",
  },
  {
    icon: Coins,
    title: "Co-Investment & JVs",
    description:
      "Joint ventures with operators who bring distribution, land, technology or capital we can compound.",
  },
];

function ServicesPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Services"
        title={
          <>
            Every capability of the group, <span className="text-gradient-gold">in one place.</span>
          </>
        }
        subtitle="UIG operates six divisions and one shared advantage: the ability to combine them. Pick the service you need — or the partnership model that fits — and we'll bring the right division (or divisions) to the table."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-gold-foreground hover:bg-gold/90 shadow-gold"
          >
            Become a Partner <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            to="/divisions"
            className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:border-gold/40"
          >
            Explore the divisions
          </Link>
        </div>
      </PageHero>

      {/* Quick nav */}
      <Section className="!py-12">
        <Eyebrow>Jump to a division</Eyebrow>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {divisions.map((d) => (
            <a
              key={d.to}
              href={`#${d.eyebrow.toLowerCase().replace(/\s+/g, "-")}`}
              className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-surface/60 p-4 hover:border-gold/40 transition"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <d.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-gold">{d.eyebrow}</div>
                  <div className="text-sm font-medium">{d.headline}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-gold group-hover:translate-x-0.5" />
            </a>
          ))}
        </div>
      </Section>

      {/* Per-division sections */}
      {divisions.map((d, idx) => (
        <Section
          key={d.to}
          id={d.eyebrow.toLowerCase().replace(/\s+/g, "-")}
          className={idx % 2 === 1 ? "bg-surface/30" : ""}
        >
          <div className="grid gap-10 lg:grid-cols-[1fr,2fr] lg:gap-16">
            <div className="lg:sticky lg:top-24 self-start">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <d.icon className="h-6 w-6" />
              </div>
              <Eyebrow>{d.eyebrow}</Eyebrow>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold leading-tight">
                {d.headline}
              </h2>
              <p className="mt-4 text-muted-foreground">{d.pitch}</p>
              <div className="mt-6 flex flex-col gap-2">
                <Link to={d.to} className="inline-flex items-center text-sm text-gold">
                  Visit division page <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-medium text-gold-foreground hover:bg-gold/90 w-fit"
                >
                  {d.cta}
                </Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {d.services.map((s) => (
                <FeatureCard
                  key={s.title}
                  title={s.title}
                  description={s.description}
                  icon={<s.icon className="h-5 w-5" />}
                />
              ))}
            </div>
          </div>
        </Section>
      ))}

      {/* Partnership models */}
      <Section>
        <Eyebrow>Partner with UIG</Eyebrow>
        <h2 className="mt-5 font-display text-3xl sm:text-4xl font-bold max-w-3xl">
          Four ways serious operators work with us.
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          UIG is not a vendor. We engage as a long-term partner — with skin in the game,
          multi-division execution, and the discipline to ship.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {partnerships.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-gold/20 bg-surface/60 p-6 hover:border-gold/40 transition"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How we engage */}
      <Section className="bg-surface/30">
        <Eyebrow>How we engage</Eyebrow>
        <h2 className="mt-5 font-display text-3xl sm:text-4xl font-bold">
          From first call to live deployment.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: "01",
              t: "Discovery",
              d: "30-minute scoping call. We map the problem to the right division(s) and surface the early decisions.",
            },
            {
              n: "02",
              t: "Proposal",
              d: "Written scope, milestones, commercials and the named team. No surprises, no fluff.",
            },
            {
              n: "03",
              t: "Build & Deploy",
              d: "Weekly demos, live dashboards and a single point of contact across every division involved.",
            },
            {
              n: "04",
              t: "Operate & Grow",
              d: "SLAs, ongoing support and a roadmap that keeps you Two Steps Ahead.",
            },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-surface/60 p-6">
              <div className="text-xs font-semibold text-gold">{s.n}</div>
              <h3 className="mt-2 font-display text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Why UIG */}
      <Section>
        <Eyebrow>Why UIG</Eyebrow>
        <h2 className="mt-5 font-display text-3xl sm:text-4xl font-bold max-w-3xl">
          One group. Six divisions.{" "}
          <span className="text-gradient-gold">Compounding advantage.</span>
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Cross-division execution: tech that talks to logistics that talks to agritech.",
            "African-built AI, software and operations — not adapted from elsewhere.",
            "Real operators, not consultants. We run our own products and businesses.",
            "Single contract, single point of contact across multiple divisions.",
            "Built in Nigeria. Engineered for Pan-African and global scale.",
            "Partnership economics: we co-invest, co-build and stay in the game.",
          ].map((p) => (
            <li
              key={p}
              className="flex gap-3 items-start rounded-xl border border-border bg-surface/60 p-5"
            >
              <CheckCircle2 className="h-5 w-5 text-gold shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>
      </Section>

      <CTABand
        title="Let's build something together."
        subtitle="Tell us the problem. We'll bring the right division — or divisions — to the table."
        buttonText="Start a conversation"
      />
    </SiteLayout>
  );
}
