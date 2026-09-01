import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Calendar,
  Cpu,
  FlaskConical,
  Handshake,
  Inbox,
  Lightbulb,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createDemoDay,
  getInnovationWorkspace,
  listDemoDays,
  listExperiments,
  listInnovationSubmissions,
  promoteSubmission,
  reviewSubmission,
  scheduleSlot,
  unscheduleSlot,
  SUBMISSION_STATUSES,
} from "@/lib/innovation.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, KpiStat, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/divisions/innovation-lab/")({
  component: InnovationLabWorkspace,
});

/**
 * Workspace overview.
 *
 * This page used to carry a full copy of the idea pitch form, idea pipeline,
 * prototype tracker, experiment log and partner manager — every one of which
 * also has its own tab. It now shows the state of the Lab and links through,
 * and keeps only the two surfaces that have no tab of their own: triaging
 * public submissions and scheduling demo days.
 */
function InnovationLabWorkspace() {
  const qc = useQueryClient();

  const [demoTitle, setDemoTitle] = useState("");
  const [demoDate, setDemoDate] = useState("");
  const [slotDay, setSlotDay] = useState("");
  const [slotProto, setSlotProto] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["innovation-workspace"],
    queryFn: async () => getInnovationWorkspace({ headers: await authHeaders() }),
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["innovation-submissions"],
    queryFn: async () => listInnovationSubmissions({ headers: await authHeaders() }),
  });

  const { data: experiments } = useQuery({
    queryKey: ["innovation-experiments"],
    queryFn: async () => listExperiments({ headers: await authHeaders() }),
  });

  const { data: demoData } = useQuery({
    queryKey: ["innovation-demo-days"],
    queryFn: async () => listDemoDays({ headers: await authHeaders() }),
  });

  const reviewMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof SUBMISSION_STATUSES)[number] }) =>
      reviewSubmission({ data: v, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["innovation-submissions"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const promoteMut = useMutation({
    mutationFn: async (id: string) =>
      promoteSubmission({ data: { id }, headers: await authHeaders() }),
    onSuccess: (r) => {
      toast.success(
        r.alreadyPromoted
          ? "This submission is already in the venture pipeline."
          : "Promoted into the idea pipeline.",
      );
      qc.invalidateQueries({ queryKey: ["innovation-submissions"] });
      qc.invalidateQueries({ queryKey: ["innovation-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
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

  const stats = data?.stats;
  const ideas = data?.ideas ?? [];
  const prototypes = data?.prototypes ?? [];
  const partners = data?.partners ?? [];
  const ideaTitleById = new Map(ideas.map((i) => [i.id, i.title]));
  const newSubmissions = (submissions ?? []).filter((s) => s.status === "new");
  const runningExperiments = (experiments ?? []).filter((e) => e.status === "running");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Lightbulb} label="Total ideas" value={stats?.totalIdeas ?? "—"} />
        <KpiStat icon={Cpu} label="Active prototypes" value={stats?.activePrototypes ?? "—"} />
        <KpiStat icon={Handshake} label="Ecosystem partners" value={stats?.totalPartners ?? "—"} />
        <KpiStat
          icon={Inbox}
          label="Submissions to triage"
          value={submissionsLoading ? "—" : newSubmissions.length}
          hint={
            runningExperiments.length > 0
              ? `${runningExperiments.length} experiments running`
              : undefined
          }
        />
      </div>

      {/* Public intake — no tab of its own, and the only place a submission can
          become a real idea. */}
      <DataPanel
        title={`Public idea submissions (${submissions?.length ?? 0})`}
        action={{ to: "/divisions/innovation-lab/submit", label: "View the public form" }}
      >
        {submissionsLoading ? (
          <p className="text-sm text-muted-foreground">Loading submissions…</p>
        ) : (submissions?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No public submissions yet"
            description="Ideas sent through the public form on the Innovation Lab site land here for triage."
          />
        ) : (
          <div className="divide-y divide-border">
            {submissions?.map((s) => {
              const promoted = /\[promoted:/.test(s.reviewer_notes ?? "");
              return (
                <div key={s.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="text-base font-semibold">{s.idea_title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{s.idea_description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {s.full_name} · {s.email}
                        {s.phone ? ` · ${s.phone}` : ""}
                        {s.category ? ` · ${s.category}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {SUBMISSION_STATUSES.filter((st) => st !== s.status).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => reviewMut.mutate({ id: s.id, status: st })}
                        className="rounded border border-border px-2 py-0.5 text-[10px] capitalize text-muted-foreground transition hover:border-gold hover:text-foreground"
                      >
                        Mark {st}
                      </button>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="ml-auto h-7 text-[11px]"
                      disabled={promoted || promoteMut.isPending}
                      onClick={() => promoteMut.mutate(s.id)}
                    >
                      <Lightbulb className="mr-1 h-3 w-3" />
                      {promoted ? "In the pipeline" : "Promote to idea"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DataPanel>

      {/* Cross-tab state. Each panel is a read-only digest that links to the tab
          where the work actually happens. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DataPanel
          title="Idea pipeline"
          action={{ to: "/portal/divisions/innovation-lab/ideas", label: "Open ideas" }}
        >
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : ideas.length === 0 ? (
            <EmptyState icon={Lightbulb} title="No ideas yet" />
          ) : (
            <ul className="divide-y divide-border">
              {ideas.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate text-sm">{i.title}</span>
                  <StatusBadge status={i.status ?? "concept"} />
                </li>
              ))}
            </ul>
          )}
        </DataPanel>

        <DataPanel
          title="Prototypes in flight"
          action={{ to: "/portal/divisions/innovation-lab/prototypes", label: "Open prototypes" }}
        >
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : prototypes.length === 0 ? (
            <EmptyState icon={Cpu} title="No prototypes registered" />
          ) : (
            <ul className="divide-y divide-border">
              {prototypes.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate text-sm">
                    {p.idea_id ? (ideaTitleById.get(p.idea_id) ?? "Prototype") : "Prototype"}
                  </span>
                  <StatusBadge status={p.status ?? "concept"} />
                </li>
              ))}
            </ul>
          )}
        </DataPanel>

        <DataPanel
          title="Experiments"
          action={{ to: "/portal/divisions/innovation-lab/experiments", label: "Open experiments" }}
        >
          {(experiments?.length ?? 0) === 0 ? (
            <EmptyState icon={FlaskConical} title="No experiments logged yet" />
          ) : (
            <ul className="divide-y divide-border">
              {(experiments ?? []).slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="line-clamp-2 text-sm">{e.hypothesis}</span>
                  <StatusBadge status={e.status} />
                </li>
              ))}
            </ul>
          )}
        </DataPanel>

        <DataPanel
          title="Ecosystem partners"
          action={{ to: "/portal/divisions/innovation-lab/partners", label: "Open partners" }}
        >
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : partners.length === 0 ? (
            <EmptyState
              icon={Handshake}
              title="No partners registered"
              description="Add the corporates, funds and universities the Lab co-builds with."
            />
          ) : (
            <ul className="divide-y divide-border">
              {partners.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate text-sm">{p.name}</span>
                  <span className="shrink-0 text-xs capitalize text-muted-foreground">
                    {p.type?.replace(/_/g, " ") ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DataPanel>
      </div>

      {/* Demo days — scheduling lives here because there is no demo-day tab. */}
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
          <Input
            type="date"
            value={demoDate}
            onChange={(e) => setDemoDate(e.target.value)}
            aria-label="Demo day date"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!demoTitle.trim() || !demoDate || createDemoDayMut.isPending}
          >
            <Calendar className="mr-2 h-4 w-4" /> Schedule
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
                      const proto = prototypes.find((p) => p.id === s.prototype_id);
                      const title = proto?.idea_id ? ideaTitleById.get(proto.idea_id) : undefined;
                      return (
                        <div key={s.id} className="flex items-center justify-between text-xs">
                          <span>{title ?? "Prototype"}</span>
                          <button
                            type="button"
                            aria-label="Remove from demo day"
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
                      if (slotProto && slotDay === day.id) scheduleSlotMut.mutate();
                    }}
                  >
                    <select
                      value={slotDay === day.id ? slotProto : ""}
                      onChange={(e) => {
                        setSlotDay(day.id);
                        setSlotProto(e.target.value);
                      }}
                      aria-label={`Add a prototype to ${day.title}`}
                      className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-xs"
                    >
                      <option value="">Add prototype to this demo day…</option>
                      {prototypes
                        .filter((p) => !slots.some((s) => s.prototype_id === p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.idea_id
                              ? (ideaTitleById.get(p.idea_id) ?? "Prototype")
                              : "Prototype"}
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

      <div className="rounded-xl border border-border bg-surface/60 p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 acc-text" />
          Pitching, prototyping, experiments and partners each have their own tab above.
          <Link
            to="/portal/divisions/innovation-lab/ideas"
            className="inline-flex items-center gap-1 acc-text hover:underline"
          >
            Start with ideas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
