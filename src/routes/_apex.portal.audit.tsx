import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listAuditLog } from "@/lib/portal.functions";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/_apex/portal/audit")({
  head: () => ({ meta: [{ title: "Audit log — UIG Apex" }, { name: "robots", content: "noindex" }] }),
  component: AuditPage,
});

type Row = {
  id: string;
  created_at: string;
  event_type: string;
  email: string | null;
  user_id: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
};

function AuditPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    listAuditLog()
      .then((d) => setRows(d as Row[]))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const filtered = rows?.filter((r) => {
    if (!filter.trim()) return true;
    const f = filter.toLowerCase();
    return (
      r.event_type.toLowerCase().includes(f) ||
      (r.email ?? "").toLowerCase().includes(f) ||
      JSON.stringify(r.metadata ?? {}).toLowerCase().includes(f)
    );
  });

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
          <ScrollText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Audit log</h1>
          <p className="text-sm text-muted-foreground">Recent portal events. Search by event, email, or reference ID.</p>
        </div>
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search… e.g. UIG-AB12CD or access_denied"
        className="mt-6 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      />

      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      <div className="mt-6 rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-muted-foreground text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-2">When</th>
              <th className="text-left px-4 py-2">Event</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Ref / metadata</th>
            </tr>
          </thead>
          <tbody>
            {!rows && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {rows && filtered?.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No events.</td></tr>}
            {filtered?.map((r) => {
              const ref = (r.metadata as { ref_id?: string } | null)?.ref_id;
              return (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2"><span className="rounded bg-surface-elevated px-2 py-0.5 text-xs">{r.event_type}</span></td>
                  <td className="px-4 py-2 text-muted-foreground">{r.email ?? "—"}</td>
                  <td className="px-4 py-2">
                    {ref && <div className="text-gold font-mono text-xs">{ref}</div>}
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap break-all">{JSON.stringify(r.metadata ?? {}, null, 0)}</pre>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
