import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Layers, Pencil, Users } from "lucide-react";
import { getAgriWorkspace, renameCooperative } from "@/lib/agritech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/divisions/agritech/cooperatives")({
  component: CooperativesPage,
});

function CooperativesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["agri-workspace"],
    queryFn: async () => getAgriWorkspace({ headers: await authHeaders() }),
  });

  const groups = useMemo(() => {
    const m = new Map<string, { count: number; hectares: number }>();
    (data?.farmers ?? []).forEach((f) => {
      const key = f.cooperative ?? "Unassigned";
      const g = m.get(key) ?? { count: 0, hectares: 0 };
      g.count += 1;
      g.hectares += Number(f.hectares ?? 0);
      m.set(key, g);
    });
    return Array.from(m.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [data]);

  const renameMut = useMutation({
    mutationFn: async (from: string) =>
      renameCooperative({ data: { from, to: newName }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Cooperative renamed");
      setEditing(null);
      setNewName("");
      qc.invalidateQueries({ queryKey: ["agri-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Cooperatives</h2>
        <p className="text-sm text-muted-foreground">
          Farmers grouped by cooperative. Renaming updates every member at once.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : groups.length === 0 ? (
        <EmptyState icon={Layers} title="No cooperatives yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(([name, g]) => (
            <div key={name} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 acc-text" />
                  <span className="font-medium">{name}</span>
                </div>
                {name !== "Unassigned" && (
                  <button
                    onClick={() => {
                      setEditing(name);
                      setNewName(name);
                    }}
                    className="text-muted-foreground transition hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {g.count} farmer{g.count === 1 ? "" : "s"}
                </span>
                <span>{Math.round(g.hectares * 10) / 10} ha</span>
              </div>
              {editing === name && (
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newName.trim()) renameMut.mutate(name);
                  }}
                >
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 text-xs"
                    maxLength={150}
                  />
                  <Button type="submit" size="sm" className="h-8" disabled={renameMut.isPending}>
                    Save
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
