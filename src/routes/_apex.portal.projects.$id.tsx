import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Upload, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getProject, createTask, updateTaskStatus } from "@/server/portal.functions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_portal/portal/projects/$id")({
  head: () => ({ meta: [{ title: "Project — UIG Apex" }, { name: "robots", content: "noindex" }] }),
  component: ProjectDetail,
});

type Data = Awaited<ReturnType<typeof getProject>>;

async function authHeaders() {
  const { data: sess } = await supabase.auth.getSession();
  return { authorization: `Bearer ${sess.session!.access_token}` };
}

function ProjectDetail() {
  const { id } = Route.useParams();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const headers = await authHeaders();
    const res = await getProject({ data: { id }, headers });
    setData(res);
    setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!data?.project) return <div className="text-muted-foreground">Project not found.</div>;

  const p = data.project;

  return (
    <div className="space-y-6 max-w-6xl">
      <Link to="/portal/projects" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to projects
      </Link>
      <div>
        <div className="text-xs text-gold uppercase tracking-wider">{p.type.replace("_", " ")}</div>
        <h1 className="mt-2 text-3xl font-bold">{p.name}</h1>
        {p.description && <p className="mt-2 text-muted-foreground max-w-2xl">{p.description}</p>}
        <div className="mt-3 inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs capitalize">{p.status}</div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({data.tasks.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({data.documents.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <InfoCard label="Tasks" value={data.tasks.length} />
            <InfoCard label="Open" value={data.tasks.filter((t) => t.status !== "done").length} />
            <InfoCard label="Documents" value={data.documents.length} />
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TasksTab projectId={id} tasks={data.tasks} onChange={load} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab projectId={id} documents={data.documents} onChange={load} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted-foreground">
            Activity timeline coming soon.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-display font-bold">{value}</div>
    </div>
  );
}

function TasksTab({ projectId, tasks, onChange }: { projectId: string; tasks: Data["tasks"]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", due_date: "" });
  const [busy, setBusy] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const headers = await authHeaders();
      await createTask({ data: { project_id: projectId, ...form }, headers });
      toast.success("Task added");
      setOpen(false);
      setForm({ title: "", description: "", due_date: "" });
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function onStatus(id: string, status: "todo" | "in_progress" | "done") {
    const headers = await authHeaders();
    await updateTaskStatus({ data: { id, status }, headers });
    onChange();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90"><Plus className="h-4 w-4 mr-2" />Add task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="t-title">Title</Label>
                <Input id="t-title" required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-desc">Description</Label>
                <Textarea id="t-desc" maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-due">Due date</Label>
                <Input id="t-due" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <Button disabled={busy} type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90">Create task</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No tasks yet.</div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {tasks.map((t) => (
            <li key={t.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className={`font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
                {t.due_date && <div className="text-xs text-muted-foreground">Due {t.due_date}</div>}
              </div>
              <Select value={t.status} onValueChange={(v) => onStatus(t.id, v as "todo" | "in_progress" | "done")}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To do</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DocumentsTab({ projectId, documents, onChange }: { projectId: string; documents: Data["documents"]; onChange: () => void }) {
  const [uploading, setUploading] = useState(false);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session!.user.id;
      const path = `${projectId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("project-documents").upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("documents").insert({
        project_id: projectId,
        name: file.name,
        file_path: path,
        size_bytes: file.size,
        mime_type: file.type,
        uploaded_by: userId,
      });
      if (dbErr) throw dbErr;
      toast.success("File uploaded");
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDownload(path: string, name: string) {
    const { data, error } = await supabase.storage.from("project-documents").createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.click();
  }

  async function onDelete(id: string, path: string) {
    if (!confirm("Delete this file?")) return;
    await supabase.storage.from("project-documents").remove([path]);
    await supabase.from("documents").delete().eq("id", id);
    onChange();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <label className="cursor-pointer">
          <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
          <span className="inline-flex items-center rounded-md bg-gold text-gold-foreground hover:bg-gold/90 px-4 py-2 text-sm font-medium">
            <Upload className="h-4 w-4 mr-2" /> {uploading ? "Uploading…" : "Upload file"}
          </span>
        </label>
      </div>
      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No documents yet.</div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {documents.map((d) => (
            <li key={d.id} className="p-4 flex items-center justify-between gap-4">
              <button onClick={() => onDownload(d.file_path, d.name)} className="flex items-center gap-3 min-w-0 text-left hover:text-gold">
                <FileText className="h-4 w-4 text-gold shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.mime_type ?? "file"}</div>
                </div>
              </button>
              <button onClick={() => onDelete(d.id, d.file_path)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
