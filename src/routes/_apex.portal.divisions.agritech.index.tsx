import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, MapPinned, Sprout, Activity, CloudSun, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getAgriWorkspace } from "@/lib/agritech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, KpiStat } from "@/components/portal/blocks";

export const Route = createFileRoute("/_apex/portal/divisions/agritech/")({
  component: AgritechOverview,
});

function AgritechOverview() {
  const { data } = useQuery({
    queryKey: ["agri-workspace"],
    queryFn: async () => getAgriWorkspace({ headers: await authHeaders() }),
  });

  const stats = data?.stats;

  const yieldBySeason = (() => {
    const m = new Map<string, number>();
    (data?.predictions ?? []).forEach((p) => {
      m.set(p.season, (m.get(p.season) ?? 0) + Number(p.predicted_yield_tons));
    });
    return Array.from(m.entries()).map(([season, tons]) => ({
      season,
      tons: Math.round(tons * 10) / 10,
    }));
  })();

  const openAlerts = (data?.alerts ?? []).filter((a) => !a.acknowledged).slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Users} label="Farmers" value={stats?.farmers ?? "—"} />
        <KpiStat icon={MapPinned} label="Fields monitored" value={stats?.fields ?? "—"} />
        <KpiStat icon={Sprout} label="Hectares" value={stats?.totalHectares ?? "—"} />
        <KpiStat
          icon={Activity}
          label="Avg. field health"
          value={stats ? `${stats.avgHealth}%` : "—"}
          hint={`${stats?.atRiskFields ?? 0} need attention`}
        />
      </div>

      {openAlerts.length > 0 && (
        <DataPanel title="Open alerts" action={{ to: "/portal/divisions/agritech/alerts", label: "View all" }}>
          <div className="space-y-2">
            {openAlerts.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        </DataPanel>
      )}

      <DataPanel
        title="AI yield forecast (tonnes by season)"
        action={
          <Link
            to="/portal/divisions/intelligence"
            search={{ ask: "Looking at UIG AgriTech's yield forecast, what should we watch for next season?" }}
            className="text-sm text-gold hover:underline"
          >
            Ask Intelligence AI
          </Link>
        }
      >
        {yieldBySeason.length === 0 ? (
          <EmptyState icon={CloudSun} title="No predictions yet" />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yieldBySeason} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="season"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "color-mix(in oklab, var(--muted) 30%, transparent)" }}
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="tons" radius={[6, 6, 0, 0]} fill="var(--acc, var(--gold))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DataPanel>

      <DataPanel title="Recent farmers" action={{ to: "/portal/divisions/agritech/farmers", label: "View all" }}>
        {(data?.farmers.length ?? 0) === 0 ? (
          <EmptyState icon={Users} title="No farmers onboarded yet" />
        ) : (
          <div className="divide-y divide-border">
            {(data?.farmers ?? []).slice(0, 6).map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span>{f.full_name}</span>
                <span className="text-xs text-muted-foreground">{f.cooperative ?? "—"}</span>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
