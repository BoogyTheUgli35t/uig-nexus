import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Rocket,
  ShieldAlert,
  Siren,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEPLOY_ENVIRONMENTS,
  DEPLOY_STATUSES,
  STATUS_COMPONENT_STATUSES,
  STATUS_INCIDENT_SEVERITIES,
  STATUS_INCIDENT_STATUSES,
  addDeployment,
  createIncident,
  getTechWorkspace,
  listDeployments,
  listStatusComponents,
  listStatusIncidents,
  updateComponentStatus,
  updateIncidentStatus,
} from "@/lib/tech.functions";
import { authHeaders } from "@/lib/auth-headers";
import {
  DataPanel,
  EmptyState,
  KpiStat,
  QueryError,
  StatusBadge,
} from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_apex/portal/divisions/technology/operations")({
  head: () => ({ meta: [{ title: "Operations — UIG Technology" }] }),
  component: OperationsPage,
});

const COMPONENT_STATUS_META: Record<string, { label: string; className: string }> = {
  operational: { label: "Operational", className: "text-emerald-400 border-emerald-400/30" },
  degraded: { label: "Degraded", className: "text-amber-400 border-amber-400/30" },
  partial_outage: { label: "Partial outage", className: "text-orange-400 border-orange-400/30" },
  major_outage: { label: "Major outage", className: "text-destructive border-destructive/40" },
};

const SEVERITY_LABELS: Record<string, string> = {
  minor: "Minor",
  major: "Major",
  critical: "Critical",
};

/**
 * Technology operations: shipping and uptime.
 *
 * Both halves were fully built on the server and reachable from nowhere. The
 * `deployments` table and `addDeployment` had no UI at all, and the five
 * status-page functions had none either — so the public /status page told
 * visitors it was "updated by the Technology team" while giving that team no
 * way to update it, and no way to declare an incident.
 */
function OperationsPage() {
  const qc = useQueryClient();

  const [projectId, setProjectId] = useState("");
  const [version, setVersion] = useState("");
  const [environment, setEnvironment] = useState<(typeof DEPLOY_ENVIRONMENTS)[number]>("staging");
  const [deployStatus, setDeployStatus] = useState<(typeof DEPLOY_STATUSES)[number]>("success");
  const [notes, setNotes] = useState("");

  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentBody, setIncidentBody] = useState("");
  const [severity, setSeverity] = useState<(typeof STATUS_INCIDENT_SEVERITIES)[number]>("minor");
  const [incidentComponent, setIncidentComponent] = useState("");

  const {
    data: workspace,
    error: loadError,
    refetch: reload,
  } = useQuery({
    queryKey: ["tech-workspace"],
    queryFn: async () => getTechWorkspace({ headers: await authHeaders() }),
  });

  const { data: deployments, isLoading: deploymentsLoading } = useQuery({
    queryKey: ["tech-deployments"],
    queryFn: async () => listDeployments({ headers: await authHeaders() }),
  });

  const { data: components, isLoading: componentsLoading } = useQuery({
    queryKey: ["status-components"],
    queryFn: async () => listStatusComponents({ headers: await authHeaders() }),
  });

  const { data: incidents } = useQuery({
    queryKey: ["status-incidents"],
    queryFn: async () => listStatusIncidents({ headers: await authHeaders() }),
  });

  const projects = workspace?.projects ?? [];
  const projectTitle = new Map(projects.map((p) => [p.id, p.title]));

  const deployMut = useMutation({
    mutationFn: async () =>
      addDeployment({
        data: {
          tech_project_id: projectId,
          version,
          environment,
          status: deployStatus,
          notes,
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Deployment logged");
      setVersion("");
      setNotes("");
      qc.invalidateQueries({ queryKey: ["tech-deployments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const componentMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof STATUS_COMPONENT_STATUSES)[number] }) =>
      updateComponentStatus({ data: v, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Public status updated");
      qc.invalidateQueries({ queryKey: ["status-components"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const incidentMut = useMutation({
    mutationFn: async () =>
      createIncident({
        data: {
          title: incidentTitle,
          body: incidentBody,
          severity,
          component_id: incidentComponent,
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Incident published to the status page");
      setIncidentTitle("");
      setIncidentBody("");
      setIncidentComponent("");
      qc.invalidateQueries({ queryKey: ["status-incidents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const incidentStatusMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof STATUS_INCIDENT_STATUSES)[number] }) =>
      updateIncidentStatus({ data: v, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["status-incidents"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const componentRows = components ?? [];
  const incidentRows = incidents ?? [];
  const openIncidents = incidentRows.filter((i) => i.status !== "resolved");
  const degraded = componentRows.filter((c) => c.status !== "operational");
  const failedDeploys = (deployments ?? []).filter((d) => d.status === "failed");

  if (loadError)
    return (
      <QueryError error={loadError} onRetry={() => reload()} label="the operations workspace" />
    );
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat
          icon={Rocket}
          label="Deployments logged"
          value={deploymentsLoading ? "—" : (deployments?.length ?? 0)}
          hint={failedDeploys.length > 0 ? `${failedDeploys.length} failed` : undefined}
        />
        <KpiStat
          icon={CheckCircle2}
          label="Components operational"
          value={
            componentsLoading
              ? "—"
              : `${componentRows.length - degraded.length}/${componentRows.length}`
          }
        />
        <KpiStat icon={Siren} label="Open incidents" value={openIncidents.length} />
        <KpiStat icon={ShieldAlert} label="SLA at risk" value={workspace?.stats.slaAtRisk ?? "—"} />
      </div>

      {/* ---------------- Deployments ---------------- */}
      <DataPanel title="Log a deployment">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (projectId && version.trim()) deployMut.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              aria-label="Project"
              required
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <Input
              placeholder="Version, e.g. v1.4.2"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              maxLength={60}
              required
            />
            <select
              value={environment}
              onChange={(e) =>
                setEnvironment(e.target.value as (typeof DEPLOY_ENVIRONMENTS)[number])
              }
              aria-label="Environment"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm capitalize shadow-sm"
            >
              {DEPLOY_ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
            <select
              value={deployStatus}
              onChange={(e) => setDeployStatus(e.target.value as (typeof DEPLOY_STATUSES)[number])}
              aria-label="Deployment outcome"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm capitalize shadow-sm"
            >
              {DEPLOY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Textarea
            placeholder="Release notes — what shipped, anything to watch (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={1000}
          />
          <Button
            type="submit"
            disabled={!projectId || !version.trim() || deployMut.isPending}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            <Upload className="mr-2 h-4 w-4" /> Log deployment
          </Button>
        </form>
      </DataPanel>

      <DataPanel title={`Release history (${deployments?.length ?? 0})`}>
        {deploymentsLoading ? (
          <p className="text-sm text-muted-foreground">Loading deployments…</p>
        ) : (deployments?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No deployments logged yet"
            description="Log one above and it becomes the release history for that project."
          />
        ) : (
          <ul className="divide-y divide-border">
            {(deployments ?? []).map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 py-3">
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    d.status === "failed"
                      ? "bg-destructive/10 text-destructive"
                      : d.status === "pending"
                        ? "bg-surface-elevated text-muted-foreground"
                        : "acc-bg-soft acc-text",
                  )}
                >
                  {d.status === "failed" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Rocket className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold">
                      {projectTitle.get(d.tech_project_id) ?? "Project"}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{d.version}</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {d.environment}
                    </span>
                  </div>
                  {d.notes && <p className="mt-1 text-xs text-muted-foreground">{d.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={d.status} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DataPanel>

      {/* ---------------- Public status ---------------- */}
      <DataPanel
        title="Public status page"
        action={{ to: "/status", label: "View the public page" }}
      >
        <p className="text-xs text-muted-foreground">
          These are the components visitors see at /status. Changing one here changes the public
          page immediately.
        </p>
        <div className="mt-4">
          {componentsLoading ? (
            <p className="text-sm text-muted-foreground">Loading components…</p>
          ) : componentRows.length === 0 ? (
            <EmptyState icon={CircleDot} title="No status components configured" />
          ) : (
            <ul className="divide-y divide-border">
              {componentRows.map((c) => {
                const meta = COMPONENT_STATUS_META[c.status] ?? {
                  label: c.status,
                  className: "text-muted-foreground border-border",
                };
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{c.name}</div>
                      {c.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px]",
                        meta.className,
                      )}
                    >
                      {meta.label}
                    </span>
                    <select
                      value={c.status}
                      onChange={(e) =>
                        componentMut.mutate({
                          id: c.id,
                          status: e.target.value as (typeof STATUS_COMPONENT_STATUSES)[number],
                        })
                      }
                      aria-label={`Set status for ${c.name}`}
                      className="h-8 shrink-0 rounded-md border border-input bg-transparent px-2 text-xs shadow-sm"
                    >
                      {STATUS_COMPONENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {COMPONENT_STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DataPanel>

      <DataPanel title="Declare an incident">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (incidentTitle.trim()) incidentMut.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1.4fr]">
            <Input
              placeholder="What's happening? e.g. Portal sign-in is slow"
              value={incidentTitle}
              onChange={(e) => setIncidentTitle(e.target.value)}
              maxLength={180}
              required
            />
            <select
              value={severity}
              onChange={(e) =>
                setSeverity(e.target.value as (typeof STATUS_INCIDENT_SEVERITIES)[number])
              }
              aria-label="Severity"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              {STATUS_INCIDENT_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {SEVERITY_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              value={incidentComponent}
              onChange={(e) => setIncidentComponent(e.target.value)}
              aria-label="Affected component"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              <option value="">Affected component (optional)</option>
              {componentRows.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Textarea
            placeholder="What visitors should know — impact, workaround, next update (optional)"
            value={incidentBody}
            onChange={(e) => setIncidentBody(e.target.value)}
            rows={2}
            maxLength={2000}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!incidentTitle.trim() || incidentMut.isPending}
          >
            <Siren className="mr-2 h-4 w-4" /> Publish incident
          </Button>
        </form>
      </DataPanel>

      <DataPanel title={`Incident history (${incidentRows.length})`}>
        {incidentRows.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No incidents on record"
            description="The public page reads this list — an empty one is the good outcome."
          />
        ) : (
          <ul className="divide-y divide-border">
            {incidentRows.map((i) => (
              <li key={i.id} className="space-y-2 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{i.title}</span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {SEVERITY_LABELS[i.severity] ?? i.severity}
                      </span>
                    </div>
                    {i.body && <p className="mt-1 text-xs text-muted-foreground">{i.body}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Opened {new Date(i.created_at).toLocaleString()}
                      {i.resolved_at
                        ? ` · resolved ${new Date(i.resolved_at).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge status={i.status} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {STATUS_INCIDENT_STATUSES.filter((s) => s !== i.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => incidentStatusMut.mutate({ id: i.id, status: s })}
                      className="rounded border border-border px-2 py-0.5 text-[10px] capitalize text-muted-foreground transition hover:border-gold hover:text-foreground"
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DataPanel>
    </div>
  );
}
