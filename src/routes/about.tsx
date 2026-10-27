import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Compass,
  Handshake,
  Linkedin,
  MapPin,
  Quote,
  ShieldCheck,
  Target,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, Eyebrow, CTABand } from "@/components/site/sections";
import { JsonLd } from "@/components/site/JsonLd";
import { COMPANY_REGISTRATION, CONTACT_EMAIL, HQ, SITE_NAME, SITE_URL, canonical } from "@/lib/seo";
import { LEADERSHIP, LEADERSHIP_OPEN_ROLES, initials } from "@/lib/leadership";
import { DIVISIONS } from "@/lib/divisions";

export const Route = createFileRoute("/about")({
  head: () => ({
    links: [canonical("/about")],
    meta: [
      { title: "About UIG — Our Story, Leadership and Operating Model" },
      {
        name: "description",
        content:
          "Unified Innovations Group is an AI-native, multi-division group operating across technology, agriculture, real estate, logistics and venture innovation. Founded and led from Lagos.",
      },
      { property: "og:title", content: "About Unified Innovations Group" },
      {
        property: "og:description",
        content: "Our story, leadership, operating model and how six divisions share one AI spine.",
      },
      { property: "og:url", content: `${SITE_URL}/about` },
    ],
  }),
  component: AboutPage,
});

/**
 * Group-level numbers.
 *
 * Three of the four previous tiles were adjectives formatted as numbers
 * ("AI-first", "Africa+", "24/7") — which is worse than no stat band, because
 * it signals that there wasn't a real number to give. These are structural
 * facts about the group, which are true and checkable on the site itself.
 */
const stats = [
  { value: "6", label: "Operating divisions" },
  { value: "1", label: "Shared AI + data spine" },
  { value: "1", label: "Client portal across all six" },
  { value: "Lagos", label: "Headquarters" },
];

const VALUES = [
  {
    icon: Target,
    title: "Ship, then say",
    body: "We announce things that exist. Every capability on this site is either live in the Apex Portal today or clearly marked as in build — no roadmap dressed up as a product.",
  },
  {
    icon: ShieldCheck,
    title: "Built for the conditions we're in",
    body: "Sensors that survive Nigerian humidity. Alerts that work on feature phones. Title checks that assume the registry is slow. Software that assumes ideal infrastructure doesn't survive contact with the market we serve.",
  },
  {
    icon: Compass,
    title: "One spine, six businesses",
    body: "A division earns its place by being a real business in a hard sector — and by making the other five stronger. If a capability only helps one division, it belongs with a specialist, not with us.",
  },
  {
    icon: Handshake,
    title: "Accountable to the operator",
    body: "The person using the product — the field officer, the driver, the property manager — is the one whose week has to get better. Boards can read the dashboard; the operator has to be able to do the job.",
  },
];

const OPERATING_MODEL = [
  [
    "Shared AI spine",
    "UIG Intelligence trains and serves the models every other division runs on.",
  ],
  ["Shared portal", "Apex is the single client and operations interface across all six divisions."],
  [
    "Shared data",
    "Cross-division insight compounds — agriculture informs logistics, logistics informs property.",
  ],
  ["Shared brand", "One identity, consistent across every product surface a client touches."],
  ["Shared talent", "Engineering, design and operations rotate across divisions by design."],
  ["Shared playbooks", "What works in one sector shortens the build in the next."],
];

/** Typed division links, so the router accepts the literal `to` values. */
const DIVISION_LINKS = DIVISIONS.map((d) => ({
  to: `/divisions/${d.slug}` as const,
  name: d.name,
  icon: d.icon,
}));

const PRESENCE = [
  {
    city: "Lagos",
    detail: `${HQ.locality} — group headquarters, engineering, Intelligence and the Innovation Lab.`,
  },
  {
    city: "Abuja",
    detail: "Real Estate origination and public-sector accounts across the FCT.",
  },
  {
    city: "Field operations",
    detail:
      "AgriTech field officers and Logistics fleet operating across Nigeria's major corridors.",
  },
];

function AboutPage() {
  const leader = LEADERSHIP[0];

  // `founder` lets search engines tie the person to the organisation — the
  // group's own structured data never named anyone.
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${SITE_NAME}`,
    url: `${SITE_URL}/about`,
    mainEntity: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      email: CONTACT_EMAIL,
      numberOfEmployees: undefined,
      address: {
        "@type": "PostalAddress",
        addressLocality: HQ.locality,
        addressRegion: HQ.region,
        addressCountry: HQ.country,
      },
      ...(COMPANY_REGISTRATION.foundedYear
        ? { foundingDate: String(COMPANY_REGISTRATION.foundedYear) }
        : {}),
      ...(leader
        ? {
            founder: {
              "@type": "Person",
              name: leader.name,
              jobTitle: leader.role,
              worksFor: { "@type": "Organization", name: SITE_NAME },
            },
          }
        : {}),
      subOrganization: DIVISIONS.map((d) => ({
        "@type": "Organization",
        name: `UIG ${d.name}`,
        url: `${SITE_URL}/divisions/${d.slug}`,
      })),
    },
  };

  return (
    <SiteLayout>
      <JsonLd data={aboutJsonLd} />

      <PageHero
        eyebrow="About UIG"
        title={
          <>
            One group. <span className="text-gradient-gold">Six divisions.</span> A unified vision.
          </>
        }
        subtitle="Unified Innovations Group is a Nigerian-founded, AI-native group building intelligent infrastructure for the industries that move Africa forward — and beyond."
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-6 leading-relaxed text-muted-foreground lg:col-span-2">
            <Eyebrow>Our story</Eyebrow>
            <h2 className="text-3xl font-bold text-foreground">A group built for the AI era.</h2>
            <p>
              UIG was founded
              {COMPANY_REGISTRATION.foundedYear ? ` in ${COMPANY_REGISTRATION.foundedYear}` : ""} in
              Lagos on a single conviction: the next decade of African enterprise will be defined by
              groups that combine deep operational expertise with AI-native systems. So we built
              one.
            </p>
            <p>
              From the start we designed UIG as a multi-division group — each division focused on a
              real, hard sector, and each division powered by the same shared spine of AI, data and
              engineering capability. That is a deliberately harder company to build than a single
              product business, and it is the only structure that makes the economics work at our
              stage: the expensive part gets built once and six businesses use it.
            </p>
            <p>
              The result is a company where a model trained for logistics improves real-estate
              decisions, where a portal built for one client becomes infrastructure for an industry,
              and where every division compounds the strength of the others.
            </p>
            <p>
              We are early and we say so. What is live is live, what is in build is labelled — and
              the six divisions on this site are businesses with named owners, not a diagram.
            </p>
          </div>
          <div className="space-y-6">
            <div className="rounded-xl border border-gold/20 bg-surface p-6">
              <h3 className="text-sm uppercase tracking-wider text-gold">Mission</h3>
              <p className="mt-3 leading-relaxed text-foreground">
                To build and operate AI-native systems that move African industries — and the global
                economy — forward.
              </p>
            </div>
            <div className="rounded-xl border border-gold/20 bg-surface p-6">
              <h3 className="text-sm uppercase tracking-wider text-gold">Vision</h3>
              <p className="mt-3 leading-relaxed text-foreground">
                A unified group whose divisions become the default operating layer for the
                industries they serve.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-sm uppercase tracking-wider text-gold">Registered in Nigeria</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {COMPANY_REGISTRATION.rcNumber ? (
                  <>
                    Incorporated with the Corporate Affairs Commission,{" "}
                    <span className="text-foreground">{COMPANY_REGISTRATION.rcNumber}</span>.
                  </>
                ) : (
                  <>
                    A Nigerian company headquartered in {HQ.locality}. Our CAC registration details
                    are available on request for procurement and due-diligence purposes.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ============================== Leadership ============================== */}
      {leader && (
        <Section>
          <Eyebrow>Leadership</Eyebrow>
          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Who runs UIG.</h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            A group this structure only works if someone owns the whole picture. Here is who that
            is, and what they are accountable for.
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-gold/20 bg-surface p-6">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-gold/30 bg-gold/10">
                  {leader.photo ? (
                    <img
                      src={leader.photo}
                      alt={leader.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="font-display text-2xl font-bold text-gradient-gold">
                      {initials(leader.name)}
                    </span>
                  )}
                </div>
                <div className="mt-5 text-xs uppercase tracking-[0.2em] text-gold">
                  {leader.remit}
                </div>
                <h3 className="mt-2 text-xl font-bold">{leader.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{leader.role}</p>

                {leader.background.length > 0 && (
                  <div className="mt-5 border-t border-border pt-5">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground">
                      Background
                    </h4>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {leader.background.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {leader.linkedin && (
                  <a
                    href={leader.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
                  >
                    <Linkedin className="h-4 w-4" /> LinkedIn
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-6 lg:col-span-2">
              {leader.bio.map((p) => (
                <p key={p.slice(0, 40)} className="leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}

              {leader.quote && (
                <blockquote className="relative rounded-2xl border border-gold/20 bg-gold/5 p-6 sm:p-8">
                  <Quote className="h-6 w-6 text-gold/50" aria-hidden="true" />
                  <p className="mt-3 text-lg leading-relaxed text-foreground">
                    &ldquo;{leader.quote}&rdquo;
                  </p>
                  <footer className="mt-4 text-sm text-muted-foreground">
                    — {leader.name}, {leader.role}
                  </footer>
                </blockquote>
              )}
            </div>
          </div>

          {LEADERSHIP_OPEN_ROLES.length > 0 && (
            <div className="mt-12 rounded-2xl border border-border bg-surface/60 p-6 sm:p-8">
              <h3 className="font-semibold">
                We&rsquo;re building the rest of the bench in public.
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                These seats are open. If one of them is obviously yours, the fastest route is to say
                so directly.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {LEADERSHIP_OPEN_ROLES.map((r) => (
                  <div key={r.role} className="rounded-xl border border-dashed border-border p-5">
                    <div className="text-[10px] uppercase tracking-wider text-gold">{r.remit}</div>
                    <h4 className="mt-1.5 font-semibold">{r.role}</h4>
                    <p className="mt-2 text-sm text-muted-foreground">{r.note}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/careers"
                className="mt-6 inline-flex items-center text-sm text-gold hover:underline"
              >
                See all open roles →
              </Link>
            </div>
          )}
        </Section>
      )}

      {/* ================================ Values ================================ */}
      <Section>
        <Eyebrow>What we hold to</Eyebrow>
        <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Four things we don&rsquo;t bend on.</h2>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Not aspirations — the rules we actually use to decide what to build and what to turn down.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-xl border border-border bg-surface/60 p-6 transition hover:border-gold/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                <v.icon className="h-5 w-5 text-gold" />
              </div>
              <h3 className="mt-4 font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================ Operating model =========================== */}
      <Section>
        <Eyebrow>Operating model</Eyebrow>
        <h2 className="mt-5 text-3xl font-bold sm:text-4xl">How the six divisions connect.</h2>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Each division is independently focused but operationally unified. Shared AI, shared data,
          shared design, and one portal — Apex — coordinating all of it.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OPERATING_MODEL.map(([t, d]) => (
            <div key={t} className="rounded-xl border border-border bg-surface/60 p-6">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DIVISION_LINKS.map((d) => (
            <Link
              key={d.to}
              to={d.to}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 px-5 py-4 transition hover:border-gold/40"
            >
              <span className="flex items-center gap-3">
                <d.icon className="h-4 w-4 text-gold" />
                <span className="text-sm font-medium">UIG {d.name}</span>
              </span>
              <span className="text-xs text-muted-foreground group-hover:text-gold">Open →</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* =============================== Presence =============================== */}
      <Section>
        <Eyebrow>Where we operate</Eyebrow>
        <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Lagos first. Nigeria-wide.</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {PRESENCE.map((p) => (
            <div key={p.city} className="rounded-xl border border-border bg-surface/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                {p.city === "Field operations" ? (
                  <Building2 className="h-5 w-5 text-gold" />
                ) : (
                  <MapPin className="h-5 w-5 text-gold" />
                )}
              </div>
              <h3 className="mt-4 font-semibold">{p.city}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Enquiries from anywhere:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>

      <Section>
        <div className="grid grid-cols-2 gap-6 rounded-2xl border border-border bg-surface p-10 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-3xl font-bold text-gradient-gold sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </Section>

      <CTABand
        title="Want to work with UIG?"
        subtitle="Tell us about your sector, your problem, or your idea."
      />
    </SiteLayout>
  );
}
