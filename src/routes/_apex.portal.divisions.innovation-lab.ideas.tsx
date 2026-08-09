import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Lightbulb, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import {
  getInnovationWorkspace,
  submitIdea,
  updateIdeaStatus,
  listIdeaVotes,
  toggleIdeaVote,
  IDEA_STATUSES,
} from "@/lib/innovation.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_apex/portal/divisions/innovation-lab/ideas")({
  head: () => ({ meta: [{ title: "Ideas — UIG Innovation Lab" }] }),
  component: IdeasPage,
});

function IdeasPage() {
  const qc = useQueryClient();
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDesc, setIdeaDesc] = useState("");
  const [ideaTags, setIdeaTags] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");

  const { data, isLoading } = useQuery({
    queryKey: ["innovation-workspace"],
    queryFn: async () => getInnovationWorkspace({ headers: await authHeaders() }),
  });

  const { data: votes } = useQuery({
    queryKey: ["innovation-idea-votes"],
    queryFn: async () => listIdeaVotes({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["innovation-workspace"] });

  const voteMut = useMutation({
    mutationFn: async (idea_id: string) => toggleIdeaVote({ data: { idea_id }, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["innovation-idea-votes"] }),
    onError: (e: Error) => toast.error(e.message),
  });



  const ideaMut = useMutation({
    mutationFn: async () =>
      submitIdea({
        data: {
          title: ideaTitle,
          description: ideaDesc,
          tags: ideaTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Idea submitted");
      setIdeaTitle("");
      setIdeaDesc("");
      setIdeaTags("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: async (v: { id: string; status: (typeof IDEA_STATUSES)[number] }) =>
      updateIdeaStatus({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const voteCount = (id: string) => votes?.counts?.[id] ?? 0;
  const hasVoted = (id: string) => votes?.mine?.includes(id) ?? false;

  const ideas = (data?.ideas ?? [])
    .filter((i) => statusFilter === "all" || i.status === statusFilter)
    .slice()
    .sort((a, b) =>
      sortBy === "votes"
        ? voteCount(b.id) - voteCount(a.id)
        : new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
    );

  return (
    <div className="space-y-6">
      <DataPanel title="Pitch a new venture/idea">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (ideaTitle.trim()) ideaMut.mutate();
          }}
        >
          <Input
            placeholder="Idea title"
            value={ideaTitle}
            onChange={(e) => setIdeaTitle(e.target.value)}
            maxLength={180}
          />
          <Textarea
            placeholder="What problem does it solve? What's the expected impact and required resources?"
            value={ideaDesc}
            onChange={(e) => setIdeaDesc(e.target.value)}
            rows={3}
            maxLength={3000}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Tags (comma-separated)"
              value={ideaTags}
              onChange={(e) => setIdeaTags(e.target.value)}
              maxLength={200}
            />
            <Button type="submit" disabled={!ideaTitle.trim() || ideaMut.isPending} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Submit
            </Button>
          </div>
        </form>
      </DataPanel>

      <DataPanel
        title={`Idea pipeline (${ideas.length})`}
        action={
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="idea-sort">
              Sort ideas
            </label>
            <select
              id="idea-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "votes" | "recent")}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="votes">Most upvoted</option>
              <option value="recent">Newest</option>
            </select>
            <label className="sr-only" htmlFor="idea-stage">
              Filter by stage
            </label>
            <select
              id="idea-stage"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="all">All stages</option>
              {IDEA_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading ideas…</div>
        ) : ideas.length === 0 ? (
          <EmptyState icon={Lightbulb} title="No ideas here yet" description="Pitch the first one above." />
        ) : (
          <div className="space-y-3">
            {ideas.map((idea) => {
              const tags = Array.isArray(idea.tags) ? (idea.tags as string[]) : [];
              const voted = hasVoted(idea.id);
              return (
              <div key={idea.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => voteMut.mutate(idea.id)}
                      disabled={voteMut.isPending}
                      aria-pressed={voted}
                      aria-label={`${voted ? "Remove upvote from" : "Upvote"} ${idea.title}. ${voteCount(idea.id)} upvotes.`}
                      className={`flex w-11 shrink-0 flex-col items-center rounded-md border px-1 py-1 text-[11px] transition ${
                        voted
                          ? "border-transparent acc-bg-soft acc-text"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                      <span className="font-medium tabular-nums">{voteCount(idea.id)}</span>
                    </button>
                    <div className="text-sm font-medium">{idea.title}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={idea.status ?? "concept"} />
                    <select
                      value={idea.status ?? "concept"}
                      onChange={(e) =>
                        statusMut.mutate({
                          id: idea.id,
                          status: e.target.value as (typeof IDEA_STATUSES)[number],
                        })
                      }
                      className="h-7 rounded-md border border-border bg-background px-1.5 text-[11px] capitalize"
                    >
                      {IDEA_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {idea.description && (
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{idea.description}</p>
                )}
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="rounded-full acc-bg-soft acc-text px-2 py-0.5 text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
