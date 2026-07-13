import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  ArrowLeft,
  Lock,
  Plus,
  BrainCircuit,
  Database,
  Rocket,
  Gauge,
  Sparkles,
  Send,
  Layers,
  Cpu,
  Zap,
  Trash2,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { getDivision } from "@/lib/divisions";
import { getMyWorkspace } from "@/lib/divisions.functions";
import {
  getIntelligenceWorkspace,
  addDataset,
  createModel,
  advanceModel,
  runPrediction,
  listMyChatMessages,
  sendChatMessage,
  clearMyChat,
  MODEL_LIFECYCLE,
} from "@/lib/intelligence.functions";
import { authHeaders } from "@/lib/auth-headers";
import {
  HeroBanner,
  KpiStat,
  DataPanel,
  EmptyState,
  StatusBadge,
} from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_apex/portal/divisions/intelligence")({
  head: () => ({
    meta: [{ title: "UIG Intelligence — Workspace" }, { name: "robots", content: "noindex" }],
  }),
  validateSearch: (search) => z.object({ ask: z.string().optional() }).parse(search),
  component: IntelligenceWorkspace,
});

/** Deterministic, clearly-illustrative "feature importance" bars for a trained
 * model — no real training happens in this build, so these are seeded from the
 * model id (stable across renders) rather than a genuine explainability engine. */
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

function IntelligenceWorkspace() {
  const division = getDivision("intelligence")!;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { ask } = Route.useSearch();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const [datasetName, setDatasetName] = useState("");
  const [datasetRows, setDatasetRows] = useState("");
  const [modelName, setModelName] = useState("");
  const [predModelId, setPredModelId] = useState("");
  const [predPrompt, setPredPrompt] = useState("");
  const [predResult, setPredResult] = useState<{ result: string; confidence: number } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sentAskRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const ws = await getMyWorkspace({ headers: await authHeaders() });
        setHasAccess(ws.isAdmin || ws.divisionSlugs.includes("intelligence"));
      } catch {
        setHasAccess(false);
      }
    })();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["intelligence-workspace"],
    enabled: hasAccess === true,
    queryFn: async () => getIntelligenceWorkspace({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["intelligence-workspace"] });

  const datasetMut = useMutation({
    mutationFn: async () =>
      addDataset({
        data: { name: datasetName, rows_count: Number(datasetRows) || 0 },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Dataset added");
      setDatasetName("");
      setDatasetRows("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const predMut = useMutation({
    mutationFn: async () =>
      runPrediction({
        data: { model_id: predModelId, prompt: predPrompt },
        headers: await authHeaders(),
      }),
    onSuccess: (r) => {
      setPredResult(r);
      setPredPrompt("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: chatMessages } = useQuery({
    queryKey: ["intelligence-chat"],
    enabled: hasAccess === true,
    queryFn: async () => listMyChatMessages({ headers: await authHeaders() }),
  });

  const chatMut = useMutation({
    mutationFn: async (message: string) =>
      sendChatMessage({ data: { message }, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intelligence-chat"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const clearChatMut = useMutation({
    mutationFn: async () => clearMyChat({ headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intelligence-chat"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (ask && hasAccess === true && !sentAskRef.current) {
      sentAskRef.current = true;
      chatMut.mutate(ask);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask, hasAccess]);

  const datasetName_ = useMemo(() => {
    const m = new Map<string, string>();
    (data?.datasets ?? []).forEach((d) => m.set(d.id, d.name));
    return m;
  }, [data]);

  const modelName_ = useMemo(() => {
    const m = new Map<string, string>();
    (data?.models ?? []).forEach((mo) => m.set(mo.id, mo.name));
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

  if (hasAccess === null) return <div className="text-muted-foreground">Loading workspace…</div>;

  if (!hasAccess) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={Lock}
          title="No access to UIG Intelligence"
          description="You don't have access to this division workspace yet. Request access from an administrator."
        />
        <div className="mt-6">
          <Button variant="outline" onClick={() => navigate({ to: "/portal/dashboard" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className={`space-y-8 ${division.accentClass}`}>
      <Link
        to="/portal/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <HeroBanner
        division={division}
        eyebrow={division.short}
        title={division.name}
        subtitle="The brain of the group — train and deploy UIG's proprietary models, run live AI predictions, and ask the assistant for insight across every division."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          icon={Cpu}
          label="Models"
          value={stats?.models ?? "—"}
          hint={`${stats?.deployed ?? 0} in production`}
        />
        <KpiStat
          icon={Gauge}
          label="Avg accuracy"
          value={stats ? `${stats.avgAccuracy}%` : "—"}
          hint="across trained models"
        />
        <KpiStat
          icon={Database}
          label="Datasets"
          value={stats?.datasets ?? "—"}
          hint={`${(stats?.totalRows ?? 0).toLocaleString()} rows`}
        />
        <KpiStat
          icon={Rocket}
          label="Deployed"
          value={stats?.deployed ?? "—"}
          hint="live & monitored"
        />
      </div>

      {/* AI assistant — persistent multi-turn chat, not a one-shot Q&A */}
      <DataPanel
        title="AI assistant"
        action={
          (chatMessages?.length ?? 0) > 0 ? (
            <button
              onClick={() => clearChatMut.mutate()}
              disabled={clearChatMut.isPending}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          ) : undefined
        }
      >
        <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-border bg-background p-3">
          {(chatMessages?.length ?? 0) === 0 && !chatMut.isPending ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Ask anything — e.g. "Which division should we invest in next quarter?"
            </p>
          ) : (
            (chatMessages ?? []).map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "acc-bg-soft acc-text" : "border border-border bg-surface"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {chatMut.isPending && (
            <div className="text-left">
              <div className="inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (chatInput.trim()) {
              chatMut.mutate(chatInput.trim());
              setChatInput("");
            }
          }}
        >
          <Input
            placeholder="Message the assistant…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            maxLength={2000}
          />
          <Button type="submit" disabled={!chatInput.trim() || chatMut.isPending} className="shrink-0">
            <Sparkles className="mr-2 h-4 w-4" /> Send
          </Button>
        </form>
      </DataPanel>

      {/* Model lifecycle dashboard */}
      <div>
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
          <div className="mt-4 text-sm text-muted-foreground">Loading models…</div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium leading-snug">{mo.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {mo.version}
                            </span>
                          </div>
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
                              {datasetName_.get(mo.dataset_id) ?? "—"}
                            </div>
                          )}
                          {mo.status !== "draft" && mo.status !== "training" && (
                            <button
                              type="button"
                              onClick={() => setExpandedModel(expandedModel === mo.id ? null : mo.id)}
                              className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                            >
                              <BarChart3 className="h-3 w-3" /> Explainability
                            </button>
                          )}
                          {expandedModel === mo.id && (
                            <div className="mt-1.5 space-y-1">
                              <p className="text-[9px] italic text-muted-foreground">
                                Illustrative — no real training ran in this build.
                              </p>
                              {seededImportances(mo.id).map((f) => (
                                <div key={f.label} className="text-[9px]">
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>{f.label}</span>
                                    <span>{f.value}%</span>
                                  </div>
                                  <div className="mt-0.5 h-1 rounded-full bg-muted">
                                    <div
                                      className="h-1 rounded-full acc-bg"
                                      style={{ width: `${f.value}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
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

      {/* Live predictions */}
      <DataPanel title="Live predictions">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (predPrompt.trim()) predMut.mutate();
          }}
        >
          <select
            value={predModelId}
            onChange={(e) => setPredModelId(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">General model</option>
            {(data?.models ?? [])
              .filter(
                (m) =>
                  m.status === "deployed" || m.status === "monitoring" || m.status === "trained",
              )
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.target_division})
                </option>
              ))}
          </select>
          <Textarea
            placeholder="Describe what you want to predict — e.g. Forecast rice yield for Kebbi Field 12, dry season."
            value={predPrompt}
            onChange={(e) => setPredPrompt(e.target.value)}
            maxLength={2000}
            rows={3}
          />
          <Button type="submit" disabled={!predPrompt.trim() || predMut.isPending}>
            <Send className="mr-2 h-4 w-4" /> {predMut.isPending ? "Running…" : "Run prediction"}
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
      </DataPanel>

      {/* Datasets + recent predictions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DataPanel title="Dataset library">
          <form
            className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              if (datasetName.trim()) datasetMut.mutate();
            }}
          >
            <Input
              placeholder="Dataset name"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              maxLength={180}
            />
            <Input
              placeholder="Rows"
              value={datasetRows}
              onChange={(e) => setDatasetRows(e.target.value)}
              type="number"
              min={0}
              className="w-24"
            />
            <Button
              type="submit"
              disabled={!datasetName.trim() || datasetMut.isPending}
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>
          {(data?.datasets.length ?? 0) === 0 ? (
            <EmptyState icon={Database} title="No datasets yet" />
          ) : (
            <div className="space-y-3">
              {(data?.datasets ?? []).map((d) => (
                <div key={d.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.source_division} · {d.rows_count.toLocaleString()} rows ·{" "}
                        {Number(d.size_mb)} MB
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DataPanel>

        <DataPanel title="Recent predictions">
          {(data?.predictions.length ?? 0) === 0 ? (
            <EmptyState
              icon={Layers}
              title="No predictions yet"
              description="Run a live prediction to see results here."
            />
          ) : (
            <div className="space-y-3">
              {(data?.predictions ?? []).map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <BrainCircuit className="h-3 w-3" />
                      {p.model_id ? (modelName_.get(p.model_id) ?? "Model") : "General model"}
                    </span>
                    <span className="text-[11px] acc-text">{Number(p.confidence).toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 text-xs font-medium leading-snug">{p.prompt}</div>
                  {p.result && (
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.result}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DataPanel>
      </div>
    </div>
  );
}
