CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  unit_id uuid references public.property_units(id) on delete set null,
  title text not null,
  description text,
  category text not null default 'general',
  priority text not null default 'normal',
  status text not null default 'open',
  staff_notes text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_requests TO authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants view own maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Tenants view own maintenance requests"
ON public.maintenance_requests FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  OR tenant_id IN (
    SELECT t.id FROM public.tenants t
    WHERE lower(t.email) = lower((SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Tenants create own maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Tenants create own maintenance requests"
ON public.maintenance_requests FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  OR tenant_id IN (
    SELECT t.id FROM public.tenants t
    WHERE lower(t.email) = lower((SELECT u.email FROM auth.users u WHERE u.id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Staff manage maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Staff manage maintenance requests"
ON public.maintenance_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

DROP POLICY IF EXISTS "Admins delete maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Admins delete maintenance requests"
ON public.maintenance_requests FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS set_maintenance_requests_updated_at ON public.maintenance_requests;
CREATE TRIGGER set_maintenance_requests_updated_at
BEFORE UPDATE ON public.maintenance_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();