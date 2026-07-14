import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Cpu,
  Sprout,
  Building2,
  Truck,
  Brain,
  Beaker,
  Sparkles,
  Globe2,
  Target,
  Layers,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, Eyebrow, FeatureCard, CTABand } from "@/components/site/sections";
import { Button } from "@/components/ui/button";

// Original UIG division photography (bundled assets — no external CDN dependency),
// used for the homepage photo story below.
import heroTechnology from "@/assets/divisions/hero-technology.jpg";
import heroAgritech from "@/assets/divisions/hero-agritech.jpg";
import heroRealEstate from "@/assets/divisions/hero-real-estate.jpg";
import heroLogistics from "@/assets/divisions/hero-logistics.jpg";
import heroIntelligence from "@/assets/divisions/hero-intelligence.jpg";
import heroInnovationLab from "@/assets/divisions/hero-innovation-lab.jpg";

const STORY_IMAGES = [
  { src: heroTechnology, caption: "UIG Technology — AI-native software & platforms" },
  { src: heroRealEstate, caption: "UIG Real Estate — property systems & listings" },
  { src: heroAgritech, caption: "UIG AgriTech — smart agriculture & yield intelligence" },
  { src: heroLogistics, caption: "UIG Logistics — fleet intelligence & routing" },
  { src: heroIntelligence, caption: "UIG Intelligence — models, analytics & automation" },
  { src: heroInnovationLab, caption: "UIG Innovation Lab — where new ventures are born" },
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Unified Innovations Group — Two Steps Ahead." },
      {
        name: "description",
        content:
          "UIG is Nigeria's leading multi-sector innovation conglomerate — building the infrastructure for Africa's future through technology, agriculture, intelligence and beyond.",
      },
      { property: "og:title", content: "Unified Innovations Group — Two Steps Ahead." },
      {
        property: "og:description",
        content:
          "Six divisions. One unified vision. Technology, AgriTech, Real Estate, Logistics, Intelligence and Innovation Lab.",
      },
    ],
  }),
  component: HomePage,
});

const divisions = [
  {
    to: "/divisions/technology",
    label: "UIG Technology",
    desc: "AI-native software, SaaS and cloud for African enterprises.",
    icon: Cpu,
  },
  {
    to: "/divisions/agritech",
    label: "UIG AgriTech",
    desc: "Drones, sensors and farm-to-market intelligence.",
    icon: Sprout,
  },
  {
    to: "/divisions/real-estate",
    label: "UIG Real Estate",
    desc: "Property sourcing, smart developments and investment advisory.",
    icon: Building2,
  },
  {
    to: "/divisions/logistics",
    label: "UIG Logistics",
    desc: "Last-mile, fleet, warehousing and cold-chain across Nigeria.",
    icon: Truck,
  },
  {
    to: "/divisions/intelligence",
    label: "UIG Intelligence",
    desc: "Native African-language LLMs, business AI and analytics.",
    icon: Brain,
  },
  {
    to: "/divisions/innovation-lab",
    label: "UIG Innovation Lab",
    desc: "Incubation, R&D, talent and venture investment.",
    icon: Beaker,
  },
] as const;

const tickerItems = [
  "Technology",
  "AgriTech",
  "Real Estate",
  "Logistics",
  "AI & Machine Learning",
  "Native AI Models",
  "Innovation Lab",
  "Smart Agriculture",
  "Supply Chain Intelligence",
  "PropTech",
];

function HomePage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gold/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-32 sm:pb-32">
          <Eyebrow>Lagos · Pan-African · Global</Eyebrow>
          <h1 className="mt-6 text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight max-w-5xl leading-[1.02]">
            Two Steps <span className="text-gradient-gold">Ahead.</span>
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Unified Innovations Group is Nigeria's leading multi-sector innovation conglomerate —
            building the infrastructure for Africa's future through technology, agriculture,
            intelligence and beyond.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold"
            >
              <Link to="/divisions">
                Explore Our Divisions <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Partner With UIG</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="border-y border-border bg-surface/40 overflow-hidden">
        <div className="flex gap-12 py-5 marquee-track whitespace-nowrap text-sm uppercase tracking-[0.2em] text-gold/80">
          {[...tickerItems, ...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-12">
              {t}
              <span className="h-1 w-1 rounded-full bg-gold/50" />
            </span>
          ))}
        </div>
      </section>

      {/* About snapshot */}
      <Section>
        <div className="grid gap-10 sm:grid-cols-3 mb-16">
          <div className="rounded-xl border border-border bg-surface/40 p-6">
            <div className="text-4xl font-bold text-gradient-gold">6</div>
            <div className="mt-2 text-sm text-muted-foreground">Active Divisions</div>
          </div>
          <div className="rounded-xl border border-border bg-surface/40 p-6">
            <div className="text-4xl font-bold text-gradient-gold">36</div>
            <div className="mt-2 text-sm text-muted-foreground">Nigerian States in Coverage</div>
          </div>
          <div className="rounded-xl border border-border bg-surface/40 p-6">
            <div className="text-4xl font-bold text-gradient-gold">Pan-African</div>
            <div className="mt-2 text-sm text-muted-foreground">Vision, Global Reach</div>
          </div>
        </div>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          <div>
            <Eyebrow>About UIG</Eyebrow>
            <h2 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight">
              We don't build companies. <br />
              <span className="text-gradient-gold">We build industries.</span>
            </h2>
          </div>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              UIG is a Nigerian-founded, AI-native multi-sector group operating across six divisions
              — technology, agriculture, real estate, logistics, intelligence and venture
              innovation.
            </p>
            <p>
              We design and operate intelligent systems that move whole industries forward — rooted
              in African market reality, executed to global standards.
            </p>
            <Button asChild variant="link" className="text-gold p-0 h-auto">
              <Link to="/about">
                Read our story <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* Divisions grid */}
      <Section>
        <Eyebrow>Six divisions</Eyebrow>
        <h2 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight">One unified vision.</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {divisions.map((d) => (
            <Link
              key={d.to}
              to={d.to}
              className="group relative rounded-2xl border border-border bg-surface/60 p-7 transition hover:border-gold/50 hover:bg-surface hover:shadow-gold"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gold/10 text-gold">
                <d.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{d.label}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
              <div className="mt-5 inline-flex items-center text-sm text-gold">
                Explore Division{" "}
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Photo story */}
      <Section>
        <Eyebrow>On the ground</Eyebrow>
        <h2 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">
          Real work, across real Nigeria.
        </h2>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {STORY_IMAGES.map((img) => (
            <div
              key={img.src}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border"
            >
              <img
                src={img.src}
                alt={img.caption}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/0 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-xs text-foreground/90">
                {img.caption}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Why UIG */}
      <Section>
        <Eyebrow>Why UIG</Eyebrow>
        <h2 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">
          A different kind of group.
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="AI-Native by Design"
            description="Every operation is intelligent. AI is built in, never bolted on later."
          />
          <FeatureCard
            icon={<Globe2 className="h-5 w-5" />}
            title="Rooted in Nigeria, Built for Africa"
            description="Local context, global standards. Playbooks that reflect African market reality."
          />
          <FeatureCard
            icon={<Layers className="h-5 w-5" />}
            title="Multi-Sector Resilience"
            description="Six industries, one unified strategy — patterns from one division compound across all."
          />
          <FeatureCard
            icon={<Target className="h-5 w-5" />}
            title="Builder Mindset"
            description="We don't consult. We build and we operate. Real systems, real users, real outcomes."
          />
        </div>
      </Section>

      {/* Vision quote */}
      <section className="relative overflow-hidden border-y border-gold/20 bg-surface/40">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[800px] rounded-full bg-gold/10 blur-[120px]" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <p className="text-3xl sm:text-4xl lg:text-5xl font-display italic leading-snug">
            "We don't build companies.
            <br />
            We build the future that <span className="text-gradient-gold">Nigeria deserves</span>."
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 max-w-3xl mx-auto text-left">
            <div>
              <div className="text-xs uppercase tracking-wider text-gold">Mission</div>
              <p className="mt-2 text-muted-foreground">
                To transform Africa's most critical industries through intelligent technology, local
                innovation and relentless execution.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gold">Vision</div>
              <p className="mt-2 text-muted-foreground">
                A continent where no farmer, no builder, no entrepreneur is held back by outdated
                infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by strip */}
      <Section>
        <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Trusted by forward-thinking organisations across Nigeria and Africa
        </p>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {["Agribusiness", "Real Estate", "Logistics", "Tech", "Government", "Healthcare"].map(
            (label) => (
              <div
                key={label}
                className="flex h-16 items-center justify-center rounded-lg border border-border bg-surface/40 text-sm text-muted-foreground"
              >
                {label}
              </div>
            ),
          )}
        </div>
      </Section>

      <CTABand
        title="Ready to build something extraordinary?"
        subtitle="Let's build infrastructure that moves Africa forward — together."
        buttonText="Start a Conversation"
      />
    </SiteLayout>
  );
}
