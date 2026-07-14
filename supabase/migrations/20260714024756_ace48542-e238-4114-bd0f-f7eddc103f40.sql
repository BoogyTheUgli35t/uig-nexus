CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "anyone can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (length(trim(email)) > 3 AND position('@' IN email) > 1);
DROP POLICY IF EXISTS "admins read newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "admins read newsletter subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

-- Real Estate
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS year_built integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_follow_up_date date;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS budget_max numeric CHECK (budget_max IS NULL OR budget_max >= 0);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS unit_id uuid;

CREATE TABLE IF NOT EXISTS public.property_units (
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
DO $tfk$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tenants_unit_id_fkey') THEN ALTER TABLE public.tenants ADD CONSTRAINT tenants_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.property_units(id) ON DELETE SET NULL; END IF; END $tfk$;

CREATE TABLE IF NOT EXISTS public.property_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  caption text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'note' CHECK (activity_type IN ('call','email','viewing','note','stage_change')),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_units TO authenticated;
GRANT ALL ON public.property_units TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_activities TO authenticated;
GRANT ALL ON public.crm_activities TO service_role;

ALTER TABLE public.property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realestate members read units" ON public.property_units;
CREATE POLICY "realestate members read units" ON public.property_units
  FOR SELECT TO authenticated USING (private.has_division_access(auth.uid(), 'real-estate') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "realestate members manage units" ON public.property_units;
CREATE POLICY "realestate members manage units" ON public.property_units
  FOR ALL TO authenticated USING (private.has_division_access(auth.uid(), 'real-estate') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'real-estate') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

DROP POLICY IF EXISTS "realestate members read images" ON public.property_images;
CREATE POLICY "realestate members read images" ON public.property_images
  FOR SELECT TO authenticated USING (private.has_division_access(auth.uid(), 'real-estate') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "realestate members manage images" ON public.property_images;
CREATE POLICY "realestate members manage images" ON public.property_images
  FOR ALL TO authenticated USING (private.has_division_access(auth.uid(), 'real-estate') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'real-estate') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

DROP POLICY IF EXISTS "realestate members read activities" ON public.crm_activities;
CREATE POLICY "realestate members read activities" ON public.crm_activities
  FOR SELECT TO authenticated USING (private.has_division_access(auth.uid(), 'real-estate') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "realestate members manage activities" ON public.crm_activities;
CREATE POLICY "realestate members manage activities" ON public.crm_activities
  FOR ALL TO authenticated USING (private.has_division_access(auth.uid(), 'real-estate') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'real-estate') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

DROP TRIGGER IF EXISTS set_property_units_updated_at ON public.property_units;
CREATE TRIGGER set_property_units_updated_at BEFORE UPDATE ON public.property_units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Technology
ALTER TABLE public.tech_projects ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.tech_projects ADD COLUMN IF NOT EXISTS budget numeric CHECK (budget IS NULL OR budget >= 0);
ALTER TABLE public.tech_projects ADD COLUMN IF NOT EXISTS sla_hours integer CHECK (sla_hours IS NULL OR sla_hours > 0);
ALTER TABLE public.tech_projects ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.tech_projects ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.tech_tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.tech_tasks ADD COLUMN IF NOT EXISTS assignee_email text;
ALTER TABLE public.tech_tasks ADD COLUMN IF NOT EXISTS due_date date;

CREATE TABLE IF NOT EXISTS public.deployments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_project_id uuid NOT NULL REFERENCES public.tech_projects(id) ON DELETE CASCADE,
  version text NOT NULL,
  environment text NOT NULL DEFAULT 'staging' CHECK (environment IN ('staging','production')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  notes text,
  deployed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_project_id uuid REFERENCES public.tech_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual','on_task_done','on_status_change','schedule')),
  action_type text NOT NULL DEFAULT 'notify' CHECK (action_type IN ('notify','create_task','send_webhook','update_status')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  run_count integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.project_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_project_id uuid NOT NULL REFERENCES public.tech_projects(id) ON DELETE CASCADE,
  milestone text NOT NULL,
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue')),
  due_date date,
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.tech_project_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_project_id uuid NOT NULL REFERENCES public.tech_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  size_bytes bigint,
  mime_type text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deployments TO authenticated;
GRANT ALL ON public.deployments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_invoices TO authenticated;
GRANT ALL ON public.project_invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_project_documents TO authenticated;
GRANT ALL ON public.tech_project_documents TO service_role;

ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tech members read deployments" ON public.deployments;
CREATE POLICY "tech members read deployments" ON public.deployments
  FOR SELECT TO authenticated USING (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "tech members manage deployments" ON public.deployments;
CREATE POLICY "tech members manage deployments" ON public.deployments
  FOR ALL TO authenticated USING (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

DROP POLICY IF EXISTS "tech members read automation rules" ON public.automation_rules;
CREATE POLICY "tech members read automation rules" ON public.automation_rules
  FOR SELECT TO authenticated USING (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "tech members manage automation rules" ON public.automation_rules;
CREATE POLICY "tech members manage automation rules" ON public.automation_rules
  FOR ALL TO authenticated USING (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

DROP POLICY IF EXISTS "tech members read invoices" ON public.project_invoices;
CREATE POLICY "tech members read invoices" ON public.project_invoices
  FOR SELECT TO authenticated USING (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "tech members manage invoices" ON public.project_invoices;
CREATE POLICY "tech members manage invoices" ON public.project_invoices
  FOR ALL TO authenticated USING (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

DROP POLICY IF EXISTS "tech members read documents" ON public.tech_project_documents;
CREATE POLICY "tech members read documents" ON public.tech_project_documents
  FOR SELECT TO authenticated USING (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "tech members manage documents" ON public.tech_project_documents;
CREATE POLICY "tech members manage documents" ON public.tech_project_documents
  FOR ALL TO authenticated USING (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'technology') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

DROP TRIGGER IF EXISTS set_automation_rules_updated_at ON public.automation_rules;
CREATE TRIGGER set_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();