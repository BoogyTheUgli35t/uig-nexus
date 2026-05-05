import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Sprout, Building2, Truck, Brain, Beaker } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, CTABand } from "@/components/site/sections";

export const Route = createFileRoute("/divisions")({
  head: () => ({
    meta: [
      { title: "UIG Divisions — Six Divisions, One Vision" },
      { name: "description", content: "Explore the six divisions of Unified Innovations Group: Technology, AgriTech, Real Estate, Logistics, Intelligence and Innovation Lab." },
      { property: "og:title", content: "UIG Divisions" },
      { property: "og:description", content: "Six divisions. One unified vision." },
    ],
  }),
  component: DivisionsPage,
});

const divisions = [
  { to: "/divisions/technology", title: "UIG Technology", icon: Cpu, blurb: "AI-powered software, portals & automation that replace manual work and unify your operation." },
  { to: "/divisions/agritech", title: "UIG AgriTech", icon: Sprout, blurb: "Smart agriculture, data intelligence and predictive insights for farms and agri-enterprises." },
  { to: "/divisions/real-estate", title: "UIG Real Estate", icon: Building2, blurb: "Property systems, real estate CRM and investor intelligence for developers and agencies." },
  { to: "/divisions/logistics", title: "UIG Logistics", icon: Truck, blurb: "Fleet intelligence, tracking systems and route optimization for modern logistics operators." },
  { to: "/divisions/intelligence", title: "UIG Intelligence", icon: Brain, blurb: "Custom AI models, automation and predictive systems built for African realities." },
  { to: "/divisions/innovation-lab", title: "UIG Innovation Lab", icon: Beaker, blurb: "Venture studio and R&D — prototypes, MVPs and pilots with founders, corporates and investors." },
] as const;

function DivisionsPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Divisions"
        title={<>Six divisions. <span className="text-gradient-gold">One unified vision.</span></>}
        subtitle="Each division focuses on a real, hard sector — and each shares the same AI spine, design system and operating cadence."
      />

      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {divisions.map((d) => (
            <Link
              key={d.to}
              to={d.to}
              className="group relative rounded-2xl border border-border bg-surface p-8 transition hover:border-gold/40 hover:bg-surface-elevated"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                <d.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-semibold">{d.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{d.blurb}</p>
              <div className="mt-6 inline-flex items-center text-sm text-gold">
                Explore <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <CTABand title="Not sure which division fits?" subtitle="Tell us your problem — we'll route you to the right team." buttonText="Talk to UIG" />
    </SiteLayout>
  );
}
