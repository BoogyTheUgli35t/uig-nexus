import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";
import {
  listTechProjects,
  updateTechProjectStatus,
  PROJECT_STATUSES,
} from "@/lib/tech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_apex/portal/divisions/technology/projects/")({
  component: ProjectsBoard,
});

const BOARD_COLUMNS: { key: (typeof PROJECT_STATUSES)[number]; label: string }[] = [
  { key: "discovery", label: "Discovery" },
  { key: "building", label: "Building" },
  { key: "review", label: "Review" },
  { key: "live", label: "Live" },
  { key: "paused", label: "Paused" },
];

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

function ProjectsBoard() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["tech-projects", search],
    queryFn: async () =>
      listTechProjects({ headers: await authHeaders(), data: { search: search || undefined } }),
  });

  const moveMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof PROJECT_STATUSES)[number] }) =>
      updateTechProjectStatus({ data: v, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tech-projects"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const projects = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Project board</h2>
          <p className="text-sm text-muted-foreground">Click a status pill to move a project.</p>
        </div>
        <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Link to="/portal/divisions/technology/projects/new">
            <Plus className="mr-2 h-4 w-4" /> New engagement
          </Link>
        </Button>
      </div>

      <div className="flex gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
            <X className="mr-1 h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading projects…</div>
      ) : projects.length === 0 ? (
        <EmptyState icon={Plus} title="No projects found" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {BOARD_COLUMNS.map((col) => {
            const items = projects.filter((p) => p.status === col.key);
            return (
              <div key={col.key} className="rounded-xl border border-border bg-surface/50 p-3">
                <div className="flex items-center justify-between px-1 pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {col.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="px-1 py-4 text-center text-xs text-muted-foreground">Empty</p>
                  ) : (
                    items.map((p) => (
                      <div key={p.id} className="rounded-lg border border-border bg-background p-3">
                        <Link
                          to="/portal/divisions/technology/projects/$id"
                          params={{ id: p.id }}
                          className="block hover:acc-text"
                        >
                          <div className="text-sm font-medium leading-snug">{p.title}</div>
                          {p.client_name && (
                            <div className="mt-0.5 text-xs text-muted-foreground">{p.client_name}</div>
                          )}
                        </Link>
                        <Progress value={p.progress} className="mt-3 h-1.5" />
                        {p.budget ? (
                          <div className="mt-2 text-[11px] text-muted-foreground">
                            {naira(Number(p.budget))}
                          </div>
                        ) : null}
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
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
