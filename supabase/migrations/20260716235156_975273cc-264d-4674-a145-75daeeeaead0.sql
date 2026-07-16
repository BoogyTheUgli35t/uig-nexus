
-- === notifications: remove permissive INSERT policy, replace with admin/staff only ===
DROP POLICY IF EXISTS "authenticated users insert notifications" ON public.notifications;

CREATE POLICY "admins and staff insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'staff'::app_role)
);

-- === access_requests: signed-in submissions must match caller ===
DROP POLICY IF EXISTS "anyone_submit_access" ON public.access_requests;

CREATE POLICY "submit access request"
ON public.access_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Anonymous submission: user_id must be null
  (auth.uid() IS NULL AND user_id IS NULL)
  -- Signed-in submission: must be for yourself
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- === innovation_submissions: cap sizes to prevent junk floods ===
DROP POLICY IF EXISTS "public can submit ideas" ON public.innovation_submissions;

CREATE POLICY "public can submit ideas"
ON public.innovation_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(full_name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 100
  AND char_length(idea_title) BETWEEN 1 AND 400
  AND char_length(idea_description) BETWEEN 1 AND 4000
);

-- === Revoke public EXECUTE on internal SECURITY DEFINER helpers ===
-- Keep track_shipment* callable by anon/authenticated (public tracking page).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.user_org(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
