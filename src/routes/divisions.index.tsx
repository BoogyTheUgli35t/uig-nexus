import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, CTABand } from "@/components/site/sections";
import { DIVISIONS } from "@/lib/divisions";

export const Route = createFileRoute("/divisions/")({
  head: () => ({
    meta: [
      { title: "UIG Divisions — Six Divisions, One Vision" },
      {
        name: "description",
        content:
          "Explore the six divisions of Unified Innovations Group: Technology, AgriTech, Real Estate, Logistics, Intelligence and Innovation Lab.",
      },
      { property: "og:title", content: "UIG Divisions" },
      { property: "og:description", content: "Six divisions. One unified vision." },
    ],
  }),
  component: DivisionsPage,
});

const divisions = DIVISIONS.map((d) => ({
  to: `/divisions/${d.slug}` as const,
  title: d.name,
  icon: d.icon,
  hero: d.hero,
  blurb: d.tagline,
}));

function DivisionsPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Divisions"
        title={
          <>
            Six divisions. <span className="text-gradient-gold">One unified vision.</span>
          </>
        }
        subtitle="Each division focuses on a real, hard sector — and each shares the same AI spine, design system and operating cadence."
      />

      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {divisions.map((d) => (
            <Link
              key={d.to}
              to={d.to}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-gold/40 hover:bg-surface-elevated"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={d.hero}
                  alt={d.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                <div className="absolute bottom-3 left-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold backdrop-blur">
                  <d.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="p-8 pt-6">
                <h3 className="font-display text-xl font-semibold">{d.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{d.blurb}</p>
                <div className="mt-6 inline-flex items-center text-sm text-gold">
                  Explore{" "}
                  <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <CTABand
        title="Not sure which division fits?"
        subtitle="Tell us your problem — we'll route you to the right team."
        buttonText="Talk to UIG"
      />
    </SiteLayout>
  );
}
