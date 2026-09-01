import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Kanban, Save } from "lucide-react";
import { getLeadDetail, updateLead } from "@/lib/realestate-crud.functions";
import { addLeadActivity, ACTIVITY_TYPES, LEAD_STAGES } from "@/lib/realestate.functions";
import { authHeaders } from "@/lib/auth-headers";
import { DataPanel, EmptyState, StatusBadge } from "@/components/portal/blocks";
import { RecordDocuments } from "@/components/portal/RecordDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_apex/portal/divisions/real-estate/leads_/$id")({
  component: LeadDetailPage,
});

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  stage: (typeof LEAD_STAGES)[number];
  property_id: string;
  budget_max: string;
  next_follow_up_date: string;
  notes: string;
};

function LeadDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["realestate-lead", id],
    queryFn: async () => getLeadDetail({ headers: await authHeaders(), data: { id } }),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activityType, setActivityType] = useState<(typeof ACTIVITY_TYPES)[number]>("call");
  const [activityNote, setActivityNote] = useState("");

  useEffect(() => {
    if (!data?.lead || form) return;
    const l = data.lead;
    setForm({
      full_name: l.full_name ?? "",
      email: l.email ?? "",
      phone: l.phone ?? "",
      stage: (l.stage ?? "new") as FormState["stage"],
      property_id: l.property_id ?? "",
      budget_max: l.budget_max != null ? String(l.budget_max) : "",
      next_follow_up_date: l.next_follow_up_date ?? "",
      notes: l.notes ?? "",
    });
  }, [data, form]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["realestate-lead", id] });
    qc.invalidateQueries({ queryKey: ["realestate-workspace"] });
  };

  const saveMut = useMutation({
    mutationFn: async (values: FormState) =>
      updateLead({
        headers: await authHeaders(),
        data: {
          id,
          full_name: values.full_name,
          email: values.email,
          phone: values.phone,
          stage: values.stage,
          property_id: values.property_id || null,
          budget_max: values.budget_max ? Number(values.budget_max) : null,
          next_follow_up_date: values.next_follow_up_date,
          notes: values.notes,
        },
      }),
    onSuccess: () => {
      toast.success("Lead updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activityMut = useMutation({
    mutationFn: async () =>
      addLeadActivity({
        headers: await authHeaders(),
        data: { lead_id: id, activity_type: activityType, notes: activityNote },
      }),
    onSuccess: () => {
      setActivityNote("");
      toast.success("Activity logged");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !form) return <div className="text-sm text-muted-foreground">Loading lead…</div>;
  if (!data?.lead) return <EmptyState icon={Kanban} title="Lead not found" />;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function validate(values: FormState) {
    const next: Record<string, string> = {};
    if (!values.full_name.trim()) next["full_name"] = "Name is required";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next["email"] = "Enter a valid email";
    if (!values.email && !values.phone) next["phone"] = "Add an email or a phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate({ to: "/portal/divisions/real-estate/leads" })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Lead pipeline
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">{data.lead.full_name}</h1>
        <StatusBadge status={data.lead.stage} />
      </div>

      <DataPanel title="Lead details">
        <form
          className="grid gap-4 sm:grid-cols-2"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (form && validate(form)) saveMut.mutate(form);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={form.full_name}
              aria-invalid={!!errors["full_name"]}
              onChange={(e) => set("full_name", e.target.value)}
            />
            {errors["full_name"] && (
              <p className="text-xs text-destructive">{errors["full_name"]}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stage">Stage</Label>
            <select
              id="stage"
              value={form.stage}
              onChange={(e) => set("stage", e.target.value as FormState["stage"])}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              aria-invalid={!!errors["email"]}
              onChange={(e) => set("email", e.target.value)}
            />
            {errors["email"] && <p className="text-xs text-destructive">{errors["email"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              aria-invalid={!!errors["phone"]}
              onChange={(e) => set("phone", e.target.value)}
            />
            {errors["phone"] && <p className="text-xs text-destructive">{errors["phone"]}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="property">Interested property</Label>
            <select
              id="property"
              value={form.property_id}
              onChange={(e) => set("property_id", e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">None</option>
              {data.properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="budget">Budget max (₦)</Label>
            <Input
              id="budget"
              type="number"
              min={0}
              value={form.budget_max}
              onChange={(e) => set("budget_max", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="follow_up">Next follow-up</Label>
            <Input
              id="follow_up"
              type="date"
              value={form.next_follow_up_date}
              onChange={(e) => set("next_follow_up_date", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button
              type="submit"
              disabled={saveMut.isPending}
              className="bg-gold text-gold-foreground hover:bg-gold/90"
            >
              <Save className="mr-2 h-4 w-4" /> {saveMut.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DataPanel>

      <DataPanel title="Activity">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (activityNote.trim()) activityMut.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="activity_type">Type</Label>
            <select
              id="activity_type"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as (typeof ACTIVITY_TYPES)[number])}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <Label htmlFor="activity_note">Note</Label>
            <Input
              id="activity_note"
              value={activityNote}
              onChange={(e) => setActivityNote(e.target.value)}
              placeholder="What happened?"
            />
          </div>
          <Button type="submit" variant="outline" disabled={activityMut.isPending}>
            Log activity
          </Button>
        </form>

        <ul className="mt-5 space-y-3">
          {data.activities.length === 0 && (
            <li className="text-sm text-muted-foreground">No activity logged yet.</li>
          )}
          {data.activities.map((a) => (
            <li key={a.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium capitalize">{a.activity_type.replace(/_/g, " ")}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
              {a.notes && <p className="mt-1 text-muted-foreground">{a.notes}</p>}
            </li>
          ))}
        </ul>
      </DataPanel>

      <RecordDocuments
        recordTable="leads"
        recordId={id}
        division="real-estate"
        title="Lead documents"
      />
    </div>
  );
}
