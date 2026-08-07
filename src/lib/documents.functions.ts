import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("document_library")
      .select("id, owner_id, division, title, description, file_path, file_type, size_bytes, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const RecordDocumentSchema = z.object({
  division: z.string().nullable(),
  title: z.string().min(1),
  description: z.string().optional(),
  file_path: z.string().min(1),
  file_type: z.string().optional(),
  size_bytes: z.number().optional(),
});

export const recordDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => RecordDocumentSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("document_library").insert({
      owner_id: context.userId,
      division: data.division,
      title: data.title,
      description: data.description ?? null,
      file_path: data.file_path,
      file_type: data.file_type ?? null,
      size_bytes: data.size_bytes ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const DeleteDocumentSchema = z.object({ id: z.string(), file_path: z.string() });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => DeleteDocumentSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { error: storageErr } = await context.supabase.storage
      .from("document-library")
      .remove([data.file_path]);
    if (storageErr) throw new Error(storageErr.message);
    const { error } = await context.supabase.from("document_library").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
