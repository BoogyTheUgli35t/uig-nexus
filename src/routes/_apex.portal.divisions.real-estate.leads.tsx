import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  getRealEstateWorkspace,
  updateLeadStage,
  addLead,
  addLeadActivity,
  listLeadActivities,
  LEAD_STAGES,
  ACTIVITY_TYPES,
} from "@/lib/realestate.functions";
import { listLeadsPaged, LEAD_SORTS } from "@/lib/realestate-crud.functions";
import { authHeaders } from "@/lib/auth-headers";
import { EmptyState, QueryError, SkeletonRows, StatusBadge } from "@/components/portal/blocks";
import { Pagination } from "@/components/portal/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/leads")({
  component: LeadsPage,
});

const LEAD_COLUMNS: { key: (typeof LEAD_STAGES)[number]; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "viewing", label: "Viewing" },
  { key: "negotiation", label: "Negotiation" },
  { key: "closed", label: "Closed" },
];

const SORT_LABEL: Record<(typeof LEAD_SORTS)[number], string> = {
  created_at: "Newest",
  full_name: "Name",
  budget_max: "Budget",
  next_follow_up_date: "Follow-up date",
};

const isPastDue = (date: string | null, stage: string) =>
  Boolean(date) && new Date(date!).getTime() < Date.now() && stage !== "closed" && stage !== "lost";

function LeadsPage() {
  const qc = useQueryClient();
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [activeLead, setActiveLead] = useState<string | null>(null);

  // Search / filter state. A kanban wants every lead grouped by stage, so
  // paging the board itself would be incoherent — instead, typing a query or
  // picking a stage switches to a searchable, paged list, which is the shape
  // search results actually want.
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<"" | (typeof LEAD_STAGES)[number]>("");
  const [sortBy, setSortBy] = useState<(typeof LEAD_SORTS)[number]>("created_at");
  const [page, setPage] = useState(1);
  const searching = Boolean(search.trim() || stage);
  const pageSize = 15;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["realestate-workspace"],
    queryFn: async () => getRealEstateWorkspace({ headers: await authHeaders() }),
  });

  const results = useQuery({
    queryKey: ["realestate-leads-search", search, stage, sortBy, page],
    enabled: searching,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      listLeadsPaged({
        headers: await authHeaders(),
        data: {
          search: search.trim() || undefined,
          stage: stage || undefined,
          sortBy,
          sortDir: sortBy === "full_name" ? "asc" : "desc",
          page,
          pageSize,
        },
      }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["realestate-workspace"] });
    qc.invalidateQueries({ queryKey: ["realestate-leads-search"] });
  };

  const clearFilters = () => {
    setSearch("");
    setStage("");
    setPage(1);
  };

  const propertyTitle = useMemo(() => {
    const m = new Map<string, string>();
    (data?.properties ?? []).forEach((p) => m.set(p.id, p.title));
    return m;
  }, [data]);

  const leadsByStage = useMemo(() => {
    const m = new Map<string, NonNullable<typeof data>["leads"]>();
    LEAD_COLUMNS.forEach((c) => m.set(c.key, []));
    (data?.leads ?? []).forEach((l) => {
      if (!m.has(l.stage)) m.set(l.stage, []);
      m.get(l.stage)!.push(l);
    });
    return m;
  }, [data]);

  const stageMut = useMutation({
    mutationFn: async (v: { id: string; stage: (typeof LEAD_STAGES)[number] }) =>
      updateLeadStage({ data: v, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const leadMut = useMutation({
    mutationFn: async () =>
      addLead({ data: { full_name: leadName, phone: leadPhone }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Lead added");
      setLeadName("");
      setLeadPhone("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isOverdue = (l: NonNullable<typeof data>["leads"][number]) =>
    isPastDue(l.next_follow_up_date, l.stage);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">CRM pipeline</h2>
        <p className="text-sm text-muted-foreground">
          Track leads from enquiry to close.
          {/* Only claim a count once one has actually loaded — the board used to
              print "0 open" while the request was still in flight, which reads
              as an empty pipeline rather than a pending one. */}
          {isLoading && !data ? " Loading…" : data ? ` ${data.stats.openLeads} open.` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="relative min-w-[200px] flex-1">
          <Label htmlFor="lead-search" className="sr-only">
            Search leads
          </Label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="lead-search"
            className="pl-9"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-stage">Stage</Label>
          <select
            id="lead-stage"
            value={stage}
            onChange={(e) => {
              setStage(e.target.value as typeof stage);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm capitalize"
          >
            <option value="">Board view (all stages)</option>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        {searching && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="lead-sort">Sort by</Label>
              <select
                id="lead-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as (typeof LEAD_SORTS)[number])}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {LEAD_SORTS.map((s) => (
                  <option key={s} value={s}>
                    {SORT_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3.5 w-3.5" /> Back to board
            </Button>
          </>
        )}
      </div>

      <form
        className="flex flex-wrap gap-3 rounded-xl border border-border bg-surface p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (leadName.trim()) leadMut.mutate();
        }}
      >
        <Input
          className="max-w-xs"
          placeholder="Lead name"
          value={leadName}
          onChange={(e) => setLeadName(e.target.value)}
          maxLength={150}
        />
        <Input
          className="max-w-xs"
          placeholder="Phone"
          value={leadPhone}
          onChange={(e) => setLeadPhone(e.target.value)}
          maxLength={40}
        />
        <Button type="submit" disabled={!leadName.trim() || leadMut.isPending}>
          <Plus className="mr-2 h-4 w-4" /> Add lead
        </Button>
      </form>

      {searching ? (
        <LeadSearchResults
          query={results}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onOpen={setActiveLead}
          onClear={clearFilters}
        />
      ) : error ? (
        <QueryError error={error} onRetry={() => refetch()} label="your pipeline" />
      ) : isLoading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LEAD_COLUMNS.map((col) => (
            <div key={col.key} className="rounded-xl border border-border bg-surface p-3">
              <div className="px-1 pb-2 text-xs font-medium text-muted-foreground">{col.label}</div>
              <SkeletonRows rows={2} />
            </div>
          ))}
        </div>
      ) : (data?.leads ?? []).length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads in the pipeline yet"
          description="Add your first lead above, or let the public enquiry forms feed the pipeline for you."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LEAD_COLUMNS.map((col) => {
            const items = leadsByStage.get(col.key) ?? [];
            return (
              <div key={col.key} className="rounded-xl border border-border bg-surface p-3">
                <div className="flex items-center justify-between px-1 pb-2 text-xs font-medium text-muted-foreground">
                  <span>{col.label}</span>
                  <span>{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border py-4 text-center text-[11px] text-muted-foreground">
                      No leads at this stage
                    </div>
                  ) : (
                    items.map((l) => {
                      const nextIdx =
                        LEAD_STAGES.indexOf(l.stage as (typeof LEAD_STAGES)[number]) + 1;
                      const next =
                        nextIdx > 0 && nextIdx < LEAD_STAGES.length ? LEAD_STAGES[nextIdx] : null;
                      return (
                        <button
                          key={l.id}
                          onClick={() => setActiveLead(l.id)}
                          className="w-full rounded-lg border border-border bg-background p-3 text-left transition hover:acc-border-soft"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-medium leading-snug">{l.full_name}</div>
                            {isOverdue(l) && (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                            )}
                          </div>
                          {l.property_id && (
                            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                              {propertyTitle.get(l.property_id) ?? "—"}
                            </div>
                          )}
                          <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            {l.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {l.phone}
                              </span>
                            )}
                            {l.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {l.email}
                              </span>
                            )}
                          </div>
                          {l.next_follow_up_date && (
                            <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" /> Follow up {l.next_follow_up_date}
                            </div>
                          )}
                          {next && next !== "lost" && (
                            <div
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                stageMut.mutate({ id: l.id, stage: next });
                              }}
                              className="mt-2 w-full rounded border border-border px-1.5 py-1 text-center text-[10px] capitalize text-muted-foreground transition hover:acc-border-soft hover:text-foreground"
                            >
                              Move to {next.replace(/_/g, " ")}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeLead && (
        <LeadDetailDialog
          leadId={activeLead}
          lead={(data?.leads ?? []).find((l) => l.id === activeLead) ?? null}
          onClose={() => setActiveLead(null)}
          onChanged={invalidate}
        />
      )}
    </div>
  );
}

/**
 * Search results for the pipeline.
 *
 * Deliberately a list rather than a board: once you're filtering by name or
 * stage you want to scan matches in one column, and the kanban's five columns
 * would leave four of them empty on a stage filter.
 */
function LeadSearchResults({
  query,
  page,
  pageSize,
  onPageChange,
  onOpen,
  onClear,
}: {
  query: ReturnType<typeof useQuery<Awaited<ReturnType<typeof listLeadsPaged>>>>;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onOpen: (id: string) => void;
  onClear: () => void;
}) {
  const { data, isLoading, error, refetch } = query;

  if (error) return <QueryError error={error} onRetry={() => refetch()} label="matching leads" />;
  if (isLoading && !data)
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <SkeletonRows rows={5} />
      </div>
    );

  const rows = data?.rows ?? [];
  if (rows.length === 0)
    return (
      <EmptyState
        icon={Search}
        title="No leads match your search"
        description="Try a different name, email address, phone number or stage."
        action={
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="mr-1.5 h-3.5 w-3.5" /> Back to the board
          </Button>
        }
      />
    );

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="pb-3 text-xs text-muted-foreground">
        {data?.total} match{data?.total === 1 ? "" : "es"}
      </p>
      <ul className="divide-y divide-border">
        {rows.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpen(l.id)}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {l.full_name}
                </button>
                {isPastDue(l.next_follow_up_date, l.stage) && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-destructive">
                    <AlertTriangle className="h-3 w-3" /> Follow-up overdue
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {l.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {l.phone}
                  </span>
                )}
                {l.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {l.email}
                  </span>
                )}
                {l.next_follow_up_date && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {l.next_follow_up_date}
                  </span>
                )}
              </div>
            </div>
            <StatusBadge status={l.stage} />
            <Link
              to="/portal/divisions/real-estate/leads/$id"
              params={{ id: l.id }}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-gold hover:underline"
            >
              Full record <ArrowRight className="h-3 w-3" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Pagination
          page={data?.page ?? page}
          pageSize={data?.pageSize ?? pageSize}
          total={data?.total ?? 0}
          onPageChange={onPageChange}
          label="leads"
        />
      </div>
    </div>
  );
}

function LeadDetailDialog({
  leadId,
  lead,
  onClose,
  onChanged,
}: {
  leadId: string;
  lead: { full_name: string; email: string | null; phone: string | null } | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const [activityType, setActivityType] = useState<(typeof ACTIVITY_TYPES)[number]>("call");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState("");

  const { data: activities } = useQuery({
    queryKey: ["realestate-lead-activities", leadId],
    queryFn: async () =>
      listLeadActivities({ headers: await authHeaders(), data: { lead_id: leadId } }),
  });

  const addActivityMut = useMutation({
    mutationFn: async () =>
      addLeadActivity({
        data: {
          lead_id: leadId,
          activity_type: activityType,
          notes,
          next_follow_up_date: followUp,
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Activity logged");
      setNotes("");
      setFollowUp("");
      qc.invalidateQueries({ queryKey: ["realestate-lead-activities", leadId] });
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead?.full_name ?? "Lead"}</DialogTitle>
          <DialogDescription>
            {lead?.phone ?? "—"} {lead?.email ? `· ${lead.email}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* The full lead record — budget, source, assignment, property match —
            has its own route, which nothing linked to, so it was unreachable.
            This drawer is for logging a quick call; that page is for editing. */}
        <Link
          to="/portal/divisions/real-estate/leads/$id"
          params={{ id: leadId }}
          className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
        >
          Open the full record <ArrowRight className="h-3 w-3" />
        </Link>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            addActivityMut.mutate();
          }}
        >
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_TYPES.filter((t) => t !== "stage_change").map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActivityType(t)}
                className={`rounded-full border px-3 py-1 text-xs capitalize ${
                  activityType === t
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Textarea
            rows={3}
            placeholder="What happened?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Next follow-up date (optional)</Label>
            <Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
          </div>
          <Button type="submit" size="sm" disabled={addActivityMut.isPending}>
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Log activity
          </Button>
        </form>

        <div className="mt-2 max-h-64 space-y-2 overflow-y-auto border-t border-border pt-3">
          {!activities || activities.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No activity yet" />
          ) : (
            activities.map((a) => (
              <div key={a.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">
                    {a.activity_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
                {a.notes && <p className="mt-1 text-xs text-muted-foreground">{a.notes}</p>}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
