-- Public system status page (/status). This is deliberately a NEW, separate
-- data model rather than reusing the portal's SLA tracker (tech.functions.ts
-- getTechWorkspace/slaAtRisk) — that tracker holds per-project client_name,
-- client_email and budget, which is confidential CRM data and must never be
-- exposed to anon requests. A status page's whole purpose is to be public,
-- so it gets its own tables with their own, much more open RLS.

CREATE TABLE IF NOT EXISTS public.status_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'operational'
    CHECK (status IN ('operational', 'degraded', 'partial_outage', 'major_outage')),
  position int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.status_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  severity text NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  status text NOT NULL DEFAULT 'investigating'
    CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  component_id uuid REFERENCES public.status_components(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS status_incidents_created_idx ON public.status_incidents (created_at DESC);

ALTER TABLE public.status_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_incidents ENABLE ROW LEVEL SECURITY;

-- Fully public read — that's the point of a status page.
GRANT SELECT ON public.status_components TO anon;
GRANT SELECT ON public.status_incidents TO anon;
CREATE POLICY "public read status components" ON public.status_components
  FOR SELECT TO anon USING (true);
CREATE POLICY "public read status incidents" ON public.status_incidents
  FOR SELECT TO anon USING (true);

-- Technology division staff (or admins/staff) manage status — same
-- has_division_access() pattern used across every other division's tables.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.status_components TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.status_incidents TO authenticated;

CREATE POLICY "tech members manage status components" ON public.status_components
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

CREATE POLICY "tech members manage status incidents" ON public.status_incidents
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

-- Seed the components that actually exist in this build. No incident history
-- is seeded — a fabricated "resolved incident" would misrepresent real
-- operational history on a page whose entire value is being trustworthy.
INSERT INTO public.status_components (name, description, status, position)
SELECT v.name, v.description, 'operational', v.position
FROM (VALUES
  ('Web Platform & Marketing Site', 'Public site, division pages and content.', 0),
  ('Apex Portal (Client Dashboard)', 'Authenticated portal across all six divisions.', 1),
  ('Real Estate Listings & Search', 'Public property browsing, search and detail pages.', 2),
  ('Payments Processing', 'Checkout and payment processing.', 3),
  ('Logistics Tracking API', 'Shipment tracking and delivery status updates.', 4)
) AS v(name, description, position)
WHERE NOT EXISTS (SELECT 1 FROM public.status_components WHERE name = v.name);
