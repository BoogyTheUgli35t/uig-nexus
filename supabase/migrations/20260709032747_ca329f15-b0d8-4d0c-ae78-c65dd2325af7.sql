-- Allow users to create their own preferences row (needed for onboarding upsert)
CREATE POLICY "users_insert_own_prefs" ON public.user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());