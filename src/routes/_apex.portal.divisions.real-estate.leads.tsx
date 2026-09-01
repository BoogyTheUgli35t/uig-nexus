import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Phone, Mail, Calendar, MessageSquare, AlertTriangle } from "lucide-react";
import {
  getRealEstateWorkspace,
  updateLeadStage,
  addLead,
  addLeadActivity,
  listLeadActivities,
  LEAD_STAGES,
  ACTIVITY_TYPES,
} from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { EmptyState } from "@/components/portal/blocks";
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

function LeadsPage() {
  const qc = useQueryClient();
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [activeLead, setActiveLead] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["realestate-workspace"],
    queryFn: async () => getRealEstateWorkspace({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["realestate-workspace"] });

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
    Boolean(l.next_follow_up_date) &&
    new Date(l.next_follow_up_date!).getTime() < Date.now() &&
    l.stage !== "closed" &&
    l.stage !== "lost";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">CRM pipeline</h2>
        <p className="text-sm text-muted-foreground">
          Track leads from enquiry to close. {data?.stats.openLeads ?? 0} open.
        </p>
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
                    Empty
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
