-- Tenant self-service portal.
--
-- Two gaps this closes:
--   1. `tenants` had no user_id, so a tenant with a portal account could not be
--      linked to their own tenancy record — every other role (driver, farmer,
--      investor) already has this link. Without it there is no way to scope
--      "show me MY lease" safely.
--   2. There was no maintenance table at all, despite the tenant portal spec
--      calling for maintenance requests.
--
-- Mirrors the existing linkInvestorAccount / linkFarmerAccount pattern: staff
-- link a tenant row to an existing portal account by email, and RLS then lets
-- that user read their own row only.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tenants_user_id_idx ON public.tenants (user_id);

COMMENT ON COLUMN public.tenants.user_id IS
  'Portal account for this tenant, linked by staff. Enables the tenant self-service portal.';

-- ===== Maintenance requests =====

CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.property_units(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'plumbing', 'electrical', 'appliance', 'structural', 'security')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'urgent')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'closed')),
  staff_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS maintenance_requests_tenant_idx
  ON public.maintenance_requests (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS maintenance_requests_status_idx
  ON public.maintenance_requests (status);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_requests TO authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;

-- Tenants: read and raise their own requests. They may not edit one after
-- filing (status is the landlord's to set) — otherwise a tenant could mark
-- their own issue resolved, or reassign it to another tenancy.
CREATE POLICY "tenants read own maintenance requests" ON public.maintenance_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = maintenance_requests.tenant_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "tenants raise own maintenance requests" ON public.maintenance_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.id = maintenance_requests.tenant_id AND t.user_id = auth.uid()
    )
  );

-- Real Estate staff (and admins/staff) manage everything — same
-- has_division_access() pattern used across every other division table.
CREATE POLICY "realestate members manage maintenance requests" ON public.maintenance_requests
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

-- Tenants must be able to read their own tenancy row for the portal to show a
-- lease at all. Existing staff policies are untouched.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tenants'
      AND policyname = 'tenants read own record'
  ) THEN
    CREATE POLICY "tenants read own record" ON public.tenants
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
