import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Upload, Download, Trash2, Filter } from "lucide-react";
import { listDocuments, recordDocument, deleteDocument } from "@/lib/documents.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { DIVISIONS } from "@/lib/divisions";
import { DataPanel, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_apex/portal/documents")({
  head: () => ({
    meta: [{ title: "Documents — UIG Apex" }, { name: "robots", content: "noindex" }],
  }),
  component: DocumentsPage,
});

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function DocumentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [division, setDivision] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["document-library"],
    queryFn: async () => listDocuments({ headers: await authHeaders() }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["document-library"] });

  const deleteMut = useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) =>
      deleteDocument({ data: doc, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Document removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data;
    if (filter === "shared") return data.filter((d) => d.division === null);
    return data.filter((d) => d.division === filter);
  }, [data, filter]);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("document-library").upload(path, file);
      if (upErr) throw upErr;
      await recordDocument({
        data: {
          title: title.trim(),
          division: division || null,
          file_path: path,
          file_type: file.type || undefined,
          size_bytes: file.size,
        },
        headers: await authHeaders(),
      });
      toast.success("Document uploaded");
      setTitle("");
      setDivision("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onDownload(filePath: string, title: string) {
    const { data, error } = await supabase.storage
      .from("document-library")
      .createSignedUrl(filePath, 60);
    if (error || !data) {
      toast.error(error?.message ?? "Couldn't generate download link");
      return;
    }
    const a = window.document.createElement("a");
    a.href = data.signedUrl;
    a.download = title;
    a.target = "_blank";
    a.click();
  }

  if (error) return <div className="text-destructive text-sm">{(error as Error).message}</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="text-sm text-gold uppercase tracking-wider">Shared infra</p>
        <h1 className="mt-2 text-3xl font-bold">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload files scoped to a division, or leave company-wide so everyone can see them.
        </p>
      </div>

      <DataPanel title="Upload a document">
        <form onSubmit={onUpload} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-division">Division</Label>
            <select
              id="doc-division"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Company-wide (shared)</option>
              {DIVISIONS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.short}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="doc-file-input">File</Label>
            <input
              id="doc-file-input"
              ref={fileInputRef}
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-gold/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gold hover:file:bg-gold/20"
            />
          </div>
          <Button
            type="submit"
            disabled={uploading || !file || !title.trim()}
            className="sm:col-span-2 bg-gold text-gold-foreground hover:bg-gold/90"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </DataPanel>

      <DataPanel
        title={`Library (${filtered.length})`}
        action={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-7 rounded-md border border-input bg-transparent px-2 text-xs"
            >
              <option value="all">All</option>
              <option value="shared">Company-wide</option>
              {DIVISIONS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.short}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No documents yet" />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{d.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">
                      {d.division
                        ? (DIVISIONS.find((x) => x.slug === d.division)?.short ?? d.division)
                        : "Company-wide"}
                    </span>
                    <span>·</span>
                    <span>{formatBytes(d.size_bytes)}</span>
                    <span>·</span>
                    <span>{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownload(d.file_path, d.title)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    disabled={deleteMut.isPending}
                    onClick={() => deleteMut.mutate({ id: d.id, file_path: d.file_path })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );
}
