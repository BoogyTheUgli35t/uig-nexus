import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addIdeaComment, deleteIdeaComment, listIdeaComments } from "@/lib/innovation.functions";
import { authHeaders } from "@/lib/auth-headers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Partner = { id: string; name: string };

export function IdeaComments({ ideaId, partners }: { ideaId: string; partners: Partner[] }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const key = ["idea-comments", ideaId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => listIdeaComments({ data: { idea_id: ideaId }, headers: await authHeaders() }),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["idea-comment-counts"] });
  };

  const add = useMutation({
    mutationFn: async () =>
      addIdeaComment({
        data: { idea_id: ideaId, body, partner_id: partnerId || null },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      setBody("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => deleteIdeaComment({ data: { id }, headers: await authHeaders() }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-2 rounded-lg border border-border bg-surface p-3">
      <span className="text-xs font-semibold uppercase text-muted-foreground">Comments</span>
      {isLoading ? (
        <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
      ) : (data?.comments.length ?? 0) === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {data!.comments.map((c) => {
            const partner = (c.partners as { name: string } | null)?.name;
            const mine = c.author_id === data!.userId;
            return (
              <li key={c.id} className="rounded border border-border bg-background p-2 text-xs">
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>
                    {partner ? `${partner} (partner)` : mine ? "You" : "Lab member"} ·{" "}
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                  {mine && (
                    <button
                      type="button"
                      aria-label="Delete comment"
                      onClick={() => del.mutate(c.id)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
              </li>
            );
          })}
        </ul>
      )}
      <form
        className="mt-2 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) add.mutate();
        }}
      >
        <label htmlFor={`comment-${ideaId}`} className="sr-only">
          Add a comment
        </label>
        <Textarea
          id={`comment-${ideaId}`}
          rows={2}
          maxLength={2000}
          placeholder="Add a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <label htmlFor={`as-${ideaId}`} className="sr-only">
            Comment as
          </label>
          <select
            id={`as-${ideaId}`}
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="">Comment as myself</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                On behalf of {p.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" className="h-8" disabled={!body.trim() || add.isPending}>
            Post
          </Button>
        </div>
      </form>
    </div>
  );
}
