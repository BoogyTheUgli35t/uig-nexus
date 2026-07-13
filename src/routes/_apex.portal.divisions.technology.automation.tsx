import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Workflow, Plus, Play, Zap, Info } from "lucide-react";
import {
  listAutomationRules,
  createAutomationRule,
  toggleAutomationRule,
  runAutomationRuleNow,
  listTechProjects,
  TRIGGER_TYPES,
  ACTION_TYPES,
} from "@/lib/tech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_apex/portal/divisions/technology/automation")({
  component: AutomationPage,
});

function AutomationPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [triggerType, setTriggerType] = useState<(typeof TRIGGER_TYPES)[number]>("manual");
  const [actionType, setActionType] = useState<(typeof ACTION_TYPES)[number]>("notify");

  const { data: rules, isLoading } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => listAutomationRules({ headers: await authHeaders() }),
  });

  const { data: projects } = useQuery({
    queryKey: ["tech-projects-all"],
    queryFn: async () => listTechProjects({ headers: await authHeaders(), data: {} }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["automation-rules"] });

  const createMut = useMutation({
    mutationFn: async () =>
      createAutomationRule({
        data: { name, tech_project_id: projectId || undefined, trigger_type: triggerType, action_type: actionType },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Rule created");
      setName("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async (v: { id: string; enabled: boolean }) =>
      toggleAutomationRule({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const runMut = useMutation({
    mutationFn: async (id: string) =>
      runAutomationRuleNow({ data: { id }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Rule executed (simulated)");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Automation rules</h2>
        <p className="text-sm text-muted-foreground">
          Trigger-based workflow rules for your engagements.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 text-gold mt-0.5" />
        <span>
          There's no live trigger engine wired up yet — rules don't fire automatically on real
          events. Use <strong>Run now</strong> to simulate an execution; the run counter and
          "notify" actions are real, everything else is logged only.
        </span>
      </div>

      <DataPanel title="New rule">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createMut.mutate();
          }}
        >
          <Input
            className="lg:col-span-2"
            placeholder="Rule name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={150}
          />
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">All projects</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as (typeof TRIGGER_TYPES)[number])}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {TRIGGER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value as (typeof ACTION_TYPES)[number])}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {ACTION_TYPES.map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={!name.trim() || createMut.isPending}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create rule
          </Button>
        </form>
      </DataPanel>

      <DataPanel title="Rules">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !rules || rules.length === 0 ? (
          <EmptyState icon={Workflow} title="No automation rules yet" />
        ) : (
          <div className="space-y-3">
            {rules.map((r) => {
              const projectTitle = (r as { tech_projects?: { title: string } | null }).tech_projects
                ?.title;
              return (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 acc-text shrink-0" />
                    <span className="font-medium text-sm">{r.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    When <strong className="text-foreground">{r.trigger_type.replace(/_/g, " ")}</strong>{" "}
                    → <strong className="text-foreground">{r.action_type.replace(/_/g, " ")}</strong>
                    {projectTitle ? ` · ${projectTitle}` : " · all projects"}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Ran {r.run_count} time{r.run_count === 1 ? "" : "s"}
                    {r.last_run_at ? ` · last ${new Date(r.last_run_at).toLocaleString()}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={(v) => toggleMut.mutate({ id: r.id, enabled: v })}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={runMut.isPending}
                    onClick={() => runMut.mutate(r.id)}
                  >
                    <Play className="mr-1.5 h-3.5 w-3.5" /> Run now
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
