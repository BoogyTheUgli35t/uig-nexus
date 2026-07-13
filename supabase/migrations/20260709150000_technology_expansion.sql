-- Technology deep-build: richer project fields, deployments/release history, a
-- (simulated-execution) automation rules engine, milestone invoices and project documents.

-- ===== New columns on existing tables =====
ALTER TABLE public.tech_projects ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.tech_projects ADD COLUMN IF NOT EXISTS budget numeric CHECK (budget IS NULL OR budget >= 0);
ALTER TABLE public.tech_projects ADD COLUMN IF NOT EXISTS sla_hours integer CHECK (sla_hours IS NULL OR sla_hours > 0);
ALTER TABLE public.tech_projects ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.tech_projects ADD COLUMN IF NOT EXISTS due_date date;

ALTER TABLE public.tech_tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.tech_tasks ADD COLUMN IF NOT EXISTS assignee_email text;
ALTER TABLE public.tech_tasks ADD COLUMN IF NOT EXISTS due_date date;

-- ===== Deployments / release history =====
CREATE TABLE public.deployments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_project_id uuid NOT NULL REFERENCES public.tech_projects(id) ON DELETE CASCADE,
  version text NOT NULL,
  environment text NOT NULL DEFAULT 'staging' CHECK (environment IN ('staging','production')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  notes text,
  deployed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Automation rules =====
-- Execution is simulated (no real trigger engine wired up) — see requirements doc.
-- run_count / last_run_at are updated by a "Run now" button in the UI, not a scheduler.
CREATE TABLE public.automation_rules (
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

-- ===== Milestone invoices =====
CREATE TABLE public.project_invoices (
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

-- ===== Project documents =====
-- Separate from the generic `documents` table (which is scoped to the generic
-- `projects`/org model, not tech_projects) — kept private, signed-URL only, same as
-- the existing project-documents bucket, since these can include client contracts.
CREATE TABLE public.tech_project_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_project_id uuid NOT NULL REFERENCES public.tech_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  size_bytes bigint,
  mime_type text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deployments TO authenticated;
GRANT ALL ON public.deployments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_invoices TO authenticated;
GRANT ALL ON public.project_invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_project_documents TO authenticated;
GRANT ALL ON public.tech_project_documents TO service_role;

-- ===== RLS =====
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tech members read deployments" ON public.deployments
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "tech members manage deployments" ON public.deployments
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "tech members read automation rules" ON public.automation_rules
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "tech members manage automation rules" ON public.automation_rules
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "tech members read invoices" ON public.project_invoices
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "tech members manage invoices" ON public.project_invoices
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "tech members read documents" ON public.tech_project_documents
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "tech members manage documents" ON public.tech_project_documents
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE TRIGGER set_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Storage bucket for project documents (private, signed-URL access) =====
INSERT INTO storage.buckets (id, name, public) VALUES ('tech-project-documents', 'tech-project-documents', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "tech members read project files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'tech-project-documents'
    AND (
      private.has_division_access(auth.uid(), 'technology')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );

CREATE POLICY "tech members upload project files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tech-project-documents'
    AND (
      private.has_division_access(auth.uid(), 'technology')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );

CREATE POLICY "tech members delete project files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'tech-project-documents'
    AND (
      private.has_division_access(auth.uid(), 'technology')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );
