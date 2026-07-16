import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FlaskConical, BrainCircuit, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  getInnovationWorkspace,
  listExperiments,
  listLinkableModels,
  createExperiment,
  updateExperiment,
} from "@/lib/innovation.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_apex/portal/divisions/innovation-lab/experiments")({
  head: () => ({ meta: [{ title: "Experiments — UIG Innovation Lab" }] }),
  component: ExperimentsPage,
});

const EXPERIMENT_STATUSES = ["planned", "running", "concluded"] as const;

function ExperimentsPage() {
  const qc = useQueryClient();
  const [expHypothesis, setExpHypothesis] = useState("");
  const [expIdeaId, setExpIdeaId] = useState("");
  const [expModelId, setExpModelId] = useState("");
  const [resultDrafts, setResultDrafts] = useState<Record<string, string>>({});

  const { data: workspace } = useQuery({
    queryKey: ["innovation-workspace"],
    queryFn: async () => getInnovationWorkspace({ headers: await authHeaders() }),
  });

  const { data: experiments, isLoading } = useQuery({
    queryKey: ["innovation-experiments"],
    queryFn: async () => listExperiments({ headers: await authHeaders() }),
  });

  const { data: models } = useQuery({
    queryKey: ["innovation-linkable-models"],
    queryFn: async () => listLinkableModels({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["innovation-experiments"] });

  const createMut = useMutation({
    mutationFn: async () =>
      createExperiment({
        data: { hypothesis: expHypothesis, idea_id: expIdeaId, model_id: expModelId },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Experiment logged");
      setExpHypothesis("");
      setExpIdeaId("");
      setExpModelId("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (v: { id: string; status?: (typeof EXPERIMENT_STATUSES)[number]; result?: string }) =>
      updateExperiment({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const ideas = workspace?.ideas ?? [];
  const ideaTitle = new Map(ideas.map((i) => [i.id, i.title]));
  const modelName = new Map((models ?? []).map((m) => [m.id, m.name]));

  return (
    <div className="space-y-6">
      <DataPanel
        title="Run a new experiment"
        action={
          <Link
            to="/portal/divisions/intelligence/models"
            className="inline-flex items-center gap-1 text-xs acc-text hover:underline"
          >
            Model Trainer <ArrowRight className="h-3 w-3" />
          </Link>
        }
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (expHypothesis.trim()) createMut.mutate();
          }}
        >
          <Textarea
            placeholder="Hypothesis — e.g. A yield model fine-tuned on Kebbi sensor data beats the general model by 10%."
            value={expHypothesis}
            onChange={(e) => setExpHypothesis(e.target.value)}
            rows={2}
            maxLength={1000}
          />
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <select
              value={expIdeaId}
              onChange={(e) => setExpIdeaId(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Link an idea (optional)</option>
              {ideas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
            <select
              value={expModelId}
              onChange={(e) => setExpModelId(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Link an Intelligence model (optional)</option>
              {(models ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.target_division})
                </option>
              ))}
            </select>
            <Button type="submit" disabled={!expHypothesis.trim() || createMut.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Log
            </Button>
          </div>
        </form>
      </DataPanel>

      <DataPanel title={`Experiment log (${experiments?.length ?? 0})`}>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading experiments…</div>
        ) : (experiments?.length ?? 0) === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No experiments yet"
            description="Log a hypothesis above and link it to an Intelligence model."
          />
        ) : (
          <div className="space-y-3">
            {(experiments ?? []).map((ex) => (
              <div key={ex.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium leading-snug">{ex.hypothesis}</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ex.status} />
                    <select
                      value={ex.status}
                      onChange={(e) =>
                        updateMut.mutate({
                          id: ex.id,
                          status: e.target.value as (typeof EXPERIMENT_STATUSES)[number],
                        })
                      }
                      className="h-7 rounded-md border border-border bg-background px-1.5 text-[11px] capitalize"
                    >
                      {EXPERIMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  {ex.idea_id && <span>Idea: {ideaTitle.get(ex.idea_id) ?? "—"}</span>}
                  {ex.model_id && (
                    <span className="inline-flex items-center gap-1">
                      <BrainCircuit className="h-3 w-3" /> {modelName.get(ex.model_id) ?? "Model"}
                    </span>
                  )}
                  <span>{new Date(ex.created_at).toLocaleDateString()}</span>
                </div>
                {ex.result ? (
                  <p className="mt-2 rounded border border-border bg-surface p-2 text-xs leading-relaxed">
                    {ex.result}
                  </p>
                ) : (
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const draft = resultDrafts[ex.id]?.trim();
                      if (draft) updateMut.mutate({ id: ex.id, result: draft, status: "concluded" });
                    }}
                  >
                    <Textarea
                      placeholder="Record the result…"
                      value={resultDrafts[ex.id] ?? ""}
                      onChange={(e) => setResultDrafts((d) => ({ ...d, [ex.id]: e.target.value }))}
                      rows={1}
                      maxLength={2000}
                      className="min-h-9"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={!resultDrafts[ex.id]?.trim() || updateMut.isPending}
                      className="shrink-0 self-end"
                    >
                      Conclude
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
