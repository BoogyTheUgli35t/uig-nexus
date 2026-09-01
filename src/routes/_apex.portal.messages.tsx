import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import { getMyWorkspace, listMessages, sendMessage } from "@/lib/divisions.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { DIVISIONS } from "@/lib/divisions";
import { DataPanel, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_apex/portal/messages")({
  head: () => ({
    meta: [{ title: "Messages — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const qc = useQueryClient();
  const [division, setDivision] = useState<string | null>(null);
  const [threadKey, setThreadKey] = useState("general");
  const [body, setBody] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [myId, setMyId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: workspace } = useQuery({
    queryKey: ["my-workspace"],
    queryFn: async () => getMyWorkspace({ headers: await authHeaders() }),
  });

  useEffect(() => {
    if (workspace && !division && workspace.divisionSlugs.length > 0) {
      setDivision(workspace.divisionSlugs[0]);
    }
    if (workspace) setMyId(workspace.userId);
  }, [workspace, division]);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", division, threadKey],
    queryFn: async () =>
      division
        ? listMessages({ data: { division, thread_key: threadKey }, headers: await authHeaders() })
        : [],
    enabled: !!division,
  });

  // Resolve sender display names for anyone we don't already have cached.
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const missing = [...new Set(messages.map((m) => m.sender_id))].filter((id) => !(id in names));
    if (missing.length === 0) return;
    supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", missing)
      .then(({ data }) => {
        if (!data) return;
        setNames((prev) => {
          const next = { ...prev };
          for (const p of data) next[p.id] = p.full_name || "Portal user";
          for (const id of missing) if (!(id in next)) next[id] = "Portal user";
          return next;
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Live updates for the active thread.
  useEffect(() => {
    if (!division) return;
    const channel = supabase
      .channel(`messages-${division}-${threadKey}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `division=eq.${division}` },
        () => qc.invalidateQueries({ queryKey: ["messages", division, threadKey] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [division, threadKey, qc]);

  const sendMut = useMutation({
    mutationFn: async () => {
      if (!division) throw new Error("Pick a division first");
      return sendMessage({
        data: { division, thread_key: threadKey, body: body.trim() },
        headers: await authHeaders(),
      });
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["messages", division, threadKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const myDivisions = useMemo(
    () => DIVISIONS.filter((d) => workspace?.divisionSlugs.includes(d.slug)),
    [workspace],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    sendMut.mutate();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-gold uppercase tracking-wider">Shared infra</p>
        <h1 className="mt-2 text-3xl font-bold">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Team chat, scoped to a division and channel.
        </p>
      </div>

      {myDivisions.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No division access yet" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {myDivisions.map((d) => (
              <button
                key={d.slug}
                onClick={() => setDivision(d.slug)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  division === d.slug
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.short}
              </button>
            ))}
            <Input
              value={threadKey}
              onChange={(e) => setThreadKey(e.target.value.trim() || "general")}
              placeholder="channel"
              className="ml-auto h-8 w-32 text-xs"
            />
          </div>

          <DataPanel title={`#${threadKey}`}>
            <div className="flex h-96 flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : !messages || messages.length === 0 ? (
                  <EmptyState icon={MessageSquare} title="No messages yet — say hello." />
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === myId;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                            mine
                              ? "bg-gold/15 text-foreground"
                              : "bg-background border border-border"
                          }`}
                        >
                          {!mine && (
                            <div className="mb-0.5 text-[11px] font-medium text-gold">
                              {names[m.sender_id] ?? "…"}
                            </div>
                          )}
                          <div>{m.body}</div>
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>
              <form onSubmit={onSubmit} className="mt-3 flex gap-2 border-t border-border pt-3">
                <Input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write a message…"
                  className="flex-1"
                />
                <Button type="submit" disabled={sendMut.isPending || !body.trim()} size="sm">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </DataPanel>
        </>
      )}
    </div>
  );
}
