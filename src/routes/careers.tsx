import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Briefcase, Clock } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, Eyebrow, CTABand } from "@/components/site/sections";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Join the Builders of Africa's Future | UIG" },
      {
        name: "description",
        content:
          "Engineering, AI, AgriTech, real estate, logistics and venture roles at Unified Innovations Group. Lagos and remote.",
      },
      { property: "og:title", content: "Careers at UIG" },
      {
        property: "og:description",
        content: "Build the infrastructure Africa deserves. Join Unified Innovations Group.",
      },
    ],
  }),
  component: CareersPage,
});

const roles = [
  {
    title: "Software Engineer",
    dept: "UIG Technology",
    location: "Lagos / Remote",
    type: "Full-time",
    desc: "Build the AI-native platforms that run modern Africa. Senior team, real impact.",
  },
  {
    title: "AI / ML Engineer",
    dept: "UIG Intelligence",
    location: "Lagos / Remote",
    type: "Full-time",
    desc: "Train and deploy native African-language models. Yoruba, Igbo, Hausa from the ground up.",
  },
  {
    title: "AgriTech Field Officer",
    dept: "UIG AgriTech",
    location: "Field — Nigeria",
    type: "Full-time",
    desc: "Onboard farms into our network and run drone, sensor and farm-to-market deployments.",
  },
  {
    title: "Logistics Operations Lead",
    dept: "UIG Logistics",
    location: "Lagos",
    type: "Full-time",
    desc: "Run last-mile, fleet and warehouse operations across Nigeria's biggest delivery corridors.",
  },
  {
    title: "Real Estate Analyst",
    dept: "UIG Real Estate",
    location: "Lagos / Abuja",
    type: "Full-time",
    desc: "Source, verify and structure property opportunities for our investor and developer network.",
  },
  {
    title: "Business Development Manager",
    dept: "UIG Group",
    location: "Lagos",
    type: "Full-time",
    desc: "Open enterprise and government accounts across all six divisions.",
  },
  {
    title: "Innovation Programme Coordinator",
    dept: "UIG Innovation Lab",
    location: "Lagos",
    type: "Full-time",
    desc: "Run the incubation cohort, founder mentorship and Innovation Hub events.",
  },
];

function CareersPage() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Careers"
        title={
          <>
            Join the Builders of <span className="text-gradient-gold">Africa's Future.</span>
          </>
        }
        subtitle="UIG is hiring across every division. We're looking for ambitious, technically credible, execution-obsessed people who want to build the infrastructure Africa deserves."
      />

      <Section>
        <Eyebrow>Why UIG</Eyebrow>
        <h2 className="mt-5 text-3xl sm:text-4xl font-bold">
          Real ownership. Real impact. Real growth.
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            {
              t: "Mission that matters",
              d: "Every project moves a Nigerian — and African — industry forward.",
            },
            {
              t: "Build, don't consult",
              d: "We ship products and operate businesses. You'll see your work live in days, not quarters.",
            },
            {
              t: "Multi-sector exposure",
              d: "Patterns from agriculture inform our tech. PropTech informs our logistics. Compounding learning.",
            },
          ].map((p) => (
            <div key={p.t} className="rounded-xl border border-border bg-surface/60 p-6">
              <h3 className="font-semibold">{p.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>Open roles</Eyebrow>
        <h2 className="mt-5 text-3xl sm:text-4xl font-bold">We're hiring.</h2>
        <div className="mt-10 space-y-3">
          {roles.map((r) => (
            <div
              key={r.title}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface/60 p-5 hover:border-gold/40 transition"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-gold uppercase tracking-wider">
                  <Briefcase className="h-3.5 w-3.5" /> {r.dept}
                </div>
                <h3 className="mt-1 font-semibold text-lg">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{r.desc}</p>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {r.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {r.type}
                  </span>
                </div>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-medium text-gold-foreground hover:bg-gold/90 shrink-0"
              >
                Apply Now
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-gold/30 bg-gold/5 p-6">
          <h3 className="font-semibold">Don't see your role?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Send an open application. We're always looking for builders who care.
          </p>
          <Link to="/contact" className="mt-4 inline-flex items-center text-sm text-gold">
            Send open application →
          </Link>
        </div>
      </Section>

      <CTABand
        title="Build the future Africa deserves."
        subtitle="Apply to join UIG."
        buttonText="Get in touch"
      />
    </SiteLayout>
  );
}
