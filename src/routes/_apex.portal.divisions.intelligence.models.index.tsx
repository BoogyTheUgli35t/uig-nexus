import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Gauge, Zap, Cpu } from "lucide-react";
import { toast } from "sonner";
import {
  getIntelligenceWorkspace,
  createModel,
  advanceModel,
  MODEL_LIFECYCLE,
} from "@/lib/intelligence.functions";
import { authHeaders } from "@/lib/auth-headers";
import { EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/divisions/intelligence/models/")({
  head: () => ({ meta: [{ title: "Models — UIG Intelligence" }] }),
  component: ModelsPage,
});

const LIFECYCLE_COLUMNS: { key: (typeof MODEL_LIFECYCLE)[number]; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "training", label: "Training" },
  { key: "trained", label: "Evaluated" },
  { key: "deployed", label: "Deployed" },
  { key: "monitoring", label: "Monitoring" },
];

const NEXT_LABEL: Record<string, string> = {
  draft: "Start training",
  training: "Evaluate",
  trained: "Deploy",
  deployed: "Monitor",
};

function ModelsPage() {
  const qc = useQueryClient();
  const [modelName, setModelName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["intelligence-workspace"],
    queryFn: async () => getIntelligenceWorkspace({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["intelligence-workspace"] });

  const modelMut = useMutation({
    mutationFn: async () =>
      createModel({ data: { name: modelName }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Model created");
      setModelName("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const advanceMut = useMutation({
    mutationFn: async (id: string) => advanceModel({ data: { id }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const datasetName = useMemo(() => {
    const m = new Map<string, string>();
    (data?.datasets ?? []).forEach((d) => m.set(d.id, d.name));
    return m;
  }, [data]);

  const modelsByStage = useMemo(() => {
    const m = new Map<string, NonNullable<typeof data>["models"]>();
    LIFECYCLE_COLUMNS.forEach((c) => m.set(c.key, []));
    (data?.models ?? []).forEach((mo) => {
      if (!m.has(mo.status)) m.set(mo.status, []);
      m.get(mo.status)!.push(mo);
    });
    return m;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Model lifecycle</h2>
          <p className="text-sm text-muted-foreground">
            Upload → Train → Evaluate → Deploy → Monitor.
          </p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (modelName.trim()) modelMut.mutate();
          }}
        >
          <Input
            placeholder="New model name"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            maxLength={180}
            className="w-56"
          />
          <Button
            type="submit"
            disabled={!modelName.trim() || modelMut.isPending}
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" /> Create
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading models…</div>
      ) : (data?.models.length ?? 0) === 0 ? (
        <EmptyState icon={Cpu} title="No models yet" description="Create your first model above." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LIFECYCLE_COLUMNS.map((col) => {
            const items = modelsByStage.get(col.key) ?? [];
            return (
              <div key={col.key} className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center justify-between px-1 pb-2 text-xs font-medium text-muted-foreground">
                  <span>{col.label}</span>
                  <span>{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border py-4 text-center text-[11px] text-muted-foreground">
                      Empty
                    </div>
                  ) : (
                    items.map((mo) => (
                      <div
                        key={mo.id}
                        className="rounded-lg border border-border bg-background p-3"
                      >
                        <Link
                          to="/portal/divisions/intelligence/models/$id"
                          params={{ id: mo.id }}
                          className="flex items-center justify-between gap-2 hover:acc-text"
                        >
                          <span className="text-sm font-medium leading-snug">{mo.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {mo.version}
                          </span>
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                          <span className="capitalize">{mo.model_type}</span>
                          <span>· {mo.target_division}</span>
                        </div>
                        {mo.accuracy > 0 && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] acc-text">
                            <Gauge className="h-3 w-3" /> {Number(mo.accuracy).toFixed(1)}% acc
                          </div>
                        )}
                        {mo.dataset_id && (
                          <div className="mt-1 truncate text-[10px] text-muted-foreground">
                            {datasetName.get(mo.dataset_id) ?? "—"}
                          </div>
                        )}
                        {NEXT_LABEL[mo.status] && (
                          <button
                            type="button"
                            onClick={() => advanceMut.mutate(mo.id)}
                            disabled={advanceMut.isPending}
                            className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded border border-border px-1.5 py-1 text-[10px] text-muted-foreground transition hover:acc-border-soft hover:text-foreground"
                          >
                            <Zap className="h-3 w-3" /> {NEXT_LABEL[mo.status]}
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
