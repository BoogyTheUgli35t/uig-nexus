import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listProjects, createProject } from "@/lib/portal.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_apex/portal/projects/")({
  head: () => ({
    meta: [{ title: "Projects — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: ProjectsPage,
});

type Project = Awaited<ReturnType<typeof listProjects>>[number];

const TYPE_LABEL: Record<string, string> = {
  tech: "Technology",
  real_estate: "Real Estate",
  logistics: "Logistics",
  agritech: "AgriTech",
  other: "Other",
};

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "tech" as Project["type"] });

  async function load() {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const headers = { authorization: `Bearer ${sess.session.access_token}` };
    const data = await listProjects({ headers });
    setProjects(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const headers = { authorization: `Bearer ${sess.session!.access_token}` };
      await createProject({ data: form, headers });
      toast.success("Project created");
      setOpen(false);
      setForm({ name: "", description: "", type: "tech" });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-gold uppercase tracking-wider">Universal projects</p>
          <h1 className="mt-2 text-3xl font-bold">Projects</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Tech builds, properties and shipments — one model.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Plus className="h-4 w-4 mr-2" /> New project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
            </DialogHeader>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  maxLength={150}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as Project["type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABEL).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <Button
                disabled={submitting}
                type="submit"
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <h3 className="font-semibold">No projects yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first project to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to="/portal/projects/$id"
              params={{ id: p.id }}
              className="rounded-xl border border-border bg-surface p-5 hover:border-gold/40 transition"
            >
              <div className="text-xs text-gold uppercase tracking-wider">{TYPE_LABEL[p.type]}</div>
              <h3 className="mt-2 font-semibold">{p.name}</h3>
              {p.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
              )}
              <div className="mt-4 text-xs text-muted-foreground capitalize">
                Status: {p.status}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
