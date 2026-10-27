import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Briefcase, Clock, Heart, Rocket, Layers, GraduationCap } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, Eyebrow, CTABand } from "@/components/site/sections";
import { JsonLd } from "@/components/site/JsonLd";
import { HQ, SITE_LOGO, SITE_NAME, SITE_URL, canonical } from "@/lib/seo";

export const Route = createFileRoute("/careers")({
  head: () => ({
    links: [canonical("/careers")],
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
    division: "technology",
    location: "Lagos / Remote",
    type: "Full-time",
    desc: "Build the AI-native platforms that run modern Africa. Senior team, real impact.",
  },
  {
    title: "AI / ML Engineer",
    dept: "UIG Intelligence",
    division: "intelligence",
    location: "Lagos / Remote",
    type: "Full-time",
    desc: "Train and deploy native African-language models. Yoruba, Igbo, Hausa from the ground up.",
  },
  {
    title: "AgriTech Field Officer",
    dept: "UIG AgriTech",
    division: "agritech",
    location: "Field — Nigeria",
    type: "Full-time",
    desc: "Onboard farms into our network and run drone, sensor and farm-to-market deployments.",
  },
  {
    title: "Logistics Operations Lead",
    dept: "UIG Logistics",
    division: "logistics",
    location: "Lagos",
    type: "Full-time",
    desc: "Run last-mile, fleet and warehouse operations across Nigeria's biggest delivery corridors.",
  },
  {
    title: "Real Estate Analyst",
    dept: "UIG Real Estate",
    division: "real-estate",
    location: "Lagos / Abuja",
    type: "Full-time",
    desc: "Source, verify and structure property opportunities for our investor and developer network.",
  },
  {
    title: "Business Development Manager",
    dept: "UIG Group",
    division: undefined,
    location: "Lagos",
    type: "Full-time",
    desc: "Open enterprise and government accounts across all six divisions.",
  },
  {
    title: "Innovation Programme Coordinator",
    dept: "UIG Innovation Lab",
    division: "innovation-lab",
    location: "Lagos",
    type: "Full-time",
    desc: "Run the incubation cohort, founder mentorship and Innovation Hub events.",
  },
];

const BENEFITS = [
  {
    icon: Rocket,
    t: "Ship in days",
    d: "Small teams with real decision rights. No six-week approval chains between an idea and production.",
  },
  {
    icon: Layers,
    t: "Six divisions, one platform",
    d: "Everything runs on the same portal and the same data layer, so your work is reused across sectors rather than siloed.",
  },
  {
    icon: GraduationCap,
    t: "Deliberate growth",
    d: "A senior engineer or operator reviews your work weekly. Rotations across divisions are encouraged, not blocked.",
  },
  {
    icon: Heart,
    t: "Built for Nigeria",
    d: "Lagos-based with remote-friendly engineering roles and field roles that put you on the ground where the work is.",
  },
];

const HIRING_STEPS = [
  {
    t: "Apply",
    d: "The form takes two minutes. We read every application ourselves — no keyword filter between you and a human.",
  },
  {
    t: "Intro call — 30 minutes",
    d: "What you've built, what you want next, and an honest description of the role from our side.",
  },
  {
    t: "Practical exercise",
    d: "Scoped to a few hours and drawn from real work. Paid if it takes longer than that.",
  },
  {
    t: "Team conversation",
    d: "Meet the people you'd work with daily, plus the division lead. Ask us anything.",
  },
  { t: "Offer", d: "Decision within 5 business days of the last conversation. Every time." },
];

/**
 * Structured data per open role.
 *
 * Google Jobs indexes `JobPosting` and surfaces it in a dedicated search
 * experience — free, high-intent traffic that seven listings with no markup
 * were entirely invisible to. `validThrough` isn't emitted: a guessed expiry
 * on an open-ended role is worse than none, since an expired posting is
 * dropped from the index outright.
 */
function jobPostingJsonLd(role: (typeof roles)[number]) {
  const remote = /remote/i.test(role.location);
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role.title,
    description: role.desc,
    employmentType: role.type.toUpperCase().replace(/-/g, "_"),
    industry: role.dept,
    directApply: true,
    hiringOrganization: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: SITE_URL,
      logo: SITE_LOGO,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: /abuja/i.test(role.location) ? "Abuja" : "Lagos",
        addressCountry: HQ.country,
      },
    },
    ...(remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: HQ.countryName },
        }
      : {}),
  };
}

function CareersPage() {
  return (
    <SiteLayout>
      {roles.map((r) => (
        <JsonLd key={r.title} data={jobPostingJsonLd(r)} />
      ))}
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
        <Eyebrow>What you get</Eyebrow>
        <h2 className="mt-5 text-3xl font-bold sm:text-4xl">How we work, concretely.</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          The things that actually change your week, rather than a list of perks.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.t} className="rounded-xl border border-border bg-surface/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                <b.icon className="h-5 w-5 text-gold" />
              </div>
              <h3 className="mt-4 font-semibold">{b.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>How hiring works</Eyebrow>
        <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Five steps, no black box.</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          You'll know where you stand at every stage, and you'll hear back either way.
        </p>
        <ol className="mt-10 space-y-4">
          {HIRING_STEPS.map((s, i) => (
            <li
              key={s.t}
              className="flex gap-4 rounded-xl border border-border bg-surface/60 p-5 transition hover:border-gold/40"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-sm font-semibold text-gold">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
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
              {/* Carries the role (and its division) into the contact form, so
                  seven listings stop arriving as seven untagged messages and
                  the applicant doesn't retype what the site already knew. */}
              <Link
                to="/contact"
                search={{ role: r.title, interest: r.division }}
                className="inline-flex shrink-0 items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-medium text-gold-foreground hover:bg-gold/90"
                aria-label={`Apply for ${r.title}`}
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
          <Link
            to="/contact"
            search={{ role: "Open application" }}
            className="mt-4 inline-flex items-center text-sm text-gold"
          >
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
