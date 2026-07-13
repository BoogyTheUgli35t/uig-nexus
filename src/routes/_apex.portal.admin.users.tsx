import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Search, Save } from "lucide-react";
import { listAllPortalUsers, updateUserAccess } from "@/lib/portal.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DIVISIONS } from "@/lib/divisions";
import { DataPanel, EmptyState } from "@/components/portal/blocks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_apex/portal/admin/users")({
  head: () => ({ meta: [{ title: "Users — UIG Apex" }, { name: "robots", content: "noindex" }] }),
  component: UsersPage,
});

const ROLE_OPTIONS = ["admin", "staff", "client", "investor", "farmer", "driver"] as const;

function UsersPage() {
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["all-portal-users"],
    queryFn: async () => listAllPortalUsers({ headers: await authHeaders() }),
  });

  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.full_name.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  );

  if (error) return <div className="text-destructive text-sm">{(error as Error).message}</div>;

  const editingRow = data?.find((u) => u.id === editingUser) ?? null;

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gold uppercase tracking-wider">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.length ?? 0} portal account{(data?.length ?? 0) === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataPanel title="All accounts">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No accounts found" />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => setEditingUser(u.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 py-3 text-left first:pt-0 last:pb-0 hover:opacity-80"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{u.full_name || u.email}</div>
                  <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border px-2 py-0.5 capitalize">
                    {u.role ?? "no role"}
                  </span>
                  <span>{u.division_slugs.length} division{u.division_slugs.length === 1 ? "" : "s"}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </DataPanel>

      {editingRow && (
        <EditUserDialog user={editingRow} onClose={() => setEditingUser(null)} />
      )}
    </div>
  );
}

function EditUserDialog({
  user,
  onClose,
}: {
  user: { id: string; email: string; full_name: string; role: string | null; division_slugs: string[] };
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>(
    (user.role as (typeof ROLE_OPTIONS)[number]) ?? "client",
  );
  const [divisions, setDivisions] = useState<string[]>(user.division_slugs);

  const saveMut = useMutation({
    mutationFn: async () =>
      updateUserAccess({
        data: { user_id: user.id, role, division_slugs: divisions },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Access updated");
      qc.invalidateQueries({ queryKey: ["all-portal-users"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleDivision(slug: string) {
    setDivisions((d) => (d.includes(slug) ? d.filter((s) => s !== slug) : [...d, slug]));
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user.full_name || user.email}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof ROLE_OPTIONS)[number])}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm capitalize"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-muted-foreground">
              Division access
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIVISIONS.map((d) => (
                <button
                  key={d.slug}
                  type="button"
                  onClick={() => toggleDivision(d.slug)}
                  className={`rounded border px-2.5 py-1 text-xs transition ${
                    divisions.includes(d.slug)
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {d.short}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
            <Save className="mr-2 h-4 w-4" /> Save access
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
