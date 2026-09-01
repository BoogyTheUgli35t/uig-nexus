import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gauge, Zap, Send, Sparkles, BrainCircuit, BarChart3, Cpu } from "lucide-react";
import { toast } from "sonner";
import {
  getIntelligenceWorkspace,
  advanceModel,
  runPrediction,
} from "@/lib/intelligence.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_apex/portal/divisions/intelligence/models/$id")({
  head: () => ({ meta: [{ title: "Model detail — UIG Intelligence" }] }),
  component: ModelDetailPage,
});

const NEXT_LABEL: Record<string, string> = {
  draft: "Start training",
  training: "Evaluate",
  trained: "Deploy",
  deployed: "Monitor",
};

/** Deterministic, clearly-illustrative "feature importance" bars — no real
 * training happens in this build, so these are seeded from the model id. */
function seededImportances(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return (h % 1000) / 1000;
  };
  const labels = ["Seasonality", "Historical trend", "External signals", "Data recency"];
  return labels
    .map((label) => ({ label, value: Math.round((0.25 + rand() * 0.75) * 100) }))
    .sort((a, b) => b.value - a.value);
}

function ModelDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [predPrompt, setPredPrompt] = useState("");
  const [predResult, setPredResult] = useState<{ result: string; confidence: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["intelligence-workspace"],
    queryFn: async () => getIntelligenceWorkspace({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["intelligence-workspace"] });

  const advanceMut = useMutation({
    mutationFn: async () => advanceModel({ data: { id }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const predMut = useMutation({
    mutationFn: async () =>
      runPrediction({ data: { model_id: id, prompt: predPrompt }, headers: await authHeaders() }),
    onSuccess: (r) => {
      setPredResult(r);
      setPredPrompt("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const model = (data?.models ?? []).find((m) => m.id === id);
  const dataset = model?.dataset_id
    ? (data?.datasets ?? []).find((d) => d.id === model.dataset_id)
    : undefined;
  const modelPredictions = (data?.predictions ?? []).filter((p) => p.model_id === id);
  const canPredict = model && ["trained", "deployed", "monitoring"].includes(model.status);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading model…</div>;

  if (!model) {
    return (
      <div className="max-w-lg">
        <EmptyState icon={Cpu} title="Model not found" description="It may have been removed." />
        <Link
          to="/portal/divisions/intelligence/models"
          className="mt-4 inline-flex items-center gap-1.5 text-sm acc-text hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> All models
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/portal/divisions/intelligence/models"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All models
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{model.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="capitalize">{model.model_type}</span>
            <span>· {model.target_division}</span>
            <span className="font-mono text-xs">· {model.version}</span>
            <StatusBadge status={model.status} />
          </div>
        </div>
        {NEXT_LABEL[model.status] && (
          <Button
            onClick={() => advanceMut.mutate()}
            disabled={advanceMut.isPending}
            variant="outline"
          >
            <Zap className="mr-2 h-4 w-4" /> {NEXT_LABEL[model.status]}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataPanel title="Metrics">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" /> Accuracy
              </div>
              <div className="mt-1 text-2xl font-bold">
                {model.accuracy > 0 ? `${Number(model.accuracy).toFixed(1)}%` : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <BrainCircuit className="h-3.5 w-3.5" /> Predictions
              </div>
              <div className="mt-1 text-2xl font-bold">{modelPredictions.length}</div>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-border bg-background p-4 text-sm">
            <div className="text-xs text-muted-foreground">Training dataset</div>
            <div className="mt-1 font-medium">{dataset ? dataset.name : "None linked"}</div>
            {dataset && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                {dataset.rows_count.toLocaleString()} rows · {Number(dataset.size_mb)} MB
              </div>
            )}
          </div>
        </DataPanel>

        <DataPanel title="Explainability">
          <p className="mb-3 text-xs italic text-muted-foreground">
            Illustrative feature importance — no real training ran in this build.
          </p>
          <div className="space-y-3">
            {seededImportances(model.id).map((f) => (
              <div key={f.label}>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" /> {f.label}
                  </span>
                  <span>{f.value}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-1.5 rounded-full acc-bg" style={{ width: `${f.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </DataPanel>
      </div>

      <DataPanel title="Run prediction with this model">
        {canPredict ? (
          <>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (predPrompt.trim()) predMut.mutate();
              }}
            >
              <Textarea
                placeholder={`Ask ${model.name} — e.g. Forecast next quarter for ${model.target_division}.`}
                value={predPrompt}
                onChange={(e) => setPredPrompt(e.target.value)}
                maxLength={2000}
                rows={3}
              />
              <Button type="submit" disabled={!predPrompt.trim() || predMut.isPending}>
                <Send className="mr-2 h-4 w-4" />{" "}
                {predMut.isPending ? "Running…" : "Run prediction"}
              </Button>
            </form>
            {predResult && (
              <div className="mt-4 rounded-lg border acc-border-soft bg-background p-4">
                <div className="flex items-center gap-2 text-xs acc-text">
                  <Sparkles className="h-3.5 w-3.5" /> {predResult.confidence}% confidence
                </div>
                <p className="mt-2 text-sm leading-relaxed">{predResult.result}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            This model must reach the Evaluated stage before it can serve predictions. Use "
            {NEXT_LABEL[model.status] ?? "Advance"}" above to move it through the lifecycle.
          </p>
        )}
      </DataPanel>

      <DataPanel title={`Prediction history (${modelPredictions.length})`}>
        {modelPredictions.length === 0 ? (
          <EmptyState icon={BrainCircuit} title="No predictions from this model yet" />
        ) : (
          <div className="space-y-3">
            {modelPredictions.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium leading-snug">{p.prompt}</div>
                  <span className="shrink-0 text-[11px] acc-text">
                    {Number(p.confidence).toFixed(0)}%
                  </span>
                </div>
                {p.result && (
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.result}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
