-- Recovered migration: this table existed only as an orphaned file at
-- supabase/migrations/new/20260625174100_create_user_preferences.sql, a non-standard
-- subfolder the Supabase CLI never applies migrations from. It has been moved here, into
-- the real migration sequence, and corrected against the generated
-- src/integrations/supabase/types.ts (the actual live schema) — notably the real table
-- has no separate `id` column at all; `user_id` itself is the primary key, which is also
-- what src/lib/portal.functions.ts (registerUserDivisions) requires for its
-- `upsert(..., { onConflict: "user_id" })` call to work. The original orphaned file used
-- a separate `id` primary key with no uniqueness on `user_id`, and was missing the
-- `notifications_enabled` column that the app writes on every signup.

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  division_selection_completed BOOLEAN DEFAULT FALSE,
  primary_division TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
