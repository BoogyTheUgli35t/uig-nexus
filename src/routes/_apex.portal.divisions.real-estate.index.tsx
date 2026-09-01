import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Wallet,
  Home,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";
import { getRealEstateWorkspace, listPropertiesFiltered } from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { KpiStat, DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { resolveImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/")({
  component: RealEstateOverview,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

function coverUrl(path: string | null) {
  if (!path) return null;
  return resolveImageUrl("property-images", path);
}

function RealEstateOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["realestate-workspace"],
    queryFn: async () => getRealEstateWorkspace({ headers: await authHeaders() }),
  });

  const { data: previewProperties, isLoading: previewLoading } = useQuery({
    queryKey: ["realestate-properties-preview"],
    queryFn: async () => listPropertiesFiltered({ headers: await authHeaders(), data: {} }),
  });

  const stats = data?.stats;
  const allPreview = previewProperties ?? [];
  const featured = allPreview.filter((p) => p.featured).slice(0, 3);
  const preview = featured.length > 0 ? featured : allPreview.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Smart alerts */}
      {(stats?.newLeadsLast24h ?? 0) > 0 || (stats?.overdueFollowUps ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-3">
          {(stats?.newLeadsLast24h ?? 0) > 0 && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm text-gold">
              <Sparkles className="h-4 w-4" />
              {stats!.newLeadsLast24h} new lead{stats!.newLeadsLast24h > 1 ? "s" : ""} in the last
              24 hours
            </div>
          )}
          {(stats?.overdueFollowUps ?? 0) > 0 && (
            <Link
              to="/portal/divisions/real-estate/leads"
              className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive hover:bg-destructive/15"
            >
              <AlertTriangle className="h-4 w-4" />
              {stats!.overdueFollowUps} lead{stats!.overdueFollowUps > 1 ? "s" : ""} overdue for
              follow-up
            </Link>
          )}
        </div>
      ) : null}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          icon={Building2}
          label="Properties"
          value={stats?.properties ?? "—"}
          hint={`${stats?.available ?? 0} available`}
        />
        <KpiStat
          icon={Wallet}
          label="Portfolio value"
          value={stats ? naira(stats.portfolioValue) : "—"}
        />
        <KpiStat
          icon={Home}
          label="Monthly rent roll"
          value={stats ? naira(stats.monthlyRent) : "—"}
          hint={`${stats?.tenants ?? 0} tenants`}
        />
        <KpiStat
          icon={TrendingUp}
          label="Avg. investor ROI"
          value={stats ? `${stats.avgRoi}%` : "—"}
          hint={stats ? `${naira(stats.investorGain)} gains` : undefined}
        />
      </div>

      <DataPanel
        title="Featured & recent listings"
        action={{ to: "/portal/divisions/real-estate/properties", label: "View all" }}
      >
        {previewLoading ? (
          <div className="text-sm text-muted-foreground">Loading properties…</div>
        ) : preview.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="List your first property to get started."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {preview.map((p) => (
              <Link
                key={p.id}
                to="/portal/divisions/real-estate/properties/$id"
                params={{ id: p.id }}
                className="group rounded-xl border border-border bg-background overflow-hidden hover:acc-border-soft transition"
              >
                <div className="aspect-[4/3] bg-surface-elevated overflow-hidden">
                  {p.coverImagePath ? (
                    <img
                      src={coverUrl(p.coverImagePath)!}
                      alt={p.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Building2 className="h-8 w-8 opacity-30" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">{p.city || "—"}</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-2 text-sm font-semibold acc-text">
                    {naira(Number(p.price))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Link
            to="/portal/divisions/real-estate/properties/new"
            className="inline-flex items-center gap-1.5 text-sm acc-text hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> List a new property
          </Link>
        </div>
      </DataPanel>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          to="/portal/divisions/real-estate/leads"
          className="rounded-xl border border-border bg-surface p-5 hover:acc-border-soft transition"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Open leads</div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-display font-bold">{stats?.openLeads ?? "—"}</div>
        </Link>
        <Link
          to="/portal/divisions/real-estate/tenants"
          className="rounded-xl border border-border bg-surface p-5 hover:acc-border-soft transition"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Active tenants</div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-display font-bold">{stats?.tenants ?? "—"}</div>
        </Link>
        <Link
          to="/portal/divisions/real-estate/reports"
          className="rounded-xl border border-border bg-surface p-5 hover:acc-border-soft transition"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Full reports</div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Occupancy, revenue &amp; pipeline
          </div>
        </Link>
      </div>
    </div>
  );
}
