import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Home,
  CalendarClock,
  Wrench,
  FileText,
  AlertTriangle,
  CreditCard,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMyTenancy,
  raiseMaintenanceRequest,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_PRIORITIES,
} from "@/lib/tenant-portal.functions";
import { authHeaders } from "@/lib/auth-headers";
import { KpiStat, DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_apex/portal/my-tenancy")({
  head: () => ({
    meta: [{ title: "My tenancy — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: MyTenancyPage,
});

const naira = (n: number) => `₦${Number(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

function MyTenancyPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof MAINTENANCE_CATEGORIES)[number]>("general");
  const [priority, setPriority] = useState<(typeof MAINTENANCE_PRIORITIES)[number]>("normal");

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-tenancy"],
    queryFn: async () => getMyTenancy({ headers: await authHeaders() }),
  });

  const raiseMut = useMutation({
    mutationFn: async () =>
      raiseMaintenanceRequest({
        data: { title, description, category, priority },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Maintenance request sent to your property manager");
      setTitle("");
      setDescription("");
      setCategory("general");
      setPriority("normal");
      qc.invalidateQueries({ queryKey: ["my-tenancy"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <div className="text-sm text-destructive">{(error as Error).message}</div>;
  if (isLoading) return <div className="text-sm text-muted-foreground">Loading your tenancy…</div>;

  if (!data?.linked) {
    return (
      <div className="max-w-lg">
        <EmptyState
          icon={Home}
          title="No tenancy linked to your account"
          description="If you rent a UIG-managed property, ask your property manager to link this email address to your tenancy. Your lease, payments and maintenance requests will appear here once they do."
        />
      </div>
    );
  }

  const { tenant, property, unit, requests, summary } = data;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wider text-gold">My tenancy</p>
        <h1 className="mt-2 text-3xl font-bold">{property?.title ?? "Your home"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {[unit?.unit_number ? `Unit ${unit.unit_number}` : null, property?.address, property?.city]
            .filter(Boolean)
            .join(" · ") || "Lease details below."}
        </p>
      </div>

      {summary.leaseExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            Your lease ended on {fmtDate(tenant.lease_end)}. Contact your property manager about
            renewal.
          </div>
        </div>
      )}
      {summary.leaseExpiringSoon && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-600">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Your lease ends in {summary.daysRemaining} days ({fmtDate(tenant.lease_end)}). Renewal is
            usually agreed a month ahead.
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={CreditCard} label="Rent" value={naira(tenant.rent_amount)} hint="per period" />
        <KpiStat
          icon={CalendarClock}
          label="Lease ends"
          value={fmtDate(tenant.lease_end)}
          hint={summary.daysRemaining !== null ? `${summary.daysRemaining} days` : undefined}
        />
        <KpiStat icon={Home} label="Payment status" value={tenant.payment_status ?? "—"} />
        <KpiStat icon={Wrench} label="Open requests" value={summary.openRequests} />
      </div>

      <DataPanel title="Lease">
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Tenant</dt>
            <dd className="mt-0.5 font-medium">{tenant.full_name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Term</dt>
            <dd className="mt-0.5 font-medium">
              {fmtDate(tenant.lease_start)} — {fmtDate(tenant.lease_end)}
            </dd>
          </div>
          {unit && (
            <div>
              <dt className="text-xs text-muted-foreground">Unit</dt>
              <dd className="mt-0.5 font-medium">
                {unit.unit_number}
                {unit.bedrooms ? ` · ${unit.bedrooms} bed` : ""}
                {unit.area_sqm ? ` · ${unit.area_sqm} m²` : ""}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted-foreground">Signature</dt>
            <dd className="mt-0.5">
              <StatusBadge status={tenant.lease_signature_status ?? "unsigned"} />
              {tenant.lease_signed_at && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {fmtDate(tenant.lease_signed_at)}
                </span>
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {tenant.lease_document_path ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" /> Lease document on file — ask your manager for a copy.
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">No lease document uploaded yet.</span>
          )}
        </div>
      </DataPanel>

      <DataPanel title="Report a maintenance issue">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) raiseMut.mutate();
          }}
        >
          <Input
            placeholder="What's the problem? e.g. Kitchen tap is leaking"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
          />
          <Textarea
            placeholder="Any detail that helps — when it started, which room, whether it's getting worse."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <select
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof MAINTENANCE_CATEGORIES)[number])}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm capitalize"
            >
              {MAINTENANCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              aria-label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as (typeof MAINTENANCE_PRIORITIES)[number])}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm capitalize"
            >
              {MAINTENANCE_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={!title.trim() || raiseMut.isPending}>
              <Plus className="mr-2 h-4 w-4" /> {raiseMut.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      </DataPanel>

      <DataPanel title={`Your requests (${requests.length})`}>
        {requests.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance requests yet"
            description="Anything you report above shows here with its status."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                      {r.priority}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
                {r.description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span className="capitalize">{r.category}</span>
                  <span>Reported {fmtDate(r.created_at)}</span>
                  {r.resolved_at && <span>Resolved {fmtDate(r.resolved_at)}</span>}
                </div>
                {r.staff_notes && (
                  <p className="mt-2 rounded border border-border bg-surface p-2 text-xs">
                    <span className="text-muted-foreground">From your manager: </span>
                    {r.staff_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
