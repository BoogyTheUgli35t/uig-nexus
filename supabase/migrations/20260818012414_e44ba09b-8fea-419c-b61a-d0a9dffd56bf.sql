CREATE TABLE IF NOT EXISTS public.division_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  division_slug text NOT NULL REFERENCES public.divisions(slug) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, division_slug)
);

GRANT SELECT ON public.division_admins TO authenticated;
GRANT ALL ON public.division_admins TO service_role;

ALTER TABLE public.division_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authed read division admins" ON public.division_admins;
CREATE POLICY "authed read division admins" ON public.division_admins
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "global admins manage division admins" ON public.division_admins;
CREATE POLICY "global admins manage division admins" ON public.division_admins
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION private.is_division_admin(_user_id uuid, _division text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.division_admins
    WHERE user_id = _user_id AND division_slug = _division
  )
$$;

REVOKE ALL ON FUNCTION private.is_division_admin(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION private.is_division_admin(uuid, text) TO authenticated, service_role;

-- Division admins may grant/revoke access for their own division only.
GRANT INSERT, DELETE ON public.user_divisions TO authenticated;

DROP POLICY IF EXISTS "division admins read their members" ON public.user_divisions;
CREATE POLICY "division admins read their members" ON public.user_divisions
  FOR SELECT TO authenticated
  USING (private.is_division_admin(auth.uid(), division_slug));

DROP POLICY IF EXISTS "division admins grant own division" ON public.user_divisions;
CREATE POLICY "division admins grant own division" ON public.user_divisions
  FOR INSERT TO authenticated
  WITH CHECK (private.is_division_admin(auth.uid(), division_slug));

DROP POLICY IF EXISTS "division admins revoke own division" ON public.user_divisions;
CREATE POLICY "division admins revoke own division" ON public.user_divisions
  FOR DELETE TO authenticated
  USING (private.is_division_admin(auth.uid(), division_slug));

-- Access requests can now target a division.
ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS division_slug text REFERENCES public.divisions(slug) ON DELETE SET NULL;

DROP POLICY IF EXISTS "division admins read division requests" ON public.access_requests;
CREATE POLICY "division admins read division requests" ON public.access_requests
  FOR SELECT TO authenticated
  USING (division_slug IS NOT NULL AND private.is_division_admin(auth.uid(), division_slug));

DROP POLICY IF EXISTS "division admins update division requests" ON public.access_requests;
CREATE POLICY "division admins update division requests" ON public.access_requests
  FOR UPDATE TO authenticated
  USING (division_slug IS NOT NULL AND private.is_division_admin(auth.uid(), division_slug))
  WITH CHECK (division_slug IS NOT NULL AND private.is_division_admin(auth.uid(), division_slug));