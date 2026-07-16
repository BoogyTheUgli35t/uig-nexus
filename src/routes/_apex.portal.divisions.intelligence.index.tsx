import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, Database, Rocket, Gauge, Cpu, Layers, ArrowRight } from "lucide-react";
import { getIntelligenceWorkspace, MODEL_LIFECYCLE } from "@/lib/intelligence.functions";
import { authHeaders } from "@/lib/auth-headers";
import { KpiStat, DataPanel, EmptyState } from "@/components/portal/blocks";

export const Route = createFileRoute("/_apex/portal/divisions/intelligence/")({
  component: IntelligenceOverview,
});

const STAGE_LABELS: Record<(typeof MODEL_LIFECYCLE)[number], string> = {
  draft: "Draft",
  training: "Training",
  trained: "Evaluated",
  deployed: "Deployed",
  monitoring: "Monitoring",
};

function IntelligenceOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence-workspace"],
    queryFn: async () => getIntelligenceWorkspace({ headers: await authHeaders() }),
  });

  const stats = data?.stats;
  const models = data?.models ?? [];
  const modelName = new Map(models.map((m) => [m.id, m.name]));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Cpu} label="Models" value={stats?.models ?? "—"} hint={`${stats?.deployed ?? 0} in production`} />
        <KpiStat icon={Gauge} label="Avg accuracy" value={stats ? `${stats.avgAccuracy}%` : "—"} hint="across trained models" />
        <KpiStat icon={Database} label="Datasets" value={stats?.datasets ?? "—"} hint={`${(stats?.totalRows ?? 0).toLocaleString()} rows`} />
        <KpiStat icon={Rocket} label="Deployed" value={stats?.deployed ?? "—"} hint="live & monitored" />
      </div>

      <DataPanel
        title="Model health"
        action={
          <Link to="/portal/divisions/intelligence/models" className="inline-flex items-center gap-1 text-sm acc-text hover:underline">
            Model lifecycle <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading models…</div>
        ) : models.length === 0 ? (
          <EmptyState icon={Cpu} title="No models yet" description="Create your first model from the Models tab." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {MODEL_LIFECYCLE.map((stage) => {
              const count = models.filter((m) => m.status === stage).length;
              return (
                <div key={stage} className="rounded-lg border border-border bg-background p-3 text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{STAGE_LABELS[stage]}</div>
                </div>
              );
            })}
          </div>
        )}
      </DataPanel>

      <DataPanel
        title="Recent runs"
        action={
          <Link to="/portal/divisions/intelligence/assistant" className="inline-flex items-center gap-1 text-sm acc-text hover:underline">
            Run a prediction <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {(data?.predictions.length ?? 0) === 0 ? (
          <EmptyState icon={Layers} title="No predictions yet" description="Run a live prediction from the Assistant tab." />
        ) : (
          <div className="space-y-3">
            {(data?.predictions ?? []).slice(0, 8).map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <BrainCircuit className="h-3 w-3" />
                    {p.model_id ? (modelName.get(p.model_id) ?? "Model") : "General model"}
                  </span>
                  <span className="text-[11px] acc-text">{Number(p.confidence).toFixed(0)}%</span>
                </div>
                <div className="mt-1 text-xs font-medium leading-snug">{p.prompt}</div>
                {p.result && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.result}</p>}
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
