import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Lock,
  Plus,
  FolderKanban,
  Rocket,
  CheckSquare,
  Plug,
  Cpu,
  CircleDot,
} from "lucide-react";
import { toast } from "sonner";
import { getDivision } from "@/lib/divisions";
import { getMyWorkspace } from "@/lib/divisions.functions";
import {
  getTechWorkspace,
  createTechProject,
  updateTechProjectStatus,
  updateTechTaskStatus,
  PROJECT_STATUSES,
} from "@/lib/tech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { HeroBanner, KpiStat, DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_apex/portal/divisions/technology")({
  head: () => ({ meta: [{ title: "UIG Technology — Workspace" }, { name: "robots", content: "noindex" }] }),
  component: TechnologyWorkspace,
});

const BOARD_COLUMNS: { key: (typeof PROJECT_STATUSES)[number]; label: string }[] = [
  { key: "discovery", label: "Discovery" },
  { key: "building", label: "Building" },
  { key: "review", label: "Review" },
  { key: "live", label: "Live" },
  { key: "paused", label: "Paused" },
];

function TechnologyWorkspace() {
  const division = getDivision("technology")!;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const ws = await getMyWorkspace({ headers: await authHeaders() });
        setHasAccess(ws.isAdmin || ws.divisionSlugs.includes("technology"));
      } catch {
        setHasAccess(false);
      }
    })();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["tech-workspace"],
    enabled: hasAccess === true,
    queryFn: async () => getTechWorkspace({ headers: await authHeaders() }),
  });

  const createMut = useMutation({
    mutationFn: async () =>
      createTechProject({ data: { title, client_name: client }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Project created");
      setTitle("");
      setClient("");
      qc.invalidateQueries({ queryKey: ["tech-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moveMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof PROJECT_STATUSES)[number] }) =>
      updateTechProjectStatus({ data: v, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tech-workspace"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const taskMut = useMutation({
    mutationFn: async (v: { id: string; status: "todo" | "in_progress" | "done" }) =>
      updateTechTaskStatus({ data: v, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tech-workspace"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const tasksByProject = useMemo(() => {
    const map = new Map<string, NonNullable<typeof data>["tasks"]>();
    (data?.tasks ?? []).forEach((t) => {
      const arr = map.get(t.tech_project_id) ?? [];
      arr.push(t);
      map.set(t.tech_project_id, arr);
    });
    return map;
  }, [data]);

  if (hasAccess === null) return <div className="text-muted-foreground">Loading workspace…</div>;

  if (!hasAccess) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={Lock}
          title="No access to UIG Technology"
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
      <Link to="/portal/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <HeroBanner
        division={division}
        eyebrow={division.short}
        title={division.name}
        subtitle="Project delivery, client engagements and the integrations that power them."
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={FolderKanban} label="Active projects" value={stats?.activeProjects ?? "—"} />
        <KpiStat icon={Rocket} label="Live products" value={stats?.liveProjects ?? "—"} />
        <KpiStat icon={CheckSquare} label="Open tasks" value={stats?.openTasks ?? "—"} />
        <KpiStat icon={Plug} label="Integrations" value={stats?.connectedIntegrations ?? "—"} hint="connected" />
      </div>

      {/* New project */}
      <DataPanel title="New engagement">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) createMut.mutate();
          }}
        >
          <Input placeholder="Project title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
          <Input placeholder="Client (optional)" value={client} onChange={(e) => setClient(e.target.value)} maxLength={150} />
          <Button type="submit" disabled={!title.trim() || createMut.isPending} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Add project
          </Button>
        </form>
      </DataPanel>

      {/* Project board */}
      <div>
        <h2 className="text-lg font-semibold">Project board</h2>
        <p className="text-sm text-muted-foreground">Click a status to move a project across the pipeline.</p>
        {isLoading ? (
          <div className="mt-4 text-sm text-muted-foreground">Loading projects…</div>
        ) : (data?.projects.length ?? 0) === 0 ? (
          <div className="mt-4">
            <EmptyState icon={FolderKanban} title="No projects yet" description="Add your first engagement above." />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            {BOARD_COLUMNS.map((col) => {
              const items = (data?.projects ?? []).filter((p) => p.status === col.key);
              return (
                <div key={col.key} className="rounded-xl border border-border bg-surface/50 p-3">
                  <div className="flex items-center justify-between px-1 pb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.label}</span>
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((p) => {
                      const tasks = tasksByProject.get(p.id) ?? [];
                      return (
                        <div key={p.id} className="rounded-lg border border-border bg-background p-3">
                          <div className="text-sm font-medium leading-snug">{p.title}</div>
                          {p.client_name && (
                            <div className="mt-0.5 text-xs text-muted-foreground">{p.client_name}</div>
                          )}
                          <Progress value={p.progress} className="mt-3 h-1.5" />
                          {tasks.length > 0 && (
                            <ul className="mt-3 space-y-1">
                              {tasks.slice(0, 3).map((t) => (
                                <li key={t.id}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      taskMut.mutate({ id: t.id, status: t.status === "done" ? "todo" : "done" })
                                    }
                                    className="flex w-full items-center gap-1.5 text-left text-[11px] text-muted-foreground hover:text-foreground"
                                  >
                                    {t.status === "done" ? (
                                      <CheckSquare className="h-3 w-3 acc-text" />
                                    ) : (
                                      <CircleDot className="h-3 w-3" />
                                    )}
                                    <span className={t.status === "done" ? "line-through" : ""}>{t.title}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-3 flex flex-wrap gap-1">
                            {BOARD_COLUMNS.filter((c) => c.key !== col.key).map((c) => (
                              <button
                                key={c.key}
                                type="button"
                                onClick={() => moveMut.mutate({ id: p.id, status: c.key })}
                                className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition hover:acc-border-soft hover:text-foreground"
                              >
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <p className="px-1 py-4 text-center text-xs text-muted-foreground">Empty</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Integration hub */}
      <DataPanel title="Integration hub">
        {(data?.integrations.length ?? 0) === 0 ? (
          <EmptyState icon={Plug} title="No integrations" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.integrations ?? []).map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg acc-bg-soft acc-text">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.last_sync ? `Synced ${new Date(i.last_sync).toLocaleString()}` : "Never synced"}
                    </div>
                  </div>
                </div>
                <StatusBadge status={i.status} />
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
