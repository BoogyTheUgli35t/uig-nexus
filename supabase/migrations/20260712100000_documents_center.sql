-- Shared documents center (master plan: "shared infra: notifications, messaging,
-- documents center, admin panel"). NOTE: a `documents` table already exists,
-- scoped to the legacy generic `projects`/`tasks` system — this is a distinct
-- table, `document_library`, for cross-division / company-wide files (not tied
-- to a single legacy project). Storage objects live in a private
-- `document-library` bucket, path-namespaced by uploader (`${auth.uid()}/...`).

CREATE TABLE public.document_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  division text, -- null = company-wide / shared across all divisions
  title text NOT NULL,
  description text,
  file_path text NOT NULL UNIQUE,
  file_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX document_library_division_idx ON public.document_library (division);
CREATE INDEX document_library_owner_idx ON public.document_library (owner_id);

ALTER TABLE public.document_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read visible library documents" ON public.document_library
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR division IS NULL
    OR private.has_division_access(auth.uid(), division)
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "upload library documents" ON public.document_library
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND (
      division IS NULL
      OR private.has_division_access(auth.uid(), division)
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );

CREATE POLICY "delete own library documents" ON public.document_library
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public) VALUES ('document-library', 'document-library', false)
  ON CONFLICT (id) DO NOTHING;

-- Path convention: `${auth.uid()}/${filename}`. Uploaders can only write into
-- their own folder; read access mirrors the `document_library` table policy
-- above via a lookup on file_path, so a division colleague can read a file
-- even though they didn't upload it.
CREATE POLICY "read visible library document files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'document-library'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.document_library d
        WHERE d.file_path = name
          AND (
            d.division IS NULL
            OR private.has_division_access(auth.uid(), d.division)
            OR private.has_role(auth.uid(), 'admin'::app_role)
            OR private.has_role(auth.uid(), 'staff'::app_role)
          )
      )
    )
  );

CREATE POLICY "upload own library document files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'document-library' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "delete own library document files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'document-library'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR private.has_role(auth.uid(), 'admin'::app_role)
    )
  );
