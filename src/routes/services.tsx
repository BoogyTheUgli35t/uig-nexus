import { createFileRoute, Link } from "@tanstack/react-router";
import { Cpu, Brain, Building2, Truck, Sprout, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, CTABand } from "@/components/site/sections";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "UIG Services — Cross-Division Capabilities" },
      { name: "description", content: "Cross-division services from Unified Innovations Group: tech, AI, real estate systems, logistics and agritech intelligence." },
      { property: "og:title", content: "UIG Services" },
      { property: "og:description", content: "Cross-division services from Unified Innovations Group." },
    ],
  }),
  component: ServicesPage,
});

const services = [
  { to: "/divisions/technology", icon: Cpu, title: "Tech & Digital Transformation", description: "Custom portals, internal tools, integrations and product development." },
  { to: "/divisions/intelligence", icon: Brain, title: "AI & Automation", description: "Custom models, predictive analytics, AI assistants and workflow automation." },
  { to: "/divisions/real-estate", icon: Building2, title: "Real Estate Systems", description: "Property management, CRM, investor dashboards and smart marketing sites." },
  { to: "/divisions/logistics", icon: Truck, title: "Logistics Optimization", description: "Tracking dashboards, fleet tools, customer portals and route intelligence." },
  { to: "/divisions/agritech", icon: Sprout, title: "AgriTech Intelligence", description: "Farm dashboards, IoT integration, yield prediction and cooperative tools." },
] as const;

function ServicesPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Services"
        title={<>Cross-division <span className="text-gradient-gold">capabilities.</span></>}
        subtitle="Pick the capability that fits your problem. Each service is delivered by the relevant UIG division — backed by the full group."
      />

      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group rounded-2xl border border-border bg-surface p-8 transition hover:border-gold/40 hover:bg-surface-elevated"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-6 inline-flex items-center text-sm text-gold">
                Learn more <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <CTABand title="Tell us what you need." subtitle="A short conversation is enough to point you to the right division and a clear next step." />
    </SiteLayout>
  );
}
