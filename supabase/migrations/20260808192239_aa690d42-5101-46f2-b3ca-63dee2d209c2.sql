ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tenants_user_id_idx ON public.tenants(user_id);

DROP POLICY IF EXISTS "Tenants view own tenancy" ON public.tenants;
CREATE POLICY "Tenants view own tenancy"
ON public.tenants FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Tenants view own maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Tenants view own maintenance requests"
ON public.maintenance_requests FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  OR tenant_id IN (SELECT t.id FROM public.tenants t WHERE t.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Tenants create own maintenance requests" ON public.maintenance_requests;
CREATE POLICY "Tenants create own maintenance requests"
ON public.maintenance_requests FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
  OR tenant_id IN (SELECT t.id FROM public.tenants t WHERE t.user_id = auth.uid())
);