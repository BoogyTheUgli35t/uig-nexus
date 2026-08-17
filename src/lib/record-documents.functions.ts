import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Per-record document attachments. Files live in the private `document-library`
 * bucket, path-namespaced by uploader (`${auth.uid()}/...`), and are indexed in
 * public.document_library with (record_table, record_id).
 *
 * Ownership is enforced twice: storage RLS only lets a user write inside their
 * own folder, and every handler here re-checks that the supplied path is inside
 * the caller's folder before it is recorded or removed.
 */

export const RECORD_TABLES = [
  "properties",
  "property_units",
  "tenants",
  "leads",
  "projects",
  "shipments",
  "fields",
] as const;

export type RecordTable = (typeof RECORD_TABLES)[number];

const RecordRefSchema = z.object({
  record_table: z.enum(RECORD_TABLES),
  record_id: z.string().uuid(),
});

export const listRecordDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => RecordRefSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("document_library")
      .select(
        "id, owner_id, division, title, description, file_path, file_type, size_bytes, created_at",
      )
      .eq("record_table", data.record_table)
      .eq("record_id", data.record_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const AttachSchema = RecordRefSchema.extend({
  division: z.string().max(60).nullable().default(null),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  file_path: z.string().min(1).max(400),
  file_type: z.string().max(120).optional().or(z.literal("")),
  size_bytes: z.coerce.number().int().min(0).max(200 * 1024 * 1024).optional(),
});

export const attachRecordDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AttachSchema.parse(i))
  .handler(async ({ context, data }) => {
    if (!data.file_path.startsWith(`${context.userId}/`)) {
      throw new Error("You can only attach files you uploaded.");
    }
    const { error } = await context.supabase.from("document_library").insert({
      owner_id: context.userId,
      division: data.division,
      title: data.title,
      description: data.description || null,
      file_path: data.file_path,
      file_type: data.file_type || null,
      size_bytes: data.size_bytes ?? null,
      record_table: data.record_table,
      record_id: data.record_id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Short-lived signed download link. Storage RLS decides who may read. */
export const getDocumentDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("document_library")
      .select("file_path")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Document not found");

    const { data: signed, error: signErr } = await context.supabase.storage
      .from("document-library")
      .createSignedUrl(row.file_path, 60);
    if (signErr) throw new Error(signErr.message);
    return { url: signed.signedUrl };
  });

export const deleteRecordDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("document_library")
      .select("id, owner_id, file_path")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Document not found");
    if (row.owner_id !== context.userId) {
      throw new Error("Only the uploader can remove this document.");
    }
    const { error: storageErr } = await context.supabase.storage
      .from("document-library")
      .remove([row.file_path]);
    if (storageErr) throw new Error(storageErr.message);
    const { error: delErr } = await context.supabase
      .from("document_library")
      .delete()
      .eq("id", row.id);
    if (delErr) throw new Error(delErr.message);
    return { ok: true };
  });
