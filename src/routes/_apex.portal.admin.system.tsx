import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Users, TrendingUp, Layers } from "lucide-react";
import { getSystemHealth } from "@/lib/admin.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DIVISIONS } from "@/lib/divisions";
import { KpiStat, DataPanel } from "@/components/portal/blocks";

export const Route = createFileRoute("/_apex/portal/admin/system")({
  head: () => ({
    meta: [{ title: "System — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: SystemPage,
});

function SystemPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: async () => getSystemHealth({ headers: await authHeaders() }),
  });

  if (error) return <div className="text-destructive text-sm">{(error as Error).message}</div>;

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <p className="text-sm text-gold uppercase tracking-wider">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">System oversight</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Company-wide health across every division.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          icon={Users}
          label="Total accounts"
          value={isLoading ? "—" : (data?.totalUsers ?? 0)}
        />
        <KpiStat
          icon={TrendingUp}
          label="Signups (7d)"
          value={isLoading ? "—" : (data?.signupsLast7 ?? 0)}
        />
        <KpiStat
          icon={TrendingUp}
          label="Signups (30d)"
          value={isLoading ? "—" : (data?.signupsLast30 ?? 0)}
        />
        <KpiStat icon={Layers} label="Active divisions" value={DIVISIONS.length} />
      </div>

      <DataPanel title="Users by division">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DIVISIONS.map((d) => (
              <div
                key={d.slug}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
              >
                <div className="flex items-center gap-2 text-sm">
                  <d.icon className="h-4 w-4 text-gold" />
                  {d.name}
                </div>
                <span className="text-lg font-semibold">{data?.usersByDivision[d.slug] ?? 0}</span>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      <DataPanel title="Users by role">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(data?.usersByRole ?? {}).map(([role, count]) => (
              <span
                key={role}
                className="rounded-full border border-border px-3 py-1 text-xs capitalize text-muted-foreground"
              >
                {role}: <span className="font-medium text-foreground">{count as number}</span>
              </span>
            ))}
          </div>
        )}
      </DataPanel>

      <DataPanel title="Division activity (row counts)">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-4">
            {DIVISIONS.map((d) => {
              const stats = data?.divisionStats[d.slug];
              if (!stats) return null;
              return (
                <div key={d.slug} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-medium">
                      <d.icon className="h-4 w-4 text-gold" />
                      {d.name}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      <Activity className="inline h-3.5 w-3.5 mr-1" />
                      {stats.total.toLocaleString()} rows
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.tables).map(([t, c]) => (
                      <span
                        key={t}
                        className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {t}:{" "}
                        <span className="text-foreground">{(c as number).toLocaleString()}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
