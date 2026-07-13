-- eSign stub for Real Estate leases (master plan: "eSign integration stub").
-- No DocuSign/PandaDoc credentials are available, so this is a real internal
-- workflow (draft -> sent -> signed/void, with a captured typed signature and
-- timestamp) rather than a fake "connected" state — same honesty pattern used
-- for the Lovable AI Gateway elsewhere in this codebase. Swapping in a real
-- eSign vendor later just means replacing how `lease_signed_at` gets set.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS lease_signature_status text NOT NULL DEFAULT 'draft'
    CHECK (lease_signature_status IN ('draft', 'sent', 'signed', 'void')),
  ADD COLUMN IF NOT EXISTS lease_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS lease_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS lease_signed_name text,
  ADD COLUMN IF NOT EXISTS lease_document_path text;

INSERT INTO storage.buckets (id, name, public) VALUES ('lease-documents', 'lease-documents', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "real estate members read lease documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'lease-documents'
    AND (
      private.has_division_access(auth.uid(), 'real-estate')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );

CREATE POLICY "real estate members upload lease documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'lease-documents'
    AND (
      private.has_division_access(auth.uid(), 'real-estate')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );

CREATE POLICY "real estate members delete lease documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'lease-documents'
    AND (
      private.has_division_access(auth.uid(), 'real-estate')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );
