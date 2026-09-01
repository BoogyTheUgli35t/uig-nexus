import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import {
  attachRecordDocument,
  deleteRecordDocument,
  getDocumentDownloadUrl,
  listRecordDocuments,
  type RecordTable,
} from "@/lib/record-documents.functions";
import { authHeaders } from "@/lib/auth-headers";
import { supabase } from "@/integrations/supabase/client";
import { DataPanel, EmptyState } from "@/components/portal/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Secure per-record document panel: uploads land in the caller's own folder in
 * the private `document-library` bucket, and downloads go through a short-lived
 * signed URL issued server-side after an ownership/RLS check.
 */
export function RecordDocuments({
  recordTable,
  recordId,
  division,
  title = "Documents",
}: {
  recordTable: RecordTable;
  recordId: string;
  division?: string | null;
  title?: string;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const queryKey = ["record-documents", recordTable, recordId];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () =>
      listRecordDocuments({
        headers: await authHeaders(),
        data: { record_table: recordTable, record_id: recordId },
      }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) =>
      deleteRecordDocument({ data: { id }, headers: await authHeaders() }),
    onSuccess: () => {
      toast.success("Document removed");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onDownload(id: string) {
    try {
      const { url } = await getDocumentDownloadUrl({ data: { id }, headers: await authHeaders() });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open document");
    }
  }

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Choose a file first");
    if (!docTitle.trim()) return toast.error("Give the document a title");
    if (file.size > MAX_BYTES) return toast.error("File is larger than 25 MB");

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const safeName = file.name.replace(/[^\w.-]+/g, "_");
      const path = `${user.id}/${recordTable}/${recordId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("document-library").upload(path, file);
      if (upErr) throw upErr;
      await attachRecordDocument({
        headers: await authHeaders(),
        data: {
          record_table: recordTable,
          record_id: recordId,
          division: division ?? null,
          title: docTitle.trim(),
          file_path: path,
          file_type: file.type,
          size_bytes: file.size,
        },
      });
      toast.success("Document uploaded");
      setFile(null);
      setDocTitle("");
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const docs = data ?? [];

  return (
    <DataPanel title={title}>
      <form onSubmit={onUpload} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor={`doc-title-${recordId}`}>Title</Label>
          <Input
            id={`doc-title-${recordId}`}
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="Title deed, survey plan…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`doc-file-${recordId}`}>File (max 25 MB)</Label>
          <Input
            id={`doc-file-${recordId}`}
            ref={fileRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button type="submit" disabled={uploading} className="sm:mb-0">
          <Upload className="mr-2 h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
        </Button>
      </form>

      <div className="mt-5">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading documents…</div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Upload contracts, plans or certificates for this record."
          />
        ) : (
          <ul className="divide-y divide-border">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(d.size_bytes)} · {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDownload(d.id)}
                  aria-label={`Download ${d.title}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMut.mutate(d.id)}
                  aria-label={`Delete ${d.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DataPanel>
  );
}
