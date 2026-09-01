import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Lock,
  Plus,
  Lightbulb,
  Cpu,
  Users,
  Rocket,
  GitBranch,
  Activity,
  Globe,
  Image as ImageIcon,
  Trash2,
  ListChecks,
  Sparkles,
  Calendar,
  FlaskConical,
  BrainCircuit,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { getDivision } from "@/lib/divisions";
import { getMyWorkspace } from "@/lib/divisions.functions";
import {
  getInnovationWorkspace,
  submitIdea,
  createPrototype,
  updatePrototypeStatus,
  updateIdeaStatus,
  addPartner,
  addPrototypeScreenshot,
  removePrototypeScreenshot,
  listChecklist,
  generateMvpChecklist,
  toggleChecklistItem,
  listDemoDays,
  createDemoDay,
  scheduleSlot,
  unscheduleSlot,
  listExperiments,
  listLinkableModels,
  createExperiment,
  updateExperiment,
  listInnovationSubmissions,
  reviewSubmission,
  IDEA_STATUSES,
  PROTOTYPE_STATUSES,
  SUBMISSION_STATUSES,
} from "@/lib/innovation.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
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

function shotUrl(path: string) {
  return supabase.storage.from("prototype-images").getPublicUrl(path).data.publicUrl;
}

export const Route = createFileRoute("/_apex/portal/divisions/innovation-lab/")({
  component: InnovationLabWorkspace,
});

function InnovationLabWorkspace() {
  const qc = useQueryClient();

  // New Idea Form State
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDesc, setIdeaDesc] = useState("");
  const [ideaTags, setIdeaTags] = useState("");

  // New Prototype Form State
  const [protoIdeaId, setProtoIdeaId] = useState("");
  const [protoRepo, setProtoRepo] = useState("");
  const [protoDemo, setProtoDemo] = useState("");

  // New Partner Form State
  const [partnerName, setPartnerName] = useState("");
  const [partnerType, setPartnerType] = useState("corporate");
  const [partnerContact, setPartnerContact] = useState("");

  const [checklistIdea, setChecklistIdea] = useState<string | null>(null);
  const [uploadingProto, setUploadingProto] = useState<string | null>(null);

  const [demoTitle, setDemoTitle] = useState("");
  const [demoDate, setDemoDate] = useState("");
  const [slotDay, setSlotDay] = useState("");
  const [slotProto, setSlotProto] = useState("");

  const [expHypothesis, setExpHypothesis] = useState("");
  const [expIdeaId, setExpIdeaId] = useState("");
  const [expModelId, setExpModelId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["innovation-workspace"],
    queryFn: async () => getInnovationWorkspace({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["innovation-workspace"] });

  const ideaMut = useMutation({
    mutationFn: async () =>
      submitIdea({
        data: {
          title: ideaTitle,
          description: ideaDesc,
          tags: ideaTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Idea submitted successfully!");
      setIdeaTitle("");
      setIdeaDesc("");
      setIdeaTags("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ideaStatusMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof IDEA_STATUSES)[number] }) =>
      updateIdeaStatus({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["innovation-submissions"],
    queryFn: async () => listInnovationSubmissions({ headers: await authHeaders() }),
  });
  const reviewMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof SUBMISSION_STATUSES)[number] }) =>
      reviewSubmission({ data: v, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["innovation-submissions"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const prototypeMut = useMutation({
    mutationFn: async () =>
      createPrototype({
        data: {
          idea_id: protoIdeaId,
          repo_link: protoRepo,
          demo_link: protoDemo,
          status: "concept",
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Prototype initialized!");
      setProtoIdeaId("");
      setProtoRepo("");
      setProtoDemo("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const prototypeStatusMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof PROTOTYPE_STATUSES)[number] }) =>
      updatePrototypeStatus({ data: v, headers: await authHeaders() }),
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
      toast.success("Partner registered!");
      setPartnerName("");
      setPartnerContact("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onUploadScreenshot(prototypeId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProto(prototypeId);
    try {
      const path = `${prototypeId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("prototype-images").upload(path, file);
      if (upErr) throw upErr;
      await addPrototypeScreenshot({
        data: { prototype_id: prototypeId, storage_path: path },
        headers: await authHeaders(),
      });
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingProto(null);
      e.target.value = "";
    }
  }

  const removeShotMut = useMutation({
    mutationFn: async (v: { prototype_id: string; storage_path: string }) =>
      removePrototypeScreenshot({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: checklist, isLoading: checklistLoading } = useQuery({
    queryKey: ["innovation-checklist", checklistIdea],
    queryFn: async () =>
      listChecklist({ headers: await authHeaders(), data: { idea_id: checklistIdea! } }),
    enabled: Boolean(checklistIdea),
  });

  const genChecklistMut = useMutation({
    mutationFn: async (ideaId: string) =>
      generateMvpChecklist({ data: { idea_id: ideaId }, headers: await authHeaders() }),
    onSuccess: (r) => {
      toast.success(`Generated ${r.count} checklist item${r.count === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["innovation-checklist", checklistIdea] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleChecklistMut = useMutation({
    mutationFn: async (v: { id: string; done: boolean }) =>
      toggleChecklistItem({ data: v, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["innovation-checklist", checklistIdea] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: demoData } = useQuery({
    queryKey: ["innovation-demo-days"],

    queryFn: async () => listDemoDays({ headers: await authHeaders() }),
  });

  const createDemoDayMut = useMutation({
    mutationFn: async () =>
      createDemoDay({
        data: { title: demoTitle, event_date: demoDate },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Demo day scheduled");
      setDemoTitle("");
      setDemoDate("");
      qc.invalidateQueries({ queryKey: ["innovation-demo-days"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const scheduleSlotMut = useMutation({
    mutationFn: async () =>
      scheduleSlot({
        data: { demo_day_id: slotDay, prototype_id: slotProto },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      setSlotProto("");
      qc.invalidateQueries({ queryKey: ["innovation-demo-days"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unscheduleSlotMut = useMutation({
    mutationFn: async (id: string) =>
      unscheduleSlot({ data: { id }, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["innovation-demo-days"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: experiments } = useQuery({
    queryKey: ["innovation-experiments"],

    queryFn: async () => listExperiments({ headers: await authHeaders() }),
  });

  const { data: linkableModels } = useQuery({
    queryKey: ["innovation-linkable-models"],

    queryFn: async () => listLinkableModels({ headers: await authHeaders() }),
  });

  const createExperimentMut = useMutation({
    mutationFn: async () =>
      createExperiment({
        data: {
          hypothesis: expHypothesis,
          idea_id: expIdeaId || undefined,
          model_id: expModelId || undefined,
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Experiment logged");
      setExpHypothesis("");
      setExpIdeaId("");
      setExpModelId("");
      qc.invalidateQueries({ queryKey: ["innovation-experiments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const advanceExperimentMut = useMutation({
    mutationFn: async (v: { id: string; status: "planned" | "running" | "concluded" }) =>
      updateExperiment({ data: v, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["innovation-experiments"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = data?.stats;

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Lightbulb} label="Total Ideas" value={stats?.totalIdeas ?? "—"} />
        <KpiStat icon={Cpu} label="Active Prototypes" value={stats?.activePrototypes ?? "—"} />
        <KpiStat icon={Users} label="Ecosystem Partners" value={stats?.totalPartners ?? "—"} />
        <KpiStat icon={Activity} label="Concept Phase" value={stats?.conceptIdeas ?? "—"} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Pitch Idea Column */}
        <div className="lg:col-span-2 space-y-8">
          <DataPanel title="Pitch a new venture/idea">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (ideaTitle.trim()) ideaMut.mutate();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Title
                  </label>
                  <Input
                    placeholder="e.g., Drone-based Soil Hydration Mapping"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    maxLength={150}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Tags (comma separated)
                  </label>
                  <Input
                    placeholder="agritech, iot, computer-vision"
                    value={ideaTags}
                    onChange={(e) => setIdeaTags(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Description
                </label>
                <Textarea
                  placeholder="Detail the problem space, potential impact, and resource requirements..."
                  value={ideaDesc}
                  onChange={(e) => setIdeaDesc(e.target.value)}
                  rows={4}
                />
              </div>
              <Button
                type="submit"
                disabled={!ideaTitle.trim() || ideaMut.isPending}
                className="bg-gold text-gold-foreground hover:bg-gold/90 w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" /> Submit Proposal
              </Button>
            </form>
          </DataPanel>

          {/* Ideas List */}
          <DataPanel title="Proposed Ideas & Venture Pipeline">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading ideas...</p>
            ) : (data?.ideas.length ?? 0) === 0 ? (
              <EmptyState icon={Lightbulb} title="No ideas submitted yet" />
            ) : (
              <div className="divide-y divide-border">
                {data?.ideas.map((idea) => {
                  const tagsArr = Array.isArray(idea.tags)
                    ? idea.tags
                    : typeof idea.tags === "string"
                      ? JSON.parse(idea.tags)
                      : [];
                  return (
                    <div key={idea.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-base">{idea.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {idea.description || "No description provided."}
                          </p>
                        </div>
                        <StatusBadge status={idea.status || "concept"} />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <div className="flex flex-wrap gap-1.5">
                          {tagsArr.map((tag: string) => (
                            <span
                              key={tag}
                              className="rounded-full bg-surface-elevated border border-border px-2.5 py-0.5 text-xs text-muted-foreground font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            onClick={() =>
                              setChecklistIdea(checklistIdea === idea.id ? null : idea.id)
                            }
                            className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground transition hover:border-gold hover:text-foreground"
                          >
                            <ListChecks className="h-3 w-3" /> MVP checklist
                          </button>
                          {IDEA_STATUSES.filter((s) => s !== idea.status).map((s) => (
                            <button
                              key={s}
                              onClick={() => ideaStatusMut.mutate({ id: idea.id, status: s })}
                              className="rounded border border-border px-2 py-0.5 text-[10px] capitalize text-muted-foreground transition hover:border-gold hover:text-foreground"
                            >
                              Move to {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {checklistIdea === idea.id && (
                        <div className="rounded-lg border border-border bg-background p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                              MVP checklist
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px]"
                              disabled={genChecklistMut.isPending}
                              onClick={() => genChecklistMut.mutate(idea.id)}
                            >
                              <Sparkles className="mr-1 h-3 w-3" />
                              {genChecklistMut.isPending ? "Generating…" : "Generate with AI"}
                            </Button>
                          </div>
                          {checklistLoading ? (
                            <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
                          ) : (checklist?.length ?? 0) === 0 ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              No checklist yet — generate one from the idea's description.
                            </p>
                          ) : (
                            <ul className="mt-2 space-y-1.5">
                              {(checklist ?? []).map((item) => (
                                <li key={item.id} className="flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={item.done}
                                    onChange={(e) =>
                                      toggleChecklistMut.mutate({
                                        id: item.id,
                                        done: e.target.checked,
                                      })
                                    }
                                  />
                                  <span
                                    className={
                                      item.done ? "text-muted-foreground line-through" : ""
                                    }
                                  >
                                    {item.task}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DataPanel>

          {/* Public idea submissions — intake from the public "submit an idea"
              form at /divisions/innovation-lab/submit. Kept separate from the
              venture pipeline above; promoting a submission means manually
              re-entering it via "Pitch a new venture/idea" once it's vetted. */}
          <DataPanel title="Public idea submissions">
            {submissionsLoading ? (
              <p className="text-sm text-muted-foreground">Loading submissions...</p>
            ) : (submissions?.length ?? 0) === 0 ? (
              <EmptyState icon={Inbox} title="No public submissions yet" />
            ) : (
              <div className="divide-y divide-border">
                {submissions?.map((s) => (
                  <div key={s.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-base">{s.idea_title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{s.idea_description}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {s.full_name} · {s.email}
                          {s.phone ? ` · ${s.phone}` : ""}
                          {s.category ? ` · ${s.category}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {SUBMISSION_STATUSES.filter((st) => st !== s.status).map((st) => (
                        <button
                          key={st}
                          onClick={() => reviewMut.mutate({ id: s.id, status: st })}
                          className="rounded border border-border px-2 py-0.5 text-[10px] capitalize text-muted-foreground transition hover:border-gold hover:text-foreground"
                        >
                          Mark {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DataPanel>

          {/* Demo day scheduler */}
          <DataPanel title="Demo day scheduler">
            <form
              className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                if (demoTitle.trim() && demoDate) createDemoDayMut.mutate();
              }}
            >
              <Input
                placeholder="Demo day title"
                value={demoTitle}
                onChange={(e) => setDemoTitle(e.target.value)}
                maxLength={180}
              />
              <Input type="date" value={demoDate} onChange={(e) => setDemoDate(e.target.value)} />
              <Button
                type="submit"
                variant="outline"
                disabled={!demoTitle.trim() || !demoDate || createDemoDayMut.isPending}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </form>

            {(demoData?.days.length ?? 0) === 0 ? (
              <div className="mt-4">
                <EmptyState icon={Calendar} title="No demo days scheduled" />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {(demoData?.days ?? []).map((day) => {
                  const slots = (demoData?.slots ?? []).filter((s) => s.demo_day_id === day.id);
                  return (
                    <div key={day.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{day.title}</span>
                        <span className="text-xs text-muted-foreground">{day.event_date}</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {slots.map((s) => {
                          const proto = data?.prototypes.find((p) => p.id === s.prototype_id);
                          const ideaTitle = data?.ideas.find((i) => i.id === proto?.idea_id)?.title;
                          return (
                            <div key={s.id} className="flex items-center justify-between text-xs">
                              <span>{ideaTitle ?? "Prototype"}</span>
                              <button
                                onClick={() => unscheduleSlotMut.mutate(s.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <form
                        className="mt-2 flex gap-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (slotProto) {
                            setSlotDay(day.id);
                            scheduleSlotMut.mutate();
                          }
                        }}
                      >
                        <select
                          value={slotDay === day.id ? slotProto : ""}
                          onChange={(e) => {
                            setSlotDay(day.id);
                            setSlotProto(e.target.value);
                          }}
                          className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-xs"
                        >
                          <option value="">Add prototype to this demo day…</option>
                          {(data?.prototypes ?? [])
                            .filter((p) => !slots.some((s) => s.prototype_id === p.id))
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {data?.ideas.find((i) => i.id === p.idea_id)?.title ?? "Prototype"}
                              </option>
                            ))}
                        </select>
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8 text-[11px]"
                          disabled={!slotProto || slotDay !== day.id}
                        >
                          Add
                        </Button>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </DataPanel>

          {/* Experiment log — optionally tied to a real UIG Intelligence model */}
          <DataPanel title="Experiment log">
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (expHypothesis.trim()) createExperimentMut.mutate();
              }}
            >
              <Textarea
                placeholder="Hypothesis — what are we testing?"
                value={expHypothesis}
                onChange={(e) => setExpHypothesis(e.target.value)}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={expIdeaId}
                  onChange={(e) => setExpIdeaId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-2 text-xs"
                >
                  <option value="">Link an idea (optional)</option>
                  {(data?.ideas ?? []).map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title}
                    </option>
                  ))}
                </select>
                <select
                  value={expModelId}
                  onChange={(e) => setExpModelId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-2 text-xs"
                >
                  <option value="">Link an Intelligence model (optional)</option>
                  {(linkableModels ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.target_division})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!expHypothesis.trim() || createExperimentMut.isPending}
              >
                <FlaskConical className="mr-1.5 h-3.5 w-3.5" /> Log experiment
              </Button>
            </form>

            {(experiments?.length ?? 0) === 0 ? (
              <div className="mt-4">
                <EmptyState icon={FlaskConical} title="No experiments logged yet" />
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {(experiments ?? []).map((exp) => {
                  const model = linkableModels?.find((m) => m.id === exp.model_id);
                  return (
                    <div key={exp.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs">{exp.hypothesis}</p>
                        <StatusBadge status={exp.status} />
                      </div>
                      {model && (
                        <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] acc-text">
                          <BrainCircuit className="h-3 w-3" /> {model.name}
                        </div>
                      )}
                      <div className="mt-2 flex gap-1">
                        {(["planned", "running", "concluded"] as const)
                          .filter((s) => s !== exp.status)
                          .map((s) => (
                            <button
                              key={s}
                              onClick={() => advanceExperimentMut.mutate({ id: exp.id, status: s })}
                              className="rounded border border-border px-1.5 py-0.5 text-[9px] capitalize text-muted-foreground transition hover:border-gold hover:text-foreground"
                            >
                              {s}
                            </button>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DataPanel>
        </div>

        {/* Right Sidebar: Prototype Form & Partner List */}
        <div className="space-y-8">
          <DataPanel title="Initialize Prototype">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (protoIdeaId) prototypeMut.mutate();
              }}
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Select Idea
                </label>
                <select
                  value={protoIdeaId}
                  onChange={(e) => setProtoIdeaId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  required
                >
                  <option value="">-- Choose Idea --</option>
                  {data?.ideas
                    .filter((idea) => idea.status !== "production")
                    .map((idea) => (
                      <option key={idea.id} value={idea.id}>
                        {idea.title}
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Repository Link
                </label>
                <Input
                  type="url"
                  placeholder="https://github.com/uig/..."
                  value={protoRepo}
                  onChange={(e) => setProtoRepo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">
                  Demo Live Link
                </label>
                <Input
                  type="url"
                  placeholder="https://demo.uig.online/..."
                  value={protoDemo}
                  onChange={(e) => setProtoDemo(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={!protoIdeaId || prototypeMut.isPending}
                className="bg-gold text-gold-foreground hover:bg-gold/90 w-full"
              >
                <Rocket className="mr-2 h-4 w-4" /> Spin Up Workspace
              </Button>
            </form>
          </DataPanel>

          {/* Prototypes List */}
          <DataPanel title="Prototype Tracker">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading prototypes...</p>
            ) : (data?.prototypes.length ?? 0) === 0 ? (
              <EmptyState icon={Cpu} title="No prototypes registered" />
            ) : (
              <div className="space-y-4">
                {data?.prototypes.map((p) => {
                  const matchingIdea = data?.ideas.find((i) => i.id === p.idea_id);
                  return (
                    <div
                      key={p.id}
                      className="rounded-lg border border-border bg-surface-elevated/40 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-semibold text-sm leading-snug">
                            {matchingIdea?.title || "Prototype"}
                          </h5>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {p.id.slice(0, 8)}
                          </span>
                        </div>
                        <StatusBadge status={p.status || "concept"} />
                      </div>
                      <div className="flex gap-2">
                        {p.repo_link && (
                          <a
                            href={p.repo_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
                          >
                            <GitBranch className="h-3 w-3" /> Repo
                          </a>
                        )}
                        {p.demo_link && (
                          <a
                            href={p.demo_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
                          >
                            <Globe className="h-3 w-3" /> Live Demo
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {PROTOTYPE_STATUSES.filter((s) => s !== p.status).map((s) => (
                          <button
                            key={s}
                            onClick={() => prototypeStatusMut.mutate({ id: p.id, status: s })}
                            className="rounded border border-border bg-background px-1.5 py-0.5 text-[9px] capitalize text-muted-foreground transition hover:border-gold hover:text-foreground"
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Screenshot showcase gallery */}
                      <div className="border-t border-border pt-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-muted-foreground">
                            <ImageIcon className="h-3 w-3" /> Showcase
                          </span>
                          <label className="cursor-pointer text-[10px] text-gold hover:underline">
                            {uploadingProto === p.id ? "Uploading…" : "Add screenshot"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingProto === p.id}
                              onChange={(e) => onUploadScreenshot(p.id, e)}
                            />
                          </label>
                        </div>
                        {Array.isArray(p.screenshots) && p.screenshots.length > 0 ? (
                          <div className="mt-2 grid grid-cols-3 gap-1.5">
                            {(p.screenshots as string[]).map((path) => (
                              <div
                                key={path}
                                className="group relative overflow-hidden rounded border border-border"
                              >
                                <img
                                  src={shotUrl(path)}
                                  alt=""
                                  className="h-14 w-full object-cover"
                                />
                                <button
                                  onClick={() =>
                                    removeShotMut.mutate({ prototype_id: p.id, storage_path: path })
                                  }
                                  className="absolute right-0.5 top-0.5 rounded bg-background/80 p-0.5 opacity-0 transition group-hover:opacity-100"
                                >
                                  <Trash2 className="h-2.5 w-2.5 text-destructive" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1.5 text-[10px] text-muted-foreground">
                            No screenshots yet.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DataPanel>

          {/* Ecosystem Partners */}
          <DataPanel title="Ecosystem Partners">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (partnerName.trim()) partnerMut.mutate();
              }}
            >
              <Input
                placeholder="Partner Name"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={partnerType}
                  onChange={(e) => setPartnerType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="corporate">Corporate</option>
                  <option value="academic">Academic</option>
                  <option value="venture_capital">Venture Capital</option>
                  <option value="incubator">Incubator</option>
                </select>
                <Input
                  placeholder="Contact Info"
                  value={partnerContact}
                  onChange={(e) => setPartnerContact(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={!partnerName.trim() || partnerMut.isPending}
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Partner
              </Button>
            </form>

            <div className="mt-4 divide-y divide-border">
              {data?.partners.map((partner) => (
                <div key={partner.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold">{partner.name}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">
                      {partner.type?.replace("_", " ")}
                    </div>
                  </div>
                  {partner.contact && (
                    <span className="text-muted-foreground font-mono text-[10px]">
                      {partner.contact}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </DataPanel>
        </div>
      </div>
    </div>
  );
}
