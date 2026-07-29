import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Calendar, ScrollText, AlertCircle } from "lucide-react";
import { queryAuditLog } from "@/lib/admin.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DIVISIONS } from "@/lib/divisions";

export const Route = createFileRoute("/_apex/portal/admin/audit")({
  head: () => ({
    meta: [{ title: "Admin audit log — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminAuditPage,
});

const EVENT_TYPES = [
  "sign_in",
  "sign_out",
  "access_denied",
  "role_change",
  "session_expired",
  "access_request_submitted",
];

type Row = {
  id: string;
  created_at: string;
  event_type: string;
  email: string | null;
  user_id: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
};

function AdminAuditPage() {
  const [email, setEmail] = useState("");
  const [eventType, setEventType] = useState("");
  const [divisionSlug, setDivisionSlug] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filters = useMemo(
    () => ({
      email: email.trim(),
      event_type: eventType,
      division_slug: divisionSlug,
      from: from ? new Date(from).toISOString() : "",
      to: to ? new Date(to + "T23:59:59").toISOString() : "",
      limit: 500,
    }),
    [email, eventType, divisionSlug, from, to],
  );

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-audit", filters],
    queryFn: async () =>
      (await queryAuditLog({
        data: filters,
        headers: await authHeaders(),
      })) as Row[],
  });

  const clear = () => {
    setEmail("");
    setEventType("");
    setDivisionSlug("");
    setFrom("");
    setTo("");
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <p className="text-sm text-gold uppercase tracking-wider">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Filter portal events by user, event type, division, and time range. Server-side filtered,
          admin-only.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <label className="block">
            <span className="sr-only">Email</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="User email…"
                aria-label="Filter by email"
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-gold/60"
              />
            </div>
          </label>

          <label className="block">
            <span className="sr-only">Event type</span>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                aria-label="Filter by event type"
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-gold/60"
              >
                <option value="">All events</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block">
            <span className="sr-only">Division</span>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={divisionSlug}
                onChange={(e) => setDivisionSlug(e.target.value)}
                aria-label="Filter by division"
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-gold/60"
              >
                <option value="">All divisions</option>
                {DIVISIONS.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block">
            <span className="sr-only">From date</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="From date"
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-gold/60 [color-scheme:dark]"
              />
            </div>
          </label>

          <label className="block">
            <span className="sr-only">To date</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="To date"
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-gold/60 [color-scheme:dark]"
              />
            </div>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            {isFetching ? "Loading…" : "Apply filters"}
          </button>
          <button
            onClick={clear}
            className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm hover:bg-muted"
          >
            Clear
          </button>
          <span className="ml-auto text-xs text-muted-foreground">
            {isLoading ? "…" : `${data?.length ?? 0} events`}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <div>{(error as Error).message}</div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading events…</div>
        ) : !data || data.length === 0 ? (
          <div className="p-10 text-center">
            <ScrollText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No events match those filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.map((r) => {
              const div = (r.metadata as { division_slug?: string } | null)?.division_slug;
              return (
                <div key={r.id} className="p-4 flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {r.event_type.replace(/_/g, " ")}
                      </span>
                      {r.email && <span className="text-sm">{r.email}</span>}
                      {div && (
                        <span className="rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gold">
                          {div}
                        </span>
                      )}
                    </div>
                    {r.metadata && Object.keys(r.metadata).length > 0 && (
                      <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap break-all font-mono">
                        {JSON.stringify(r.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <div>{new Date(r.created_at).toLocaleString()}</div>
                    {r.ip_address && <div className="font-mono">{r.ip_address}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
