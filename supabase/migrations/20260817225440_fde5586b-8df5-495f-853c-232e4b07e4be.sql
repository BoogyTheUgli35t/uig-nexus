ALTER TABLE public.document_library
  ADD COLUMN IF NOT EXISTS record_table text,
  ADD COLUMN IF NOT EXISTS record_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'document_library_record_table_check'
  ) THEN
    ALTER TABLE public.document_library
      ADD CONSTRAINT document_library_record_table_check
      CHECK (record_table IS NULL OR record_table IN ('properties','property_units','tenants','leads','projects','shipments','fields'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS document_library_record_idx
  ON public.document_library (record_table, record_id);