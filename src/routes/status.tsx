import { createFileRoute, redirect } from "@tanstack/react-router";
import { FLAGS } from "@/lib/flags";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, AlertOctagon, Activity } from "lucide-react";
import { getSystemStatus } from "@/lib/public-status.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero, Section } from "@/components/site/sections";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/status")({
  // Gated by VITE_FLAG_STATUS_PAGE. A status page that itself is broken or
  // reporting nonsense is worse than none, so it can be pulled without a
  // code change.
  beforeLoad: () => {
    if (!FLAGS.statusPage) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "System Status — UIG" },
      {
        name: "description",
        content:
          "Live status for UIG's web platform, portal, listings, payments and logistics API.",
      },
    ],
  }),
  component: StatusPage,
});

const STATUS_META: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  operational: { label: "Operational", color: "text-emerald-400", icon: CheckCircle2 },
  degraded: { label: "Degraded performance", color: "text-amber-400", icon: Activity },
  partial_outage: { label: "Partial outage", color: "text-amber-400", icon: AlertTriangle },
  major_outage: { label: "Major outage", color: "text-destructive", icon: AlertOctagon },
};

const OVERALL_META: Record<string, { label: string; className: string }> = {
  operational: {
    label: "All systems operational",
    className: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  },
  degraded: {
    label: "Degraded performance on some services",
    className: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  },
  partial_outage: {
    label: "Partial outage affecting some services",
    className: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  },
  major_outage: {
    label: "Major outage — we're on it",
    className: "border-destructive/30 bg-destructive/5 text-destructive",
  },
};

function StatusPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-system-status"],
    queryFn: () => getSystemStatus(),
  });

  const overall = OVERALL_META[data?.overall ?? "operational"];

  return (
    <SiteLayout>
      <PageHero
        eyebrow="UIG Technology"
        title={<>System status.</>}
        subtitle="Live status for the platforms UIG runs — updated by the Technology team, not a marketing claim."
      />

      <Section className="!py-14">
        {isLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-surface/60 border border-border" />
        ) : (
          <div className={cn("flex items-center gap-3 rounded-xl border p-5", overall.className)}>
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <span className="text-lg font-semibold">{overall.label}</span>
          </div>
        )}

        <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface/60">
          {isLoading ? (
            <div className="p-5 text-sm text-muted-foreground">Loading…</div>
          ) : (
            data?.components.map((c) => {
              const meta = STATUS_META[c.status] ?? STATUS_META.operational;
              const Icon = meta.icon;
              return (
                <div key={c.id} className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.description && (
                      <div className="mt-0.5 text-xs text-muted-foreground">{c.description}</div>
                    )}
                  </div>
                  <div className={cn("flex items-center gap-1.5 text-sm font-medium", meta.color)}>
                    <Icon className="h-4 w-4" /> {meta.label}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold">Incident history</h2>
          {!isLoading && (data?.incidents.length ?? 0) === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              No incidents reported. This page will list them here the moment something goes wrong.
            </p>
          )}
          {(data?.incidents.length ?? 0) > 0 && (
            <div className="mt-4 space-y-4">
              {data?.incidents.map((inc) => (
                <div key={inc.id} className="rounded-xl border border-border bg-surface/60 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{inc.title}</h3>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
                        inc.status === "resolved"
                          ? "border-emerald-500/30 text-emerald-400"
                          : "border-amber-500/30 text-amber-400",
                      )}
                    >
                      {inc.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  {inc.body && <p className="mt-2 text-sm text-muted-foreground">{inc.body}</p>}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Reported {new Date(inc.created_at).toLocaleString("en-NG")}
                    {inc.resolved_at &&
                      ` · Resolved ${new Date(inc.resolved_at).toLocaleString("en-NG")}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>
    </SiteLayout>
  );
}
