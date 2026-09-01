import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wrench, AlertTriangle, CheckCircle2, Clock, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  listMaintenanceRequests,
  updateMaintenanceRequest,
  linkTenantAccount,
  MAINTENANCE_STATUSES,
} from "@/lib/tenant-portal.functions";
import { getRealEstateWorkspace } from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { KpiStat, DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — UIG Real Estate" }] }),
  component: MaintenancePage,
});

const OPEN_STATUSES = ["open", "acknowledged", "in_progress"] as const;

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—";

/** Age in days, so a request that's been sitting for a fortnight is obvious. */
function ageDays(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function MaintenancePage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [linkTenantId, setLinkTenantId] = useState("");
  const [linkEmail, setLinkEmail] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["maintenance-requests"],
    queryFn: async () => listMaintenanceRequests({ headers: await authHeaders() }),
  });

  const { data: workspace } = useQuery({
    queryKey: ["realestate-workspace"],
    queryFn: async () => getRealEstateWorkspace({ headers: await authHeaders() }),
  });

  const updateMut = useMutation({
    mutationFn: async (v: {
      id: string;
      status: (typeof MAINTENANCE_STATUSES)[number];
      staff_notes?: string;
    }) => updateMaintenanceRequest({ data: v, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Request updated");
      qc.invalidateQueries({ queryKey: ["maintenance-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const linkMut = useMutation({
    mutationFn: async () =>
      linkTenantAccount({
        data: { tenant_id: linkTenantId, email: linkEmail },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Tenant linked — they can now see their lease in the portal");
      setLinkTenantId("");
      setLinkEmail("");
      qc.invalidateQueries({ queryKey: ["realestate-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = requests ?? [];
  const tenantName = useMemo(() => {
    const m = new Map<string, string>();
    (workspace?.tenants ?? []).forEach((t) => m.set(t.id, t.full_name));
    return m;
  }, [workspace]);

  const filtered = rows.filter((r) =>
    statusFilter === "all"
      ? true
      : statusFilter === "open"
        ? (OPEN_STATUSES as readonly string[]).includes(r.status)
        : r.status === statusFilter,
  );

  const openCount = rows.filter((r) =>
    (OPEN_STATUSES as readonly string[]).includes(r.status),
  ).length;
  const urgentOpen = rows.filter(
    (r) => r.priority === "urgent" && (OPEN_STATUSES as readonly string[]).includes(r.status),
  ).length;
  const staleOpen = rows.filter(
    (r) => (OPEN_STATUSES as readonly string[]).includes(r.status) && ageDays(r.created_at) > 7,
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={Wrench} label="Open requests" value={isLoading ? "—" : openCount} />
        <KpiStat
          icon={AlertTriangle}
          label="Urgent"
          value={isLoading ? "—" : urgentOpen}
          hint={urgentOpen > 0 ? "Needs attention" : undefined}
        />
        <KpiStat
          icon={Clock}
          label="Open over a week"
          value={isLoading ? "—" : staleOpen}
          hint={staleOpen > 0 ? "Chase these" : undefined}
        />
        <KpiStat
          icon={CheckCircle2}
          label="Resolved"
          value={isLoading ? "—" : rows.length - openCount}
        />
      </div>

      <DataPanel
        title={`Requests (${filtered.length})`}
        action={
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="open">Open</option>
            <option value="all">All</option>
            {MAINTENANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        }
      >
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading requests…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title={statusFilter === "open" ? "Nothing open" : "No requests"}
            description="Tenants raise these from their My tenancy page."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const age = ageDays(r.created_at);
              const isOpen = (OPEN_STATUSES as readonly string[]).includes(r.status);
              return (
                <div
                  key={r.id}
                  className={`rounded-lg border bg-background p-4 ${
                    r.priority === "urgent" && isOpen ? "border-destructive/40" : "border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {r.tenant_id ? (tenantName.get(r.tenant_id) ?? "Tenant") : "Tenant"} ·{" "}
                        <span className="capitalize">{r.category}</span> · raised{" "}
                        {fmtDate(r.created_at)}
                        {isOpen && age > 7 && (
                          <span className="ml-1 text-amber-600">· open {age} days</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${
                          r.priority === "urgent"
                            ? "bg-destructive/10 text-destructive"
                            : "border border-border text-muted-foreground"
                        }`}
                      >
                        {r.priority}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>

                  {r.description && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {r.description}
                    </p>
                  )}

                  {r.staff_notes && (
                    <p className="mt-2 rounded border border-border bg-surface p-2 text-xs">
                      <span className="text-muted-foreground">Note to tenant: </span>
                      {r.staff_notes}
                    </p>
                  )}

                  <div className="mt-3 grid gap-2 border-t border-border pt-3 sm:grid-cols-[1fr_auto_auto]">
                    <Textarea
                      placeholder="Note back to the tenant (they see this)…"
                      value={noteDrafts[r.id] ?? ""}
                      onChange={(e) => setNoteDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                      rows={1}
                      maxLength={2000}
                      className="min-h-9"
                    />
                    <select
                      aria-label="Set status"
                      value={r.status}
                      onChange={(e) =>
                        updateMut.mutate({
                          id: r.id,
                          status: e.target.value as (typeof MAINTENANCE_STATUSES)[number],
                          staff_notes: noteDrafts[r.id]?.trim() || undefined,
                        })
                      }
                      className="h-9 rounded-md border border-border bg-background px-2 text-xs capitalize"
                    >
                      {MAINTENANCE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!noteDrafts[r.id]?.trim() || updateMut.isPending}
                      onClick={() =>
                        updateMut.mutate({
                          id: r.id,
                          status: r.status as (typeof MAINTENANCE_STATUSES)[number],
                          staff_notes: noteDrafts[r.id]?.trim(),
                        })
                      }
                    >
                      Save note
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DataPanel>

      <DataPanel title="Give a tenant portal access">
        <p className="mb-3 text-sm text-muted-foreground">
          Link a tenancy to an existing UIG portal account so the tenant can see their lease and
          raise maintenance requests themselves. They must have created an account first.
        </p>
        <form
          className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (linkTenantId && linkEmail.trim()) linkMut.mutate();
          }}
        >
          <select
            aria-label="Tenant"
            value={linkTenantId}
            onChange={(e) => setLinkTenantId(e.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Choose a tenant…</option>
            {(workspace?.tenants ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
          <Input
            type="email"
            placeholder="Their portal account email"
            value={linkEmail}
            onChange={(e) => setLinkEmail(e.target.value)}
          />
          <Button type="submit" disabled={!linkTenantId || !linkEmail.trim() || linkMut.isPending}>
            <Link2 className="mr-2 h-4 w-4" /> Link
          </Button>
        </form>
      </DataPanel>
    </div>
  );
}
