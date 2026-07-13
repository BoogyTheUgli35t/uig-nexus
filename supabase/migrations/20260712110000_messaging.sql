-- A `messages` table + listMessages/sendMessage server functions already
-- exist (division-scoped thread chat: division, thread_key, body, sender_id)
-- but were never wired up to any UI — this is the "shared messaging" gap
-- from the master plan. Rather than duplicate the table, we just add what's
-- missing: division-mates need to be able to resolve each other's display
-- name/avatar to render a chat thread, but the base "users read own profile"
-- policy is self-only. Policies are OR'd together, so this only *adds*
-- visibility (never removes it) for people who already share a division,
-- plus staff/admin who should be visible to everyone as a support contact.
CREATE POLICY "read division-mate profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(id, 'staff'::app_role)
    OR private.has_role(id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_divisions ud1
      JOIN public.user_divisions ud2 ON ud1.division_slug = ud2.division_slug
      WHERE ud1.user_id = auth.uid() AND ud2.user_id = profiles.id
    )
  );
