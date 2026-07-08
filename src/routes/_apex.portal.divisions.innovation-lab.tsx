import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Lock,
  Plus,
  Lightbulb,
  FlaskConical,
  Handshake,
  Rocket,
  Sparkles,
  Zap,
  Github,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { getDivision } from "@/lib/divisions";
import { getMyWorkspace } from "@/lib/divisions.functions";
import {
  getInnovationWorkspace,
  submitIdea,
  advanceIdea,
  createPrototype,
  advancePrototype,
  addPartner,
  runExperiment,
  IDEA_STAGES,
  PARTNER_TYPES,
} from "@/lib/innovation.functions";
import { authHeaders } from "@/lib/auth-headers";
import { HeroBanner, KpiStat, DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_apex/portal/divisions/innovation-lab")({
  head: () => ({
    meta: [{ title: "UIG Innovation Lab — Workspace" }, { name: "robots", content: "noindex" }],
  }),
  component: InnovationWorkspace,
});

const IDEA_COLUMNS: { key: (typeof IDEA_STAGES)[number]; label: string }[] = [
  { key: "concept", label: "Concept" },
  { key: "validated", label: "Validated" },
  { key: "prototype", label: "Prototype" },
  { key: "launched", label: "Launched" },
];

const IDEA_NEXT: Record<string, string> = {
  concept: "Validate",
  validated: "Prototype",
  prototype: "Launch",
};

const PROTO_NEXT: Record<string, string> = {
  build: "Move to pilot",
  pilot: "Launch",
};

function InnovationWorkspace() {
  const division = getDivision("innovation-lab")!;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDesc, setIdeaDesc] = useState("");
  const [ideaTags, setIdeaTags] = useState("");

  const [protoIdea, setProtoIdea] = useState("");
  const [protoRepo, setProtoRepo] = useState("");
  const [protoDemo, setProtoDemo] = useState("");

  const [partnerName, setPartnerName] = useState("");
  const [partnerType, setPartnerType] = useState<(typeof PARTNER_TYPES)[number]>("corporate");
  const [partnerContact, setPartnerContact] = useState("");

  const [expTitle, setExpTitle] = useState("");
  const [expHypothesis, setExpHypothesis] = useState("");
  const [expResult, setExpResult] = useState<{ result: string; confidence: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const ws = await getMyWorkspace({ headers: await authHeaders() });
        setHasAccess(ws.isAdmin || ws.divisionSlugs.includes("innovation-lab"));
      } catch {
        setHasAccess(false);
      }
    })();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["innovation-workspace"],
    enabled: hasAccess === true,
    queryFn: async () => getInnovationWorkspace({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["innovation-workspace"] });

  const ideaMut = useMutation({
    mutationFn: async () =>
      submitIdea({
        data: { title: ideaTitle, description: ideaDesc, tags: ideaTags },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Idea submitted");
      setIdeaTitle("");
      setIdeaDesc("");
      setIdeaTags("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const advanceIdeaMut = useMutation({
    mutationFn: async (id: string) => advanceIdea({ data: { id }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const protoMut = useMutation({
    mutationFn: async () =>
      createPrototype({
        data: { idea_id: protoIdea, repo_link: protoRepo, demo_link: protoDemo },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Prototype created");
      setProtoIdea("");
      setProtoRepo("");
      setProtoDemo("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const advanceProtoMut = useMutation({
    mutationFn: async (id: string) => advancePrototype({ data: { id }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const partnerMut = useMutation({
    mutationFn: async () =>
      addPartner({
        data: { name: partnerName, type: partnerType, contact: partnerContact },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Partner added");
      setPartnerName("");
      setPartnerContact("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const expMut = useMutation({
    mutationFn: async () =>
      runExperiment({
        data: { title: expTitle, hypothesis: expHypothesis, source_division: "innovation-lab" },
        headers: await authHeaders(),
      }),
    onSuccess: (r) => {
      setExpResult(r);
      setExpTitle("");
      setExpHypothesis("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ideaTitleById = useMemo(() => {
    const m = new Map<string, string>();
    (data?.ideas ?? []).forEach((i) => m.set(i.id, i.title));
    return m;
  }, [data]);

  const ideasByStage = useMemo(() => {
    const m = new Map<string, NonNullable<typeof data>["ideas"]>();
    IDEA_COLUMNS.forEach((c) => m.set(c.key, []));
    (data?.ideas ?? []).forEach((i) => {
      const key = (i.status ?? "concept") as string;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(i);
    });
    return m;
  }, [data]);

  if (hasAccess === null) return <div className="text-muted-foreground">Loading workspace…</div>;

  if (!hasAccess) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={Lock}
          title="No access to UIG Innovation Lab"
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
        subtitle="The venture studio — capture ideas from every division, track prototypes from concept to launch, collaborate with partners, and run AI-powered experiments through UIG Intelligence."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Lightbulb} label="Ideas" value={stats?.ideas ?? "—"} hint={`${stats?.launched ?? 0} launched`} />
        <KpiStat icon={Rocket} label="Prototypes" value={stats?.prototypes ?? "—"} hint={`${stats?.livePrototypes ?? 0} in pilot/launch`} />
        <KpiStat icon={Handshake} label="Partners" value={stats?.partners ?? "—"} hint="collaborators & investors" />
        <KpiStat icon={FlaskConical} label="Experiments" value={stats?.experiments ?? "—"} hint="AI-run & logged" />
      </div>

      {/* Idea submission + pipeline */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Idea pipeline</h2>
            <p className="text-sm text-muted-foreground">Concept → Validated → Prototype → Launched.</p>
          </div>
        </div>

        <DataPanel title="Submit an idea" className="mt-4">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (ideaTitle.trim()) ideaMut.mutate();
            }}
          >
            <Input
              placeholder="Idea title"
              value={ideaTitle}
              onChange={(e) => setIdeaTitle(e.target.value)}
              maxLength={180}
            />
            <Input
              placeholder="Tags (comma separated)"
              value={ideaTags}
              onChange={(e) => setIdeaTags(e.target.value)}
              maxLength={300}
            />
            <Textarea
              placeholder="Describe the idea and the problem it solves…"
              value={ideaDesc}
              onChange={(e) => setIdeaDesc(e.target.value)}
              maxLength={1000}
              rows={2}
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!ideaTitle.trim() || ideaMut.isPending}>
                <Plus className="mr-2 h-4 w-4" /> {ideaMut.isPending ? "Submitting…" : "Submit idea"}
              </Button>
            </div>
          </form>
        </DataPanel>

        {isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading ideas…</div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {IDEA_COLUMNS.map((col) => {
              const items = ideasByStage.get(col.key) ?? [];
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
                      items.map((idea) => (
                        <div key={idea.id} className="rounded-lg border border-border bg-background p-3">
                          <div className="text-sm font-medium leading-snug">{idea.title}</div>
                          {idea.description && (
                            <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                              {idea.description}
                            </p>
                          )}
                          {idea.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {idea.tags.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="rounded-full acc-bg-soft acc-text px-1.5 py-0.5 text-[10px]"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          {IDEA_NEXT[idea.status ?? "concept"] && (
                            <button
                              type="button"
                              onClick={() => advanceIdeaMut.mutate(idea.id)}
                              disabled={advanceIdeaMut.isPending}
                              className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded border border-border px-1.5 py-1 text-[10px] text-muted-foreground transition hover:acc-border-soft hover:text-foreground"
                            >
                              <ArrowRight className="h-3 w-3" /> {IDEA_NEXT[idea.status ?? "concept"]}
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

      {/* Prototype tracker + partners */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DataPanel title="Prototype tracker">
          <form
            className="mb-4 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              protoMut.mutate();
            }}
          >
            <select
              value={protoIdea}
              onChange={(e) => setProtoIdea(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="">Link to an idea (optional)</option>
              {(data?.ideas ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input placeholder="Repo link" value={protoRepo} onChange={(e) => setProtoRepo(e.target.value)} maxLength={400} />
              <Input placeholder="Demo link" value={protoDemo} onChange={(e) => setProtoDemo(e.target.value)} maxLength={400} />
              <Button type="submit" disabled={protoMut.isPending} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </form>
          {(data?.prototypes.length ?? 0) === 0 ? (
            <EmptyState icon={Rocket} title="No prototypes yet" description="Spin up a prototype to track it from build to launch." />
          ) : (
            <div className="space-y-3">
              {(data?.prototypes ?? []).map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 text-sm font-medium">
                      {p.idea_id ? ideaTitleById.get(p.idea_id) ?? "Prototype" : "Standalone prototype"}
                    </div>
                    <StatusBadge status={p.status ?? "build"} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    {p.repo_link && (
                      <a href={p.repo_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:acc-text">
                        <Github className="h-3 w-3" /> Repo
                      </a>
                    )}
                    {p.demo_link && (
                      <a href={p.demo_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:acc-text">
                        <ExternalLink className="h-3 w-3" /> Demo
                      </a>
                    )}
                  </div>
                  {PROTO_NEXT[p.status ?? "build"] && (
                    <button
                      type="button"
                      onClick={() => advanceProtoMut.mutate(p.id)}
                      disabled={advanceProtoMut.isPending}
                      className="mt-2 inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] text-muted-foreground transition hover:acc-border-soft hover:text-foreground"
                    >
                      <Zap className="h-3 w-3" /> {PROTO_NEXT[p.status ?? "build"]}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DataPanel>

        <DataPanel title="Partner collaboration">
          <form
            className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              if (partnerName.trim()) partnerMut.mutate();
            }}
          >
            <Input placeholder="Partner name" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} maxLength={180} />
            <select
              value={partnerType}
              onChange={(e) => setPartnerType(e.target.value as (typeof PARTNER_TYPES)[number])}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm capitalize"
            >
              {PARTNER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Input
              placeholder="Contact (email or phone)"
              value={partnerContact}
              onChange={(e) => setPartnerContact(e.target.value)}
              maxLength={200}
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!partnerName.trim() || partnerMut.isPending} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add partner
              </Button>
            </div>
          </form>
          {(data?.partners.length ?? 0) === 0 ? (
            <EmptyState icon={Handshake} title="No partners yet" />
          ) : (
            <div className="space-y-3">
              {(data?.partners ?? []).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    {p.contact && <div className="truncate text-[11px] text-muted-foreground">{p.contact}</div>}
                  </div>
                  <StatusBadge status={p.type ?? "corporate"} />
                </div>
              ))}
            </div>
          )}
        </DataPanel>
      </div>

      {/* Experiment log (AI) */}
      <DataPanel title="Experiment with AI">
        <p className="-mt-1 mb-3 text-xs text-muted-foreground">
          Pipe a hypothesis into UIG Intelligence and log the result.
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (expTitle.trim() && expHypothesis.trim()) expMut.mutate();
          }}
        >
          <Input
            placeholder="Experiment title — e.g. Solar micro-financing for Kano farmers"
            value={expTitle}
            onChange={(e) => setExpTitle(e.target.value)}
            maxLength={200}
          />
          <Textarea
            placeholder="Hypothesis — what do you expect to happen and why?"
            value={expHypothesis}
            onChange={(e) => setExpHypothesis(e.target.value)}
            maxLength={2000}
            rows={3}
          />
          <Button type="submit" disabled={!expTitle.trim() || !expHypothesis.trim() || expMut.isPending}>
            <Sparkles className="mr-2 h-4 w-4" /> {expMut.isPending ? "Running…" : "Run experiment"}
          </Button>
        </form>
        {expResult && (
          <div className="mt-4 rounded-lg border acc-border-soft bg-background p-4">
            <div className="flex items-center gap-2 text-xs acc-text">
              <Sparkles className="h-3.5 w-3.5" /> {expResult.confidence}% confidence
            </div>
            <p className="mt-2 text-sm leading-relaxed">{expResult.result}</p>
          </div>
        )}

        {(data?.experiments.length ?? 0) > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold">Experiment log</h4>
            {(data?.experiments ?? []).map((ex) => (
              <div key={ex.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <FlaskConical className="h-3 w-3" /> {ex.source_division}
                  </span>
                  <span className="text-[11px] acc-text">{Number(ex.confidence).toFixed(0)}%</span>
                </div>
                <div className="mt-1 text-sm font-medium leading-snug">{ex.title}</div>
                {ex.result && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{ex.result}</p>}
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
