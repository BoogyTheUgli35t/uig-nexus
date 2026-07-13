import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { listAuditLog } from "@/lib/portal.functions";
import {
  Search,
  Calendar,
  Filter,
  Activity,
  Clock,
  ShieldAlert,
  Key,
  FileText,
  CheckCircle,
  AlertCircle,
  User,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_apex/portal/audit")({
  head: () => ({
    meta: [{ title: "Audit log — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
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

const getEventIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("login") || t.includes("auth")) return <Key className="h-4 w-4" />;
  if (t.includes("error") || t.includes("fail") || t.includes("denied"))
    return <ShieldAlert className="h-4 w-4" />;
  if (t.includes("create") || t.includes("update")) return <FileText className="h-4 w-4" />;
  if (t.includes("success")) return <CheckCircle className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
};

const getEventColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("login") || t.includes("auth"))
    return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  if (t.includes("error") || t.includes("fail") || t.includes("denied"))
    return "bg-red-500/10 text-red-500 border-red-500/20";
  if (t.includes("create") || t.includes("update") || t.includes("success"))
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  return "bg-gold/10 text-gold border-gold/20";
};

function AuditPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    listAuditLog()
      .then((d) => setRows(d as Row[]))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const eventTypes = useMemo(() => {
    if (!rows) return [];
    return Array.from(new Set(rows.map((r) => r.event_type))).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows?.filter((r) => {
      // Text search
      let matchText = true;
      if (filter.trim()) {
        const f = filter.toLowerCase();
        matchText =
          r.event_type.toLowerCase().includes(f) ||
          (r.email ?? "").toLowerCase().includes(f) ||
          JSON.stringify(r.metadata ?? {})
            .toLowerCase()
            .includes(f);
      }

      // Event type filter
      let matchType = true;
      if (eventTypeFilter) {
        matchType = r.event_type === eventTypeFilter;
      }

      // Date range filter
      let matchDate = true;
      const rowDate = new Date(r.created_at);
      if (dateFrom) {
        if (rowDate < new Date(dateFrom)) matchDate = false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (rowDate > toDate) matchDate = false;
      }

      return matchText && matchType && matchDate;
    });
  }, [rows, filter, eventTypeFilter, dateFrom, dateTo]);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 text-gold border border-gold/20 shadow-[0_0_15px_rgba(212,175,55,0.1)] flex items-center justify-center backdrop-blur-sm">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Activity Timeline
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time chronological events from the portal audit log.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 mb-10 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search reference, email..."
              className="w-full rounded-xl border border-input/50 bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all outline-none"
            />
          </div>

          <div className="relative group">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-input/50 bg-background/50 pl-10 pr-4 py-2.5 text-sm appearance-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all outline-none text-foreground"
            >
              <option value="">All Event Types</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-input/50 bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all outline-none text-muted-foreground [color-scheme:dark]"
            />
          </div>

          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-gold transition-colors" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-input/50 bg-background/50 pl-10 pr-4 py-2.5 text-sm focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all outline-none text-muted-foreground [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="relative pl-4 md:pl-0">
        {/* Vertical line */}
        <div className="absolute left-[27px] md:left-[140px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-gold/50 via-border to-transparent rounded-full" />

        <div className="space-y-8">
          {!rows && (
            <div className="flex items-center justify-center py-12 md:pl-[140px]">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Activity className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-medium">Loading timeline events...</span>
              </div>
            </div>
          )}

          {rows && filtered?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 md:pl-[140px] text-center">
              <div className="h-16 w-16 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No events found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                We couldn't find any events matching your current filters. Try adjusting your search
                criteria.
              </p>
            </div>
          )}

          {filtered?.map((r, index) => {
            const ref = (r.metadata as { ref_id?: string } | null)?.ref_id;
            const date = new Date(r.created_at);
            const timeString = date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
            const dateString = date.toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div key={r.id} className="relative flex flex-col md:flex-row gap-6 md:gap-8 group">
                {/* Timeline timestamp (desktop) */}
                <div className="hidden md:flex flex-col items-end w-[110px] shrink-0 pt-3">
                  <span className="text-sm font-bold text-foreground">{timeString}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{dateString}</span>
                </div>

                {/* Timeline node */}
                <div className="absolute left-[-16px] md:left-[116px] top-3 h-12 w-12 rounded-full bg-background border-4 border-background flex items-center justify-center shadow-sm z-10">
                  <div
                    className={`h-full w-full rounded-full border flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${getEventColor(r.event_type)}`}
                  >
                    {getEventIcon(r.event_type)}
                  </div>
                </div>

                {/* Event Card */}
                <div className="ml-12 md:ml-0 flex-1 bg-surface-elevated/50 hover:bg-surface-elevated/80 border border-border/50 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border">
                  <div className="md:hidden flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground">{timeString}</span>
                    <span>•</span>
                    <span>{dateString}</span>
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-foreground tracking-tight">
                          {r.event_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getEventColor(r.event_type)}`}
                        >
                          {r.event_type}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        {r.email && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span>{r.email}</span>
                          </div>
                        )}
                        {ref && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-muted-foreground">Ref:</span>
                            <span className="text-gold font-mono">{ref}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {r.metadata && Object.keys(r.metadata).length > 0 && (
                    <div className="mt-4 rounded-xl bg-background/50 border border-border/50 p-4 overflow-x-auto">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all font-mono">
                        {JSON.stringify(r.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
