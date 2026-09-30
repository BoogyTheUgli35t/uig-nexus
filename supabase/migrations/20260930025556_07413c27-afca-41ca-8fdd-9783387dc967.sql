DROP POLICY IF EXISTS "authed read division admins" ON public.division_admins;
CREATE POLICY "users and relevant admins read division admins" ON public.division_admins
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.is_division_admin(auth.uid(), division_slug)
  );