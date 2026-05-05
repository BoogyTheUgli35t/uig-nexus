import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, Eyebrow, CTABand } from "@/components/site/sections";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About UIG — Our Story, Mission and Vision" },
      { name: "description", content: "Unified Innovations Group is an AI-native, multi-division group operating across technology, agriculture, real estate, logistics and venture innovation." },
      { property: "og:title", content: "About Unified Innovations Group" },
      { property: "og:description", content: "Our story, mission, vision and operating model." },
    ],
  }),
  component: AboutPage,
});

const stats = [
  { value: "6", label: "Divisions" },
  { value: "AI-first", label: "Operating model" },
  { value: "Africa+", label: "Market focus" },
  { value: "24/7", label: "Engineering" },
];

function AboutPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="About UIG"
        title={<>One group. <span className="text-gradient-gold">Six divisions.</span> A unified vision.</>}
        subtitle="Unified Innovations Group is a Nigerian-founded, AI-native group building intelligent infrastructure for the industries that move Africa forward — and beyond."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6 text-muted-foreground leading-relaxed">
            <Eyebrow>Our story</Eyebrow>
            <h2 className="text-3xl font-bold text-foreground">A group built for the AI era.</h2>
            <p>
              UIG was founded with a single conviction: the next decade of African enterprise
              will be defined by groups that combine deep operational expertise with
              AI-native systems. So we built one.
            </p>
            <p>
              From day one, we designed UIG as a multi-division group — each division focused
              on a real, hard sector, and each division powered by the same shared spine of
              AI, data and engineering capability.
            </p>
            <p>
              The result is a company where a model trained for logistics improves real estate
              decisions, where a portal built for one client becomes infrastructure for an
              industry, and where every division compounds the strength of the others.
            </p>
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border border-gold/20 bg-surface p-6">
              <h3 className="text-sm uppercase tracking-wider text-gold">Mission</h3>
              <p className="mt-3 text-foreground leading-relaxed">
                To build and operate AI-native systems that move African industries — and the
                global economy — forward.
              </p>
            </div>
            <div className="rounded-xl border border-gold/20 bg-surface p-6">
              <h3 className="text-sm uppercase tracking-wider text-gold">Vision</h3>
              <p className="mt-3 text-foreground leading-relaxed">
                A unified group whose divisions become the default operating layer for the
                industries they serve.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <Eyebrow>Operating model</Eyebrow>
        <h2 className="mt-5 text-3xl sm:text-4xl font-bold">How the six divisions connect.</h2>
        <p className="mt-4 text-muted-foreground max-w-3xl">
          Each division is independently focused but operationally unified. Shared AI, shared
          data, shared design, shared portal — Apex — to coordinate everything.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Shared AI spine", "UIG Intelligence trains and serves models for every other division."],
            ["Shared portal", "Apex is the single client and operations interface across divisions."],
            ["Shared data", "Cross-division insights compound — agriculture meets logistics meets finance."],
            ["Shared brand", "One identity, premium and consistent, across every product surface."],
            ["Shared talent", "Engineering, design and operations rotate across divisions."],
            ["Shared playbooks", "What works in one sector accelerates the next."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-border bg-surface/60 p-6">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl border border-border bg-surface p-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl sm:text-4xl font-display font-bold text-gradient-gold">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      <CTABand title="Want to work with UIG?" subtitle="Tell us about your sector, your problem, or your idea." />
    </SiteLayout>
  );
}
