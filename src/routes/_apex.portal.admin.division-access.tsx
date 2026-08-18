import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, Trash2 } from "lucide-react";
import {
  listDivisionAdmins,
  appointDivisionAdmin,
  removeDivisionAdmin,
} from "@/lib/division-team.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DIVISIONS } from "@/lib/divisions";
import type { DivisionSlug } from "@/lib/divisions";
import { DataPanel, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_apex/portal/admin/division-access")({
  head: () => ({
    meta: [
      { title: "Division access — UIG Admin" },
      { name: "description", content: "Appoint and remove division admins across UIG divisions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DivisionAccessAdminPage,
});

function DivisionAccessAdminPage() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState<DivisionSlug>("real-estate");

  const admins = useQuery({
    queryKey: ["division-admins"],
    queryFn: async () => listDivisionAdmins({ headers: await authHeaders() }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["division-admins"] });

  const appointMut = useMutation({
    mutationFn: async () =>
      appointDivisionAdmin({ data: { slug, email: email.trim() }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Division admin appointed");
      setEmail("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: async (vars: { slug: DivisionSlug; userId: string }) =>
      removeDivisionAdmin({ data: vars, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Appointment removed");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Link
        to="/portal/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Division access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Division admins manage who belongs to their own division. Only you (a global admin) can
          appoint or remove them.
        </p>
      </div>

      <DataPanel title="Appoint a division admin">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) appointMut.mutate();
          }}
        >
          <div className="min-w-[240px] flex-1 space-y-2">
            <Label htmlFor="appoint-email">Portal account email</Label>
            <Input
              id="appoint-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lead@uig.africa"
            />
          </div>
          <div className="min-w-[200px] space-y-2">
            <Label htmlFor="appoint-division">Division</Label>
            <Select value={slug} onValueChange={(v) => setSlug(v as DivisionSlug)}>
              <SelectTrigger id="appoint-division">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIVISIONS.map((d) => (
                  <SelectItem key={d.slug} value={d.slug}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={!email.trim() || appointMut.isPending}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            {appointMut.isPending ? "Appointing…" : "Appoint"}
          </Button>
        </form>
      </DataPanel>

      <DataPanel title={`Current division admins (${admins.data?.length ?? 0})`}>
        {admins.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (admins.data ?? []).length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No division admins yet"
            description="Appoint your first division lead above."
          />
        ) : (
          <ul className="divide-y divide-border">
            {(admins.data ?? []).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.fullName || a.email || a.userId}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.email} ·{" "}
                    {DIVISIONS.find((d) => d.slug === a.divisionSlug)?.name ?? a.divisionSlug}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    removeMut.mutate({ slug: a.divisionSlug as DivisionSlug, userId: a.userId })
                  }
                  disabled={removeMut.isPending}
                  aria-label={`Remove ${a.email} as ${a.divisionSlug} admin`}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DataPanel>
    </div>
  );
}
