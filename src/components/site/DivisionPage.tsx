import type { ComponentType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, Eyebrow, CTABand, FeatureCard } from "@/components/site/sections";
import { getDivision, DIVISIONS, type DivisionSlug } from "@/lib/divisions";

/** Public marketing routes for each division, typed as literals so Link stays type-safe. */
const DIVISION_ROUTES = [
  { slug: "technology", to: "/divisions/technology" },
  { slug: "agritech", to: "/divisions/agritech" },
  { slug: "real-estate", to: "/divisions/real-estate" },
  { slug: "logistics", to: "/divisions/logistics" },
  { slug: "intelligence", to: "/divisions/intelligence" },
  { slug: "innovation-lab", to: "/divisions/innovation-lab" },
] as const;

export type DivisionPageProps = {
  slug?: DivisionSlug;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  problem?: { title: string; points: string[] };
  solutions: {
    title: string;
    description: string;
    icon?: LucideIcon | ComponentType<{ className?: string }>;
  }[];
  process?: { title: string; steps: { name: string; description: string }[] };
  why?: { title: string; points: string[] };
  outcome?: string;
  extra?: { title: string; items: { name: string; description: string }[] };
  realtime?: string[];
  targetClients?: string[];
  metrics?: { value: string; label: string }[];
  ctaTitle: string;
  ctaButton: string;
  ctaTo?: string;
  browseCta?: { title: string; description: string; buttonText: string; to: string };
  tool?: { eyebrow: string; title: string; description?: string; component: ReactNode };
  caseStudies?: {
    eyebrow: string;
    title: string;
    note?: string;
    items: {
      client: string;
      industry: string;
      challenge: string;
      solution: string;
      result: string;
      metric: string;
    }[];
  };
};

export function DivisionPage(props: DivisionPageProps) {
  const division = props.slug ? getDivision(props.slug) : undefined;
  return (
    <SiteLayout>
      <PageHero
        eyebrow={props.eyebrow}
        title={props.title}
        subtitle={props.subtitle}
        image={division?.hero}
      />

      {division && division.gallery.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 border-b border-border">
          {division.gallery.map((src) => (
            <div key={src} className="group aspect-[4/3] overflow-hidden bg-surface">
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      )}

      {props.browseCta && (
        <Section className="!py-14">
          <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-surface p-8 sm:p-10 glow-border">
            <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div>
                <h3 className="text-2xl font-bold">{props.browseCta.title}</h3>
                <p className="mt-2 text-muted-foreground max-w-xl">{props.browseCta.description}</p>
              </div>
              <Link
                to={props.browseCta.to}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gold px-6 py-3 font-semibold text-gold-foreground shadow-gold transition hover:bg-gold/90"
              >
                {props.browseCta.buttonText} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Section>
      )}

      {props.problem && (
        <Section>
          <Eyebrow>The problem</Eyebrow>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold max-w-3xl">{props.problem.title}</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 max-w-3xl text-muted-foreground">
            {props.problem.points.map((p) => (
              <li key={p} className="flex gap-3 items-start">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section>
        <Eyebrow>What we deliver</Eyebrow>
        <h2 className="mt-5 text-3xl sm:text-4xl font-bold">Solutions, end to end.</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {props.solutions.map((s) => {
            const Icon = s.icon;
            return (
              <FeatureCard
                key={s.title}
                title={s.title}
                description={s.description}
                icon={Icon ? <Icon className="h-5 w-5" /> : null}
              />
            );
          })}
        </div>
        {props.outcome && (
          <div className="mt-10 rounded-xl border border-gold/30 bg-gold/5 p-6">
            <div className="text-xs uppercase tracking-wider text-gold">Outcome</div>
            <p className="mt-2 text-lg text-foreground leading-relaxed">{props.outcome}</p>
          </div>
        )}
      </Section>

      {props.tool && (
        <Section className="!pt-0">
          <Eyebrow>{props.tool.eyebrow}</Eyebrow>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold max-w-2xl">{props.tool.title}</h2>
          {props.tool.description && (
            <p className="mt-3 text-muted-foreground max-w-2xl">{props.tool.description}</p>
          )}
          <div className="mt-8 max-w-2xl">{props.tool.component}</div>
        </Section>
      )}

      {props.caseStudies && (
        <Section className="!pt-0">
          <Eyebrow>{props.caseStudies.eyebrow}</Eyebrow>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold max-w-2xl">
            {props.caseStudies.title}
          </h2>
          {props.caseStudies.note && (
            <p className="mt-3 text-xs text-muted-foreground max-w-2xl">{props.caseStudies.note}</p>
          )}
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {props.caseStudies.items.map((cs) => (
              <div
                key={cs.client}
                className="flex flex-col rounded-xl border border-border bg-surface/60 p-6"
              >
                <div className="text-xs uppercase tracking-wider text-gold">{cs.industry}</div>
                <h3 className="mt-1.5 font-display text-lg font-semibold">{cs.client}</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Challenge</dt>
                    <dd className="mt-1 text-muted-foreground">{cs.challenge}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">What we built</dt>
                    <dd className="mt-1 text-muted-foreground">{cs.solution}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Result</dt>
                    <dd className="mt-1 text-muted-foreground">{cs.result}</dd>
                  </div>
                </dl>
                <div className="mt-5 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-center">
                  <span className="text-lg font-bold text-gradient-gold">{cs.metric}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {props.process && (
        <Section>
          <Eyebrow>How we work</Eyebrow>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold">{props.process.title}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {props.process.steps.map((s, i) => (
              <div
                key={s.name}
                className="relative rounded-xl border border-border bg-surface/60 p-5"
              >
                <div className="text-xs font-semibold text-gold">0{i + 1}</div>
                <h3 className="mt-2 font-semibold">{s.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {props.why && (
        <Section>
          <Eyebrow>Why this division</Eyebrow>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold">{props.why.title}</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 max-w-3xl">
            {props.why.points.map((p) => (
              <li key={p} className="flex gap-3 items-start text-muted-foreground">
                <Check className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {props.extra && (
        <Section>
          <h2 className="text-3xl sm:text-4xl font-bold">{props.extra.title}</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {props.extra.items.map((i) => (
              <div key={i.name} className="rounded-xl border border-border bg-surface/60 p-6">
                <h3 className="font-semibold">{i.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{i.description}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {props.realtime && props.realtime.length > 0 && (
        <Section>
          <Eyebrow>Real-time capabilities</Eyebrow>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold">Live, always on.</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 max-w-4xl">
            {props.realtime.map((r) => (
              <li
                key={r}
                className="flex gap-3 items-start rounded-lg border border-border bg-surface/40 p-4 text-sm"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                <span className="text-muted-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {props.targetClients && props.targetClients.length > 0 && (
        <Section>
          <Eyebrow>Who we serve</Eyebrow>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold">Built for serious operators.</h2>
          <div className="mt-8 flex flex-wrap gap-2 max-w-4xl">
            {props.targetClients.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        </Section>
      )}

      {props.metrics && props.metrics.length > 0 && (
        <Section>
          <Eyebrow>By the numbers</Eyebrow>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {props.metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-gold/20 bg-gold/5 p-6">
                <div className="text-3xl font-bold text-gradient-gold">{m.value}</div>
                <div className="mt-2 text-xs text-muted-foreground uppercase tracking-wider">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {props.slug && (
        <Section className="!pt-0">
          <Eyebrow>One group, six divisions</Eyebrow>
          <h2 className="mt-5 text-3xl sm:text-4xl font-bold">Explore the rest of UIG.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIVISION_ROUTES.filter((r) => r.slug !== props.slug).map((r) => {
              const d = DIVISIONS.find((x) => x.slug === r.slug);
              if (!d) return null;
              return (
                <Link
                  key={d.slug}
                  to={r.to}
                  className={`${d.accentClass} group relative overflow-hidden rounded-xl border border-border bg-surface/60 p-5 transition hover:acc-border-soft hover:bg-surface`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg acc-bg-soft acc-text">
                      <d.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold">{d.short}</div>
                      <div className="truncate text-xs text-muted-foreground">{d.tagline}</div>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition group-hover:acc-text" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      <CTABand
        title={props.ctaTitle}
        buttonText={props.ctaButton}
        {...(props.ctaTo ? { buttonTo: props.ctaTo } : {})}
      />
    </SiteLayout>
  );
}
