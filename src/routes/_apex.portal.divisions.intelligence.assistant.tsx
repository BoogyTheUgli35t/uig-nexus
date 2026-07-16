import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Sparkles, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getIntelligenceWorkspace,
  runPrediction,
  listMyChatMessages,
  sendChatMessage,
  clearMyChat,
} from "@/lib/intelligence.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_apex/portal/divisions/intelligence/assistant")({
  head: () => ({ meta: [{ title: "AI assistant — UIG Intelligence" }] }),
  validateSearch: (search) => z.object({ ask: z.string().optional() }).parse(search),
  component: AssistantPage,
});

function AssistantPage() {
  const qc = useQueryClient();
  const { ask } = Route.useSearch();
  const [chatInput, setChatInput] = useState("");
  const [predModelId, setPredModelId] = useState("");
  const [predPrompt, setPredPrompt] = useState("");
  const [predResult, setPredResult] = useState<{ result: string; confidence: number } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sentAskRef = useRef(false);

  const { data } = useQuery({
    queryKey: ["intelligence-workspace"],
    queryFn: async () => getIntelligenceWorkspace({ headers: await authHeaders() }),
  });

  const { data: chatMessages } = useQuery({
    queryKey: ["intelligence-chat"],
    queryFn: async () => listMyChatMessages({ headers: await authHeaders() }),
  });

  const chatMut = useMutation({
    mutationFn: async (message: string) =>
      sendChatMessage({ data: { message }, headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intelligence-chat"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const clearChatMut = useMutation({
    mutationFn: async () => clearMyChat({ headers: await authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intelligence-chat"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const predMut = useMutation({
    mutationFn: async () =>
      runPrediction({ data: { model_id: predModelId, prompt: predPrompt }, headers: await authHeaders() }),
    onSuccess: (r) => {
      setPredResult(r);
      setPredPrompt("");
      qc.invalidateQueries({ queryKey: ["intelligence-workspace"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (ask && !sentAskRef.current) {
      sentAskRef.current = true;
      chatMut.mutate(ask);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask]);

  return (
    <div className="space-y-6">
      <DataPanel
        title="AI assistant"
        action={
          (chatMessages?.length ?? 0) > 0 ? (
            <button
              onClick={() => clearChatMut.mutate()}
              disabled={clearChatMut.isPending}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          ) : undefined
        }
      >
        <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-border bg-background p-3">
          {(chatMessages?.length ?? 0) === 0 && !chatMut.isPending ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Ask anything — e.g. "Which division should we invest in next quarter?"
            </p>
          ) : (
            (chatMessages ?? []).map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "acc-bg-soft acc-text" : "border border-border bg-surface"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {chatMut.isPending && (
            <div className="text-left">
              <div className="inline-block rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
                Thinking…
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (chatInput.trim()) {
              chatMut.mutate(chatInput.trim());
              setChatInput("");
            }
          }}
        >
          <Input
            placeholder="Message the assistant…"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            maxLength={2000}
          />
          <Button type="submit" disabled={!chatInput.trim() || chatMut.isPending} className="shrink-0">
            <Sparkles className="mr-2 h-4 w-4" /> Send
          </Button>
        </form>
      </DataPanel>

      <DataPanel title="Live predictions">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (predPrompt.trim()) predMut.mutate();
          }}
        >
          <select
            value={predModelId}
            onChange={(e) => setPredModelId(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            <option value="">General model</option>
            {(data?.models ?? [])
              .filter((m) => m.status === "deployed" || m.status === "monitoring" || m.status === "trained")
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.target_division})
                </option>
              ))}
          </select>
          <Textarea
            placeholder="Describe what you want to predict — e.g. Forecast rice yield for Kebbi Field 12, dry season."
            value={predPrompt}
            onChange={(e) => setPredPrompt(e.target.value)}
            maxLength={2000}
            rows={3}
          />
          <Button type="submit" disabled={!predPrompt.trim() || predMut.isPending}>
            <Send className="mr-2 h-4 w-4" /> {predMut.isPending ? "Running…" : "Run prediction"}
          </Button>
        </form>
        {predResult && (
          <div className="mt-4 rounded-lg border acc-border-soft bg-background p-4">
            <div className="flex items-center gap-2 text-xs acc-text">
              <Sparkles className="h-3.5 w-3.5" /> {predResult.confidence}% confidence
            </div>
            <p className="mt-2 text-sm leading-relaxed">{predResult.result}</p>
          </div>
        )}
      </DataPanel>
    </div>
  );
}
