import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Sprout, Building2, Truck, Brain, Beaker, Sparkles, Globe2, Target } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section, Eyebrow, FeatureCard, CTABand } from "@/components/site/sections";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Unified Innovations Group — AI-First Multi-Division Group" },
      { name: "description", content: "A multi-division, AI-first group building the next generation of infrastructure for Africa and the world." },
      { property: "og:title", content: "Unified Innovations Group" },
      { property: "og:description", content: "Six divisions. One unified vision. Tech, AgriTech, Real Estate, Logistics, AI and Innovation." },
    ],
  }),
  component: HomePage,
});

const divisions = [
  { to: "/divisions/technology", label: "UIG Technology", icon: Cpu },
  { to: "/divisions/agritech", label: "UIG AgriTech", icon: Sprout },
  { to: "/divisions/real-estate", label: "UIG Real Estate", icon: Building2 },
  { to: "/divisions/logistics", label: "UIG Logistics", icon: Truck },
  { to: "/divisions/intelligence", label: "UIG Intelligence", icon: Brain },
  { to: "/divisions/innovation-lab", label: "UIG Innovation Lab", icon: Beaker },
] as const;

function HomePage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gold/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-32 sm:pb-32">
          <Eyebrow>Africa-rooted • AI-native • Multi-sector</Eyebrow>
          <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-5xl leading-[1.05]">
            Unified <span className="text-gradient-gold">Innovations</span> Group
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            A multi-division, AI-first group building the next generation of
            infrastructure for Africa and the world.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-gold">
              <Link to="/divisions">
                Explore Divisions <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/portal">Enter UIG Portal</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Divisions ticker */}
      <section className="border-y border-border bg-surface/40 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
          {divisions.map((d) => (
            <Link key={d.to} to={d.to} className="inline-flex items-center gap-2 hover:text-gold transition">
              <d.icon className="h-4 w-4 text-gold" />
              {d.label}
            </Link>
          ))}
        </div>
      </section>

      {/* About snapshot */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          <div>
            <Eyebrow>About UIG</Eyebrow>
            <h2 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight">
              Built in Nigeria. <br />
              <span className="text-gradient-gold">Engineered for the world.</span>
            </h2>
          </div>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              UIG is a Nigerian-founded, AI-native, multi-sector group operating across
              six divisions — technology, agriculture, real estate, logistics, artificial
              intelligence, and venture innovation.
            </p>
            <p>
              We design and operate intelligent systems that move industries forward,
              with deep roots in African markets and a global execution mindset.
            </p>
            <Button asChild variant="link" className="text-gold p-0 h-auto">
              <Link to="/about">Read our story <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* Why UIG */}
      <Section>
        <Eyebrow>Why UIG</Eyebrow>
        <h2 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">
          A different kind of group.
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={<Sparkles className="h-5 w-5" />} title="AI-first by design" description="AI is baked into every product, division, and decision — not bolted on later." />
          <FeatureCard icon={<Cpu className="h-5 w-5" />} title="Multi-division strength" description="Six divisions sharing data, talent and tooling — compounding advantage across sectors." />
          <FeatureCard icon={<Globe2 className="h-5 w-5" />} title="Africa-rooted" description="Built for African markets first, with playbooks and data that reflect local realities." />
          <FeatureCard icon={<Target className="h-5 w-5" />} title="Execution-focused" description="We ship. Real systems, real users, real outcomes — not slideware." />
        </div>
      </Section>

      <CTABand title="Partner with UIG" subtitle="Whether you're a founder, corporate or investor — let's build what's next." buttonText="Partner with UIG" />
    </SiteLayout>
  );
}
