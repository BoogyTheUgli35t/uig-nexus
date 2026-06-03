-- ===== Tech projects =====
CREATE TABLE public.tech_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  title text NOT NULL,
  client_name text,
  status text NOT NULL DEFAULT 'discovery' CHECK (status IN ('discovery','building','review','live','paused')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  owner_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Tech tasks =====
CREATE TABLE public.tech_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_project_id uuid NOT NULL REFERENCES public.tech_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Integrations =====
CREATE TABLE public.integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  provider text,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected','error','disconnected')),
  last_sync timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_projects TO authenticated;
GRANT ALL ON public.tech_projects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_tasks TO authenticated;
GRANT ALL ON public.tech_tasks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;

-- ===== RLS =====
ALTER TABLE public.tech_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Reusable predicate: technology division access OR staff/admin
CREATE POLICY "tech members read projects" ON public.tech_projects
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "tech members manage projects" ON public.tech_projects
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

CREATE POLICY "tech members read tasks" ON public.tech_tasks
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "tech members manage tasks" ON public.tech_tasks
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

CREATE POLICY "tech members read integrations" ON public.integrations
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'technology')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "tech members manage integrations" ON public.integrations
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

-- updated_at trigger for tech_projects
CREATE TRIGGER set_tech_projects_updated_at
  BEFORE UPDATE ON public.tech_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Seed sample data =====
WITH p AS (
  INSERT INTO public.tech_projects (title, client_name, status, progress) VALUES
    ('Pan-African Payments Platform', 'Kuda Microfinance', 'building', 62),
    ('Logistics Command Center', 'GIG Logistics', 'review', 84),
    ('AgriCredit Scoring Engine', 'Babban Gona', 'discovery', 18),
    ('Smart Estate Resident App', 'Eko Atlantic', 'live', 100),
    ('Healthcare Records API', 'Reliance HMO', 'paused', 40)
  RETURNING id, title
)
INSERT INTO public.tech_tasks (tech_project_id, title, status)
SELECT id, t.title, t.status FROM p
CROSS JOIN LATERAL (VALUES
  ('Discovery workshop', 'done'),
  ('System architecture', 'done'),
  ('Sprint 1 build', 'in_progress'),
  ('QA & security review', 'todo'),
  ('Client UAT', 'todo')
) AS t(title, status);

INSERT INTO public.integrations (name, provider, status, last_sync) VALUES
  ('Stripe Payments', 'stripe', 'connected', now() - interval '8 minutes'),
  ('Paystack', 'paystack', 'connected', now() - interval '22 minutes'),
  ('Twilio SMS', 'twilio', 'error', now() - interval '3 hours'),
  ('SendGrid Email', 'sendgrid', 'connected', now() - interval '1 hour'),
  ('Google Maps', 'google', 'disconnected', NULL),
  ('Slack Notifications', 'slack', 'connected', now() - interval '5 minutes');