import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  CheckSquare,
  CircleDot,
  Rocket,
  Receipt,
  FileText,
  Upload,
  Trash2,
  Clock,
  CreditCard,
} from "lucide-react";
import {
  getTechProjectDetail,
  updateTechProjectStatus,
  addTechTask,
  updateTechTaskStatus,
  addDeployment,
  addInvoice,
  updateInvoiceStatus,
  PROJECT_STATUSES,
  DEPLOY_ENVIRONMENTS,
  INVOICE_STATUSES,
} from "@/lib/tech.functions";
import { createCheckoutSession } from "@/lib/billing.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { DataPanel, EmptyState, StatusBadge, KpiStat } from "@/components/portal/blocks";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_apex/portal/divisions/technology/projects/$id")({
  component: ProjectDetailPage,
});

const naira = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
};

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["tech-project", id],
    queryFn: async () => getTechProjectDetail({ headers: await authHeaders(), data: { id } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tech-project", id] });

  const [taskTitle, setTaskTitle] = useState("");
  const [deployVersion, setDeployVersion] = useState("");
  const [deployEnv, setDeployEnv] = useState<(typeof DEPLOY_ENVIRONMENTS)[number]>("staging");
  const [deployNotes, setDeployNotes] = useState("");
  const [invoiceMilestone, setInvoiceMilestone] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [uploading, setUploading] = useState(false);

  const statusMut = useMutation({
    mutationFn: async (status: (typeof PROJECT_STATUSES)[number]) =>
      updateTechProjectStatus({ data: { id, status }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const taskMut = useMutation({
    mutationFn: async () =>
      addTechTask({ data: { tech_project_id: id, title: taskTitle }, headers: await authHeaders() }),
    onSuccess: () => {
      setTaskTitle("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const taskStatusMut = useMutation({
    mutationFn: async (v: { taskId: string; status: "todo" | "in_progress" | "done" }) =>
      updateTechTaskStatus({ data: { id: v.taskId, status: v.status }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const deployMut = useMutation({
    mutationFn: async () =>
      addDeployment({
        data: {
          tech_project_id: id,
          version: deployVersion,
          environment: deployEnv,
          status: "success",
          notes: deployNotes.trim() || undefined,
        },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Deployment logged");
      setDeployVersion("");
      setDeployNotes("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invoiceMut = useMutation({
    mutationFn: async () =>
      addInvoice({
        data: { tech_project_id: id, milestone: invoiceMilestone, amount: Number(invoiceAmount) || 0 },
        headers: await authHeaders(),
      }),
    onSuccess: () => {
      toast.success("Invoice created");
      setInvoiceMilestone("");
      setInvoiceAmount("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const invoiceStatusMut = useMutation({
    mutationFn: async (v: { invoiceId: string; status: (typeof INVOICE_STATUSES)[number] }) =>
      updateInvoiceStatus({ data: { id: v.invoiceId, status: v.status }, headers: await authHeaders() }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const [payingId, setPayingId] = useState<string | null>(null);

  async function onPayWithStripe(inv: { id: string; milestone: string; amount: number }) {
    setPayingId(inv.id);
    try {
      const res = await createCheckoutSession({
        data: {
          description: `${project.title} — ${inv.milestone}`,
          amount_kobo: Math.round(Number(inv.amount) * 100),
          currency: "ngn",
          division: "technology",
          related_table: "project_invoices",
          related_id: inv.id,
          origin: window.location.origin,
        },
        headers: await authHeaders(),
      });
      window.location.href = res.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start checkout");
      setPayingId(null);
    }
  }

  async function onUploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user.id ?? null;
      const path = `${id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("tech-project-documents").upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("tech_project_documents").insert({
        tech_project_id: id,
        name: file.name,
        file_path: path,
        size_bytes: file.size,
        mime_type: file.type,
        uploaded_by: userId,
      });
      if (dbErr) throw dbErr;
      toast.success("File uploaded");
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDownloadDoc(path: string, name: string) {
    const { data: signed, error } = await supabase.storage
      .from("tech-project-documents")
      .createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    const a = document.createElement("a");
    a.href = signed.signedUrl;
    a.download = name;
    a.click();
  }

  async function onDeleteDoc(docId: string, path: string) {
    await supabase.storage.from("tech-project-documents").remove([path]);
    await supabase.from("tech_project_documents").delete().eq("id", docId);
    invalidate();
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading project…</div>;
  if (!data) return <EmptyState icon={FileText} title="Project not found" />;

  const { project, tasks, deployments, invoices, documents } = data;
  const slaHoursLeft = project.due_date
    ? Math.round((new Date(project.due_date).getTime() - Date.now()) / (1000 * 60 * 60))
    : null;
  const slaBreached = project.sla_hours != null && slaHoursLeft != null && slaHoursLeft < 0;
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-8">
      <Link
        to="/portal/divisions/technology/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.client_name || "Internal"} {project.client_email ? `· ${project.client_email}` : ""}
          </p>
          {project.client_name && (
            <Link
              to="/portal/divisions/technology/clients/$name"
              params={{ name: project.client_name }}
              className="mt-1 inline-block text-xs acc-text hover:underline"
            >
              View client portal →
            </Link>
          )}
          <Progress value={project.progress} className="mt-3 h-1.5 max-w-xs" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PROJECT_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => statusMut.mutate(s)}
              className={cn(
                "rounded border px-2 py-1 text-[11px] capitalize transition",
                s === project.status
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {slaBreached && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <Clock className="h-4 w-4" /> This project has missed its SLA target.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiStat icon={CheckSquare} label="Open tasks" value={tasks.filter((t) => t.status !== "done").length} />
        <KpiStat icon={Rocket} label="Deployments" value={deployments.length} />
        <KpiStat icon={Receipt} label="Invoiced" value={naira(totalInvoiced)} hint={`${naira(totalPaid)} paid`} />
        <KpiStat
          icon={Clock}
          label="SLA target"
          value={project.sla_hours ? `${project.sla_hours}h` : "—"}
          hint={slaHoursLeft !== null ? `${slaHoursLeft}h remaining` : undefined}
        />
      </div>

      {/* Tasks */}
      <DataPanel title="Tasks">
        <form
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (taskTitle.trim()) taskMut.mutate();
          }}
        >
          <Input
            placeholder="Add a task…"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            maxLength={200}
          />
          <Button type="submit" disabled={!taskTitle.trim() || taskMut.isPending}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
          </Button>
        </form>
        {tasks.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={CheckSquare} title="No tasks yet" />
          </div>
        ) : (
          <ul className="mt-4 space-y-1.5">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <button
                  onClick={() =>
                    taskStatusMut.mutate({ taskId: t.id, status: t.status === "done" ? "todo" : "done" })
                  }
                  className="flex flex-1 items-center gap-2 text-left text-sm"
                >
                  {t.status === "done" ? (
                    <CheckSquare className="h-4 w-4 acc-text shrink-0" />
                  ) : (
                    <CircleDot className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={t.status === "done" ? "line-through text-muted-foreground" : ""}>
                    {t.title}
                  </span>
                </button>
                {t.due_date && (
                  <span className="shrink-0 text-[11px] text-muted-foreground">{t.due_date}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </DataPanel>

      {/* Deployments / release notes */}
      <DataPanel title="Deployments &amp; release notes">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (deployVersion.trim()) deployMut.mutate();
          }}
        >
          <div className="flex flex-wrap gap-3">
            <Input
              className="max-w-[140px]"
              placeholder="v1.2.0"
              value={deployVersion}
              onChange={(e) => setDeployVersion(e.target.value)}
            />
            <select
              value={deployEnv}
              onChange={(e) => setDeployEnv(e.target.value as (typeof DEPLOY_ENVIRONMENTS)[number])}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {DEPLOY_ENVIRONMENTS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" disabled={!deployVersion.trim() || deployMut.isPending}>
              <Rocket className="mr-1.5 h-3.5 w-3.5" /> Log deployment
            </Button>
          </div>
          <Textarea
            placeholder="Release notes for this version (optional) — what changed, what to watch for…"
            value={deployNotes}
            onChange={(e) => setDeployNotes(e.target.value)}
            rows={2}
            maxLength={1000}
          />
        </form>
        {deployments.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={Rocket} title="No deployments logged" />
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {deployments.map((d) => (
              <div key={d.id} className="py-2.5">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono font-medium">{d.version}</span>{" "}
                    <span className="text-xs text-muted-foreground capitalize">{d.environment}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(d.created_at).toLocaleString()}
                    </span>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
                {d.notes && <p className="mt-1 text-xs text-muted-foreground">{d.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      {/* Invoices */}
      <DataPanel title="Milestone billing">
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (invoiceMilestone.trim()) invoiceMut.mutate();
          }}
        >
          <Input
            placeholder="Milestone (e.g. Sprint 1 delivery)"
            className="max-w-xs"
            value={invoiceMilestone}
            onChange={(e) => setInvoiceMilestone(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Amount (₦)"
            className="max-w-[160px]"
            value={invoiceAmount}
            onChange={(e) => setInvoiceAmount(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={!invoiceMilestone.trim() || invoiceMut.isPending}>
            <Receipt className="mr-1.5 h-3.5 w-3.5" /> Add invoice
          </Button>
        </form>
        {invoices.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon={Receipt} title="No invoices yet" />
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {invoices.map((inv) => (
              <div key={inv.id} className="py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{inv.milestone}</div>
                    <div className="text-xs text-muted-foreground">{naira(Number(inv.amount))}</div>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {INVOICE_STATUSES.filter((s) => s !== inv.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => invoiceStatusMut.mutate({ invoiceId: inv.id, status: s })}
                      className="rounded border border-border px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground hover:text-foreground"
                    >
                      Mark {s}
                    </button>
                  ))}
                  {inv.status !== "paid" && (
                    <button
                      onClick={() => onPayWithStripe(inv)}
                      disabled={payingId === inv.id}
                      className="ml-1 inline-flex items-center gap-1 rounded border border-gold/40 px-1.5 py-0.5 text-[10px] text-gold hover:bg-gold/10"
                    >
                      <CreditCard className="h-3 w-3" />
                      {payingId === inv.id ? "Redirecting…" : "Pay with Stripe"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      {/* Documents */}
      <DataPanel
        title="Project documents"
        action={
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-gold text-gold-foreground hover:bg-gold/90 px-3 py-1.5 text-xs font-medium">
            <input type="file" className="hidden" onChange={onUploadDoc} disabled={uploading} />
            <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Upload"}
          </label>
        }
      >
        {documents.length === 0 ? (
          <EmptyState icon={FileText} title="No documents yet" />
        ) : (
          <ul className="divide-y divide-border">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 py-3">
                <button
                  onClick={() => onDownloadDoc(d.file_path, d.name)}
                  className="flex min-w-0 items-center gap-3 text-left hover:text-gold"
                >
                  <FileText className="h-4 w-4 shrink-0 text-gold" />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.mime_type ?? "file"}</div>
                  </div>
                </button>
                <button
                  onClick={() => onDeleteDoc(d.id, d.file_path)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </DataPanel>
    </div>
  );
}
