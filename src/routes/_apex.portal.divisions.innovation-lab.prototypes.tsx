import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Cpu, GitBranch, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  getInnovationWorkspace,
  createPrototype,
  updatePrototypeStatus,
  PROTOTYPE_STATUSES,
} from "@/lib/innovation.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { DataPanel, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/divisions/innovation-lab/prototypes")({
  head: () => ({ meta: [{ title: "Prototypes — UIG Innovation Lab" }] }),
  component: PrototypesPage,
});

const STAGE_LABELS: Record<(typeof PROTOTYPE_STATUSES)[number], string> = {
  concept: "Concept",
  design: "Design",
  build: "Build",
  pilot: "Pilot",
  ready: "Ready",
};

function shotUrl(path: string) {
  return supabase.storage.from("prototype-images").getPublicUrl(path).data.publicUrl;
}

function PrototypesPage() {
  const qc = useQueryClient();
  const [protoIdeaId, setProtoIdeaId] = useState("");
  const [protoRepo, setProtoRepo] = useState("");
  const [protoDemo, setProtoDemo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["innovation-workspace"],
    queryFn: async () => getInnovationWorkspace({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["innovation-workspace"] });

  const protoMut = useMutation({
    mutationFn: async () =>
      createPrototype({
        data: { idea_id: protoIdeaId, repo_link: protoRepo, demo_link: protoDemo },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Prototype created");
      setProtoIdeaId("");
      setProtoRepo("");
      setProtoDemo("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof PROTOTYPE_STATUSES)[number] }) =>
      updatePrototypeStatus({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const ideas = data?.ideas ?? [];
  const prototypes = data?.prototypes ?? [];
  const ideaTitle = new Map(ideas.map((i) => [i.id, i.title]));

  return (
    <div className="space-y-6">
      <DataPanel title="Start a prototype">
        <form
          className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (protoIdeaId) protoMut.mutate();
          }}
        >
          <select
            value={protoIdeaId}
            onChange={(e) => setProtoIdeaId(e.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">Pick an idea…</option>
            {ideas.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </select>
          <Input
            placeholder="Repo link (optional)"
            value={protoRepo}
            onChange={(e) => setProtoRepo(e.target.value)}
            maxLength={300}
          />
          <Input
            placeholder="Demo link (optional)"
            value={protoDemo}
            onChange={(e) => setProtoDemo(e.target.value)}
            maxLength={300}
          />
          <Button type="submit" disabled={!protoIdeaId || protoMut.isPending} variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </DataPanel>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading prototypes…</div>
      ) : prototypes.length === 0 ? (
        <EmptyState icon={Cpu} title="No prototypes yet" description="Promote an idea into a prototype above." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PROTOTYPE_STATUSES.map((stage) => {
            const items = prototypes.filter((p) => p.status === stage);
            return (
              <div key={stage} className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center justify-between px-1 pb-2 text-xs font-medium text-muted-foreground">
                  <span>{STAGE_LABELS[stage]}</span>
                  <span>{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border py-4 text-center text-[11px] text-muted-foreground">
                      Empty
                    </div>
                  ) : (
                    items.map((p) => {
                      const shots = Array.isArray(p.screenshots) ? (p.screenshots as string[]) : [];
                      return (
                      <div key={p.id} className="rounded-lg border border-border bg-background p-3">
                        <div className="text-sm font-medium leading-snug">
                          {p.idea_id ? (ideaTitle.get(p.idea_id) ?? "Prototype") : "Prototype"}
                        </div>
                        {shots.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            {shots.slice(0, 2).map((s) => (
                              <img
                                key={s}
                                src={shotUrl(s)}
                                alt="Prototype screenshot"
                                loading="lazy"
                                className="aspect-video rounded object-cover"
                              />
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                          {p.repo_link && (
                            <a
                              href={p.repo_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-muted-foreground hover:acc-text"
                            >
                              <GitBranch className="h-3 w-3" /> Repo
                            </a>
                          )}
                          {p.demo_link && (
                            <a
                              href={p.demo_link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-muted-foreground hover:acc-text"
                            >
                              <Globe className="h-3 w-3" /> Demo
                            </a>
                          )}
                        </div>
                        <select
                          value={p.status ?? "concept"}
                          onChange={(e) =>
                            statusMut.mutate({
                              id: p.id,
                              status: e.target.value as (typeof PROTOTYPE_STATUSES)[number],
                            })
                          }
                          className="mt-2 h-7 w-full rounded-md border border-border bg-background px-1.5 text-[11px] capitalize"
                        >
                          {PROTOTYPE_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STAGE_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                      );
                    })
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
