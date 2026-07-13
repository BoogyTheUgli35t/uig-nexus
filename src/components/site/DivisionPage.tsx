import type { ComponentType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section, Eyebrow, CTABand, FeatureCard } from "@/components/site/sections";
import { getDivision, type DivisionSlug } from "@/lib/divisions";

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

      <CTABand title={props.ctaTitle} buttonText={props.ctaButton} />
    </SiteLayout>
  );
}
