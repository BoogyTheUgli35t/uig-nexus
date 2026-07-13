import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Home, Wallet, Kanban } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getRealEstateReports, LEAD_STAGES } from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, KpiStat } from "@/components/portal/blocks";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/reports")({
  component: ReportsPage,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

const PIE_COLORS = [
  "var(--acc, var(--gold))",
  "#6366f1",
  "#22c55e",
  "#f97316",
  "#ec4899",
  "#64748b",
];

function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["realestate-reports"],
    queryFn: async () => getRealEstateReports({ headers: await authHeaders() }),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading reports…</div>;
  if (!data) return <EmptyState icon={BarChart3} title="No data yet" />;

  const statusData = Object.entries(data.byStatus).map(([status, count]) => ({
    name: status.replace(/_/g, " "),
    value: count,
  }));

  const pipelineData = data.pipeline.stages.map((s) => ({
    name: s.stage.replace(/_/g, " "),
    count: s.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Reports</h2>
        <p className="text-sm text-muted-foreground">Occupancy, revenue and pipeline health.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          icon={Home}
          label="Occupancy rate"
          value={
            data.occupancy.occupancyRate !== null ? `${data.occupancy.occupancyRate}%` : "—"
          }
          hint={`${data.occupancy.occupiedUnits}/${data.occupancy.totalUnits} units`}
        />
        <KpiStat icon={Wallet} label="Monthly rent roll" value={naira(data.revenue.monthlyRent)} />
        <KpiStat icon={Wallet} label="Overdue rent" value={data.revenue.overdueRent} hint="tenants" />
        <KpiStat
          icon={Kanban}
          label="Lead conversion"
          value={`${data.pipeline.conversionRate}%`}
          hint={`${data.pipeline.closedLeads}/${data.pipeline.totalLeads} closed`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataPanel title="Properties by status">
          {statusData.length === 0 ? (
            <EmptyState icon={Home} title="No properties yet" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </DataPanel>

        <DataPanel title="Sales pipeline">
          {pipelineData.every((p) => p.count === 0) ? (
            <EmptyState icon={Kanban} title="No leads yet" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
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
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="var(--acc, var(--gold))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DataPanel>
      </div>

      <DataPanel title="Portfolio value by city">
        {data.topCities.length === 0 ? (
          <EmptyState icon={Wallet} title="No properties yet" />
        ) : (
          <div className="space-y-2">
            {data.topCities.map((c) => (
              <div key={c.city} className="flex items-center justify-between text-sm">
                <span>{c.city}</span>
                <span className="font-medium acc-text">{naira(c.value)}</span>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
