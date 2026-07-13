-- Real Estate deep-build: property units, image galleries, CRM activity log and
-- lead follow-up tracking, plus a few extra columns the new property wizard needs.

-- ===== New columns on existing tables =====
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS year_built integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_follow_up_date date;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS budget_max numeric CHECK (budget_max IS NULL OR budget_max >= 0);

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS unit_id uuid;

-- ===== Property units =====
CREATE TABLE public.property_units (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  floor integer,
  bedrooms integer NOT NULL DEFAULT 0 CHECK (bedrooms >= 0),
  bathrooms integer NOT NULL DEFAULT 0 CHECK (bathrooms >= 0),
  area_sqm numeric NOT NULL DEFAULT 0 CHECK (area_sqm >= 0),
  rent_amount numeric NOT NULL DEFAULT 0 CHECK (rent_amount >= 0),
  status text NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant','occupied','maintenance')),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, unit_number)
);

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.property_units(id) ON DELETE SET NULL;

-- ===== Property image gallery =====
-- Stored in a public Storage bucket (see below) — unlike project-documents (private,
-- signed-URL only), listing photos are meant to render directly in <img> tags across
-- grids/galleries, so a permanent public URL is the right tradeoff here.
CREATE TABLE public.property_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  caption text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== CRM activity log (calls, emails, viewings, notes, stage changes) =====
CREATE TABLE public.crm_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'note' CHECK (activity_type IN ('call','email','viewing','note','stage_change')),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_units TO authenticated;
GRANT ALL ON public.property_units TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities TO authenticated;
GRANT ALL ON public.crm_activities TO service_role;

-- ===== RLS =====
ALTER TABLE public.property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realestate members read units" ON public.property_units
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "realestate members manage units" ON public.property_units
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "realestate members read images" ON public.property_images
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "realestate members manage images" ON public.property_images
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "realestate members read activities" ON public.crm_activities
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "realestate members manage activities" ON public.crm_activities
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

-- ===== updated_at trigger =====
CREATE TRIGGER set_property_units_updated_at
  BEFORE UPDATE ON public.property_units
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Storage bucket for property image galleries =====
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read property images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "realestate members upload property images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND (
      private.has_division_access(auth.uid(), 'real-estate')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );

CREATE POLICY "realestate members delete property images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (
      private.has_division_access(auth.uid(), 'real-estate')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );
