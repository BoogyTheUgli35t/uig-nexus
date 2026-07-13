-- AgriTech deep-build: field map placeholder coordinates, a drone/field image
-- gallery, and a real (app-triggered) field-health alerting system. Cooperative
-- management reuses the existing farmers.cooperative text field (renamed in bulk)
-- rather than a new table, to keep this additive and low-risk.

ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS lat numeric;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS lng numeric;

-- ===== Drone / field image gallery =====
CREATE TABLE public.field_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('drone', 'manual')),
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Field health alerts =====
-- Rows are inserted by the app (not a DB trigger) whenever a field is marked
-- at_risk/critical or a sensor reading crosses a threshold — see
-- src/lib/agritech.functions.ts.
CREATE TABLE public.agri_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  message text NOT NULL,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_images TO authenticated;
GRANT ALL ON public.field_images TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_alerts TO authenticated;
GRANT ALL ON public.agri_alerts TO service_role;

-- ===== RLS =====
ALTER TABLE public.field_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agri_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agritech members read field images" ON public.field_images
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
    OR private.has_role(auth.uid(), 'farmer'::app_role)
  );
CREATE POLICY "agritech members manage field images" ON public.field_images
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "agritech members read alerts" ON public.agri_alerts
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
    OR private.has_role(auth.uid(), 'farmer'::app_role)
  );
CREATE POLICY "agritech members manage alerts" ON public.agri_alerts
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

-- ===== Storage bucket for field/drone images (public read, same rationale as
-- property-images) =====
INSERT INTO storage.buckets (id, name, public) VALUES ('field-images', 'field-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anyone reads field images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'field-images');

CREATE POLICY "agritech members upload field images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'field-images'
    AND (
      private.has_division_access(auth.uid(), 'agritech')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );

CREATE POLICY "agritech members delete field images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'field-images'
    AND (
      private.has_division_access(auth.uid(), 'agritech')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );
