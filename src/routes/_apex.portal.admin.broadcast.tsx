import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Send } from "lucide-react";
import { sendBroadcast } from "@/lib/admin.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DIVISIONS } from "@/lib/divisions";

export const Route = createFileRoute("/_apex/portal/admin/broadcast")({
  head: () => ({
    meta: [{ title: "Broadcast — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: BroadcastPage,
});

const ROLES = ["admin", "staff", "client", "investor", "farmer", "driver"] as const;

function BroadcastPage() {
  const [audience, setAudience] = useState<"all" | "division" | "role">("all");
  const [divisionSlug, setDivisionSlug] = useState<string>(DIVISIONS[0].slug);
  const [role, setRole] = useState<(typeof ROLES)[number]>("client");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const mutation = useMutation({
    mutationFn: async () =>
      sendBroadcast({
        data: {
          audience,
          division_slug: audience === "division" ? divisionSlug : "",
          role: audience === "role" ? role : undefined,
          title,
          body,
        },
        headers: await authHeaders(),
      }),
    onSuccess: (res) => {
      toast.success(`Broadcast delivered to ${res.delivered} account${res.delivered === 1 ? "" : "s"}.`);
      setTitle("");
      setBody("");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title required");
    mutation.mutate();
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="text-sm text-gold uppercase tracking-wider">Admin</p>
        <h1 className="mt-2 text-3xl font-bold flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-gold" /> Broadcast
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send an announcement to every portal account, a division cohort, or a role.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Audience</label>
          <div className="flex flex-wrap gap-2">
            {(["all", "division", "role"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAudience(a)}
                className={`rounded-full px-4 py-1.5 text-sm border transition ${
                  audience === a
                    ? "bg-gold text-background border-gold"
                    : "border-border text-muted-foreground hover:border-gold/40"
                }`}
              >
                {a === "all" ? "Everyone" : a === "division" ? "By division" : "By role"}
              </button>
            ))}
          </div>
        </div>

        {audience === "division" && (
          <div>
            <label htmlFor="bc-division" className="block text-sm font-medium mb-2">
              Division
            </label>
            <select
              id="bc-division"
              value={divisionSlug}
              onChange={(e) => setDivisionSlug(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {DIVISIONS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {audience === "role" && (
          <div>
            <label htmlFor="bc-role" className="block text-sm font-medium mb-2">
              Role
            </label>
            <select
              id="bc-role"
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="bc-title" className="block text-sm font-medium mb-2">
            Title
          </label>
          <input
            id="bc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="E.g. Scheduled maintenance tonight"
          />
        </div>

        <div>
          <label htmlFor="bc-body" className="block text-sm font-medium mb-2">
            Message
          </label>
          <textarea
            id="bc-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={5}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="Optional details…"
          />
          <p className="mt-1 text-xs text-muted-foreground">{body.length}/2000</p>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !title.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {mutation.isPending ? "Sending…" : "Send broadcast"}
        </button>
      </form>
    </div>
  );
}
