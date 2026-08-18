import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, UserMinus, Check, X, Lock } from "lucide-react";
import {
  listDivisionMembers,
  grantDivisionAccess,
  revokeDivisionAccess,
  listDivisionAccessRequests,
  resolveDivisionAccessRequest,
} from "@/lib/division-team.functions";
import { authHeaders } from "@/lib/auth-headers";
import { useIsDivisionAdmin } from "@/hooks/use-division-access";
import { DataPanel, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DivisionSlug } from "@/lib/divisions";

/**
 * Team management for a single division. Visible only to division admins and
 * global admins; every action is re-authorised server-side.
 */
export function DivisionTeam({ slug }: { slug: DivisionSlug }) {
  const qc = useQueryClient();
  const isDivisionAdmin = useIsDivisionAdmin(slug);
  const [email, setEmail] = useState("");

  const members = useQuery({
    queryKey: ["division-members", slug],
    enabled: isDivisionAdmin,
    queryFn: async () => listDivisionMembers({ data: { slug }, headers: await authHeaders() }),
  });

  const requests = useQuery({
    queryKey: ["division-requests", slug],
    enabled: isDivisionAdmin,
    queryFn: async () =>
      listDivisionAccessRequests({ data: { slug }, headers: await authHeaders() }),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["division-members", slug] });
    qc.invalidateQueries({ queryKey: ["division-requests", slug] });
  };

  const grantMut = useMutation({
    mutationFn: async () =>
      grantDivisionAccess({ data: { slug, email: email.trim() }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Access granted");
      setEmail("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: async (userId: string) =>
      revokeDivisionAccess({ data: { slug, userId }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Access revoked");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resolveMut = useMutation({
    mutationFn: async (vars: { id: string; decision: "approved" | "rejected" }) =>
      resolveDivisionAccessRequest({
        data: { slug, id: vars.id, decision: vars.decision },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Request updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isDivisionAdmin) {
    return (
      <EmptyState
        icon={Lock}
        title="Division admins only"
        description="Ask a UIG administrator to make you an admin of this division to manage its team."
      />
    );
  }

  const pending = (requests.data ?? []).filter((r) => r.status === "pending");

  return (
    <div className="space-y-6">
      <DataPanel title="Add a teammate">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) grantMut.mutate();
          }}
        >
          <div className="min-w-[260px] flex-1 space-y-2">
            <Label htmlFor="grant-email">Portal account email</Label>
            <Input
              id="grant-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@uig.africa"
            />
          </div>
          <Button type="submit" disabled={!email.trim() || grantMut.isPending}>
            <UserPlus className="mr-2 h-4 w-4" />
            {grantMut.isPending ? "Granting…" : "Grant access"}
          </Button>
        </form>
      </DataPanel>

      <DataPanel title={`Members (${members.data?.length ?? 0})`}>
        {members.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading members…</p>
        ) : (members.data ?? []).length === 0 ? (
          <EmptyState icon={UserPlus} title="No members yet" description="Grant access above." />
        ) : (
          <ul className="divide-y divide-border">
            {(members.data ?? []).map((m) => (
              <li key={m.userId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {m.fullName || m.email || m.userId}
                    {m.isDivisionAdmin && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                        <ShieldCheck className="h-3 w-3" /> Division admin
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeMut.mutate(m.userId)}
                  disabled={revokeMut.isPending}
                  aria-label={`Revoke access for ${m.email || m.userId}`}
                >
                  <UserMinus className="mr-2 h-4 w-4" /> Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DataPanel>

      <DataPanel title={`Pending access requests (${pending.length})`}>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing waiting on you.</p>
        ) : (
          <ul className="divide-y divide-border">
            {pending.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.email} · {r.requested_role}
                    {r.reason ? ` · ${r.reason}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => resolveMut.mutate({ id: r.id, decision: "approved" })}
                    disabled={resolveMut.isPending}
                  >
                    <Check className="mr-2 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resolveMut.mutate({ id: r.id, decision: "rejected" })}
                    disabled={resolveMut.isPending}
                  >
                    <X className="mr-2 h-4 w-4" /> Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DataPanel>
    </div>
  );
}
