import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CloudSun, TrendingUp, Gauge, Sparkles } from "lucide-react";
import { getAgriWorkspace } from "@/lib/agritech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { KpiStat, DataPanel, EmptyState } from "@/components/portal/blocks";

export const Route = createFileRoute("/_apex/portal/divisions/agritech/predictions")({
  head: () => ({ meta: [{ title: "Yield predictions — UIG AgriTech" }] }),
  component: PredictionsPage,
});

function PredictionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["agri-workspace"],
    queryFn: async () => getAgriWorkspace({ headers: await authHeaders() }),
  });

  const fields = data?.fields ?? [];
  const predictions = data?.predictions ?? [];
  const fieldById = new Map(fields.map((f) => [f.id, f]));

  const bySeason = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of predictions) {
      m.set(p.season, (m.get(p.season) ?? 0) + Number(p.predicted_yield_tons ?? 0));
    }
    return Array.from(m.entries()).map(([season, tons]) => ({ season, tons: Math.round(tons * 10) / 10 }));
  }, [predictions]);

  const totalTons = predictions.reduce((s, p) => s + Number(p.predicted_yield_tons ?? 0), 0);
  const avgConfidence = predictions.length
    ? Math.round(predictions.reduce((s, p) => s + Number(p.confidence ?? 0), 0) / predictions.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={CloudSun} label="Predictions" value={isLoading ? "—" : predictions.length} hint="across all fields" />
        <KpiStat icon={TrendingUp} label="Forecast total" value={isLoading ? "—" : `${Math.round(totalTons * 10) / 10}t`} hint="predicted yield" />
        <KpiStat icon={Gauge} label="Avg confidence" value={isLoading ? "—" : `${avgConfidence}%`} hint="model certainty" />
        <KpiStat icon={Sparkles} label="Seasons" value={isLoading ? "—" : bySeason.length} hint="under forecast" />
      </div>

      <DataPanel
        title="Predicted yield by season (tonnes)"
        action={
          <Link
            to="/portal/divisions/intelligence/assistant"
            search={{ ask: "Looking at UIG AgriTech's yield forecast, what should we watch for next season?" }}
            className="text-sm acc-text hover:underline"
          >
            Ask Intelligence AI
          </Link>
        }
      >
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading predictions…</div>
        ) : bySeason.length === 0 ? (
          <EmptyState icon={CloudSun} title="No predictions yet" description="Run a yield model from UIG Intelligence to populate forecasts." />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySeason}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="season" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="tons" fill="var(--acc)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </DataPanel>

      <DataPanel title="Per-field forecasts">
        {predictions.length === 0 ? (
          <EmptyState icon={TrendingUp} title="Nothing forecast yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Field</th>
                  <th className="py-2 pr-4 font-medium">Crop</th>
                  <th className="py-2 pr-4 font-medium">Season</th>
                  <th className="py-2 pr-4 font-medium">Predicted yield</th>
                  <th className="py-2 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => {
                  const field = fieldById.get(p.field_id);
                  const conf = Number(p.confidence ?? 0);
                  return (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-4">
                        {field ? (
                          <Link
                            to="/portal/divisions/agritech/fields/$id"
                            params={{ id: field.id }}
                            className="font-medium hover:acc-text"
                          >
                            {field.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{field?.crop ?? "—"}</td>
                      <td className="py-2.5 pr-4">{p.season}</td>
                      <td className="py-2.5 pr-4 font-medium">
                        {Number(p.predicted_yield_tons).toFixed(1)}t
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-muted">
                            <div className="h-1.5 rounded-full acc-bg" style={{ width: `${conf}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{conf}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataPanel>
    </div>
  );
}
