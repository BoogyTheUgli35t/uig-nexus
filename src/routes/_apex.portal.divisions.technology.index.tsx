import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  Rocket,
  CheckSquare,
  Plug,
  AlertTriangle,
  Wallet,
  ArrowRight,
  Plus,
} from "lucide-react";
import { getTechWorkspace } from "@/lib/tech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { KpiStat, DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";

export const Route = createFileRoute("/_apex/portal/divisions/technology/")({
  component: TechnologyOverview,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

function TechnologyOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["tech-workspace"],
    queryFn: async () => getTechWorkspace({ headers: await authHeaders() }),
  });

  const stats = data?.stats;
  const recent = (data?.projects ?? []).slice(0, 5);

  return (
    <div className="space-y-8">
      {((stats?.slaAtRisk ?? 0) > 0 || (stats?.overdueTasks ?? 0) > 0) && (
        <div className="flex flex-wrap gap-3">
          {(stats?.slaAtRisk ?? 0) > 0 && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {stats!.slaAtRisk} project{stats!.slaAtRisk > 1 ? "s" : ""} at risk of missing SLA
            </div>
          )}
          {(stats?.overdueTasks ?? 0) > 0 && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm text-gold">
              <AlertTriangle className="h-4 w-4" />
              {stats!.overdueTasks} overdue task{stats!.overdueTasks > 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={FolderKanban} label="Active projects" value={stats?.activeProjects ?? "—"} />
        <KpiStat icon={Rocket} label="Live products" value={stats?.liveProjects ?? "—"} />
        <KpiStat
          icon={CheckSquare}
          label="Open tasks"
          value={stats?.openTasks ?? "—"}
          hint={stats?.overdueTasks ? `${stats.overdueTasks} overdue` : undefined}
        />
        <KpiStat icon={Plug} label="Integrations" value={stats?.connectedIntegrations ?? "—"} hint="connected" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4 acc-text" /> Outstanding invoices
          </div>
          <div className="mt-2 text-2xl font-display font-bold">
            {stats ? naira(stats.outstandingRevenue) : "—"}
          </div>
        </div>
        <Link
          to="/portal/divisions/technology/automation"
          className="rounded-xl border border-border bg-surface p-5 hover:acc-border-soft transition"
        >
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            Automation rules <ArrowRight className="h-4 w-4" />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">Manage triggers &amp; actions</div>
        </Link>
      </div>

      <DataPanel
        title="Recent projects"
        action={{ to: "/portal/divisions/technology/projects", label: "View all" }}
      >
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : recent.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No projects yet" description="Start your first engagement." />
        ) : (
          <div className="divide-y divide-border">
            {recent.map((p) => (
              <Link
                key={p.id}
                to="/portal/divisions/technology/projects/$id"
                params={{ id: p.id }}
                className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-foreground"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.client_name || "Internal"}</div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Link
            to="/portal/divisions/technology/projects/new"
            className="inline-flex items-center gap-1.5 text-sm acc-text hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> New engagement
          </Link>
        </div>
      </DataPanel>
    </div>
  );
}
