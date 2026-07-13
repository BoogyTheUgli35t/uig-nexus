import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserCheck, Check, X, Clock } from "lucide-react";
import {
  listAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} from "@/lib/portal.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DIVISIONS } from "@/lib/divisions";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_apex/portal/admin/access-requests")({
  head: () => ({
    meta: [{ title: "Access requests — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: AccessRequestsPage,
});

const ROLE_OPTIONS = ["client", "investor", "farmer", "driver", "staff", "admin"] as const;

function AccessRequestsPage() {
  const qc = useQueryClient();
  const [selections, setSelections] = useState<Record<string, { role: string; divisions: string[] }>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["access-requests"],
    queryFn: async () => listAccessRequests({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["access-requests"] });

  const approveMut = useMutation({
    mutationFn: async (id: string) => {
      const sel = selections[id] ?? { role: "client", divisions: [] };
      return approveAccessRequest({
        data: { id, role: sel.role as (typeof ROLE_OPTIONS)[number], division_slugs: sel.divisions },
        headers: await authHeaders(),
      });
    },
    onSuccess: (r) => {
      toast.success(
        r.hasAccount
          ? "Approved — access granted."
          : "Approved — they'll get access once they create a portal account with this email.",
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: async (id: string) => rejectAccessRequest({ data: { id }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Request declined");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = useMemo(() => (data ?? []).filter((r) => r.status === "pending"), [data]);
  const resolved = useMemo(() => (data ?? []).filter((r) => r.status !== "pending"), [data]);

  function selFor(id: string) {
    return selections[id] ?? { role: "client", divisions: [] };
  }

  function setRole(id: string, role: string) {
    setSelections((s) => ({ ...s, [id]: { ...selFor(id), role } }));
  }

  function toggleDivision(id: string, slug: string) {
    setSelections((s) => {
      const cur = selFor(id);
      const has = cur.divisions.includes(slug);
      return {
        ...s,
        [id]: { ...cur, divisions: has ? cur.divisions.filter((d) => d !== slug) : [...cur.divisions, slug] },
      };
    });
  }

  if (error) return <div className="text-destructive text-sm">{(error as Error).message}</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="text-sm text-gold uppercase tracking-wider">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Access requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review pending requests, set a role and division access, then approve or decline.
        </p>
      </div>

      <DataPanel title={`Pending (${pending.length})`}>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : pending.length === 0 ? (
          <EmptyState icon={UserCheck} title="No pending requests" />
        ) : (
          <div className="space-y-4">
            {pending.map((r) => {
              const sel = selFor(r.id);
              return (
                <div key={r.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Requested: <span className="capitalize">{r.requested_role}</span>
                        {!r.user_id && " · no portal account yet"}
                      </div>
                      {r.reason && <p className="mt-2 text-xs text-muted-foreground">{r.reason}</p>}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
                    <select
                      value={sel.role}
                      onChange={(e) => setRole(r.id, e.target.value)}
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap gap-1">
                      {DIVISIONS.map((d) => (
                        <button
                          key={d.slug}
                          type="button"
                          onClick={() => toggleDivision(r.id, d.slug)}
                          className={`rounded border px-2 py-1 text-[10px] transition ${
                            sel.divisions.includes(d.slug)
                              ? "border-gold bg-gold/10 text-gold"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {d.short}
                        </button>
                      ))}
                    </div>
                    <div className="ml-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={rejectMut.isPending}
                        onClick={() => rejectMut.mutate(r.id)}
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" /> Decline
                      </Button>
                      <Button size="sm" disabled={approveMut.isPending} onClick={() => approveMut.mutate(r.id)}>
                        <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DataPanel>

      {resolved.length > 0 && (
        <DataPanel title={`Resolved (${resolved.length})`}>
          <div className="divide-y divide-border">
            {resolved.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <span className="font-medium">{r.name}</span>{" "}
                  <span className="text-xs text-muted-foreground">{r.email}</span>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </DataPanel>
      )}
    </div>
  );
}
