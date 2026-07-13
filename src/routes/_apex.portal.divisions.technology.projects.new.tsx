import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Check } from "lucide-react";
import { createTechProject, PROJECT_STATUSES } from "@/lib/tech.functions";
import { authHeaders } from "@/lib/auth-headers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_apex/portal/divisions/technology/projects/new")({
  head: () => ({
    meta: [{ title: "New engagement — UIG Technology" }, { name: "robots", content: "noindex" }],
  }),
  component: NewProjectPage,
});

function NewProjectPage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [status, setStatus] = useState<(typeof PROJECT_STATUSES)[number]>("discovery");
  const [budget, setBudget] = useState("");
  const [slaHours, setSlaHours] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const { id } = await createTechProject({
        data: {
          title,
          client_name: clientName || undefined,
          client_email: clientEmail || undefined,
          status,
          budget: budget ? Number(budget) : undefined,
          sla_hours: slaHours ? Number(slaHours) : undefined,
          start_date: startDate || undefined,
          due_date: dueDate || undefined,
        },
        headers: await authHeaders(),
      });
      toast.success("Project created");
      navigate({ to: "/portal/divisions/technology/projects/$id", params: { id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/portal/divisions/technology/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>

      <h1 className="text-2xl font-bold">New engagement</h1>

      <form onSubmit={onSubmit} className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Client name</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} maxLength={150} />
          </div>
          <div className="space-y-2">
            <Label>Client email</Label>
            <Input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              maxLength={180}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof PROJECT_STATUSES)[number])}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Budget (₦)</Label>
            <Input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>SLA (hours)</Label>
            <Input
              type="number"
              min={1}
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
              placeholder="e.g. 240"
            />
          </div>
          <div className="space-y-2">
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!title.trim() || creating}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            {creating ? "Creating…" : "Create project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
