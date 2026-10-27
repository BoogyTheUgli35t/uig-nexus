-- Bring a database built from these migration files into line with the live
-- production schema (the Lovable Cloud project this app has been running on).
--
-- Why this exists: several hand-written migrations in this folder were never
-- run as migrations on production. Some of their changes were applied there
-- another way, some were re-done by Lovable in its own consolidated
-- migrations with small differences, and a few policies were created on
-- production outside any migration. Replaying the folder top to bottom
-- therefore produces a slightly different database from the one the app was
-- built and tested against. This file closes that gap.
--
-- How it was derived: replay every migration on a clean Postgres, fingerprint
-- the result (tables, columns, defaults, constraints, indexes, RLS policies,
-- functions, triggers, grants, buckets) with the same query run against
-- production, and diff. Every statement below corresponds to one line of
-- that diff. After this file the only remaining differences are Supabase's
-- own internal storage triggers, plus the one deliberate exception noted at
-- the bottom.
--
-- Everything is guarded (IF EXISTS / IF NOT EXISTS / ON CONFLICT), so it is
-- safe on a database that already matches.

-- ===== Innovation Lab: production created these tables without the CHECK
-- constraints and auth.users foreign key that 20260615000000 adds, and with
-- column defaults that file lacks. The FK matters beyond parity: imported
-- ideas reference user ids from the old project's auth.users.
ALTER TABLE public.ideas DROP CONSTRAINT IF EXISTS ideas_status_check;
ALTER TABLE public.ideas DROP CONSTRAINT IF EXISTS ideas_submitted_by_fkey;
ALTER TABLE public.ideas ALTER COLUMN status SET DEFAULT 'concept';
ALTER TABLE public.ideas ALTER COLUMN tags SET DEFAULT '[]'::jsonb;

ALTER TABLE public.partners ALTER COLUMN type SET DEFAULT 'corporate';

ALTER TABLE public.prototypes DROP CONSTRAINT IF EXISTS prototypes_status_check;
ALTER TABLE public.prototypes ALTER COLUMN status SET DEFAULT 'build';
ALTER TABLE public.prototypes ALTER COLUMN screenshots SET DEFAULT '[]'::jsonb;
ALTER TABLE public.prototypes DROP CONSTRAINT IF EXISTS prototypes_idea_id_fkey;
ALTER TABLE public.prototypes ADD CONSTRAINT prototypes_idea_id_fkey
  FOREIGN KEY (idea_id) REFERENCES public.ideas(id) ON DELETE CASCADE;

-- ===== Maintenance requests: production has Lovable's version of this table
-- (20260808192155), not the stricter one from 20260730010000, which created
-- it first on a fresh replay and so won the CREATE TABLE IF NOT EXISTS race.
ALTER TABLE public.maintenance_requests ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_category_check;
ALTER TABLE public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_priority_check;
ALTER TABLE public.maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_status_check;
DROP INDEX IF EXISTS public.maintenance_requests_status_idx;
DROP INDEX IF EXISTS public.maintenance_requests_tenant_idx;
DROP POLICY IF EXISTS "realestate members manage maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "tenants raise own maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "tenants read own maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "tenants read own record" ON public.tenants;

-- ===== User preferences: production has a different policy pair and no
-- updated_at trigger (20260625174100's versions never reached it).
DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS users_read_own_prefs ON public.user_preferences;
CREATE POLICY users_read_own_prefs ON public.user_preferences
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS users_update_own_prefs ON public.user_preferences;
CREATE POLICY users_update_own_prefs ON public.user_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ===== Policies production has that no migration file ever created.
DROP POLICY IF EXISTS authed_read_divisions ON public.divisions;
CREATE POLICY authed_read_divisions ON public.divisions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS users_insert_audit ON public.portal_audit_log;
CREATE POLICY users_insert_audit ON public.portal_audit_log
  FOR INSERT WITH CHECK ((user_id = auth.uid()) OR (user_id IS NULL));

-- ===== Storage. Production governs every app bucket with the four
-- "private buckets: …" policies from 20260808192402/20260809043338 and has
-- none of the per-bucket policies the July migrations add. Dropping those
-- also removes the broad public SELECT policies, which let anyone LIST a
-- bucket's contents (public URLs keep working without them).
DROP POLICY IF EXISTS "agritech members delete field images" ON storage.objects;
DROP POLICY IF EXISTS "agritech members upload field images" ON storage.objects;
DROP POLICY IF EXISTS "anyone reads field images" ON storage.objects;
DROP POLICY IF EXISTS "anyone reads pod photos" ON storage.objects;
DROP POLICY IF EXISTS "delete own library document files" ON storage.objects;
DROP POLICY IF EXISTS "logistics members delete pod photos" ON storage.objects;
DROP POLICY IF EXISTS "logistics members upload pod photos" ON storage.objects;
DROP POLICY IF EXISTS "public read property images" ON storage.objects;
DROP POLICY IF EXISTS "read visible library document files" ON storage.objects;
DROP POLICY IF EXISTS "real estate members delete lease documents" ON storage.objects;
DROP POLICY IF EXISTS "real estate members read lease documents" ON storage.objects;
DROP POLICY IF EXISTS "real estate members upload lease documents" ON storage.objects;
DROP POLICY IF EXISTS "realestate members delete property images" ON storage.objects;
DROP POLICY IF EXISTS "realestate members upload property images" ON storage.objects;
DROP POLICY IF EXISTS "tech members delete project files" ON storage.objects;
DROP POLICY IF EXISTS "tech members read project files" ON storage.objects;
DROP POLICY IF EXISTS "tech members upload project files" ON storage.objects;
DROP POLICY IF EXISTS "upload own library document files" ON storage.objects;

-- prototype-images exists on production; on a replay its only creator was the
-- (now no-op) 20260709190000. Private, as on production.
INSERT INTO storage.buckets (id, name, public)
VALUES ('prototype-images', 'prototype-images', false)
ON CONFLICT (id) DO NOTHING;

-- Deliberate exception: property-images, pod-photos and field-images stay
-- PUBLIC here, although production has them private. The app shows files from
-- these three buckets with getPublicUrl() — listing photos, the field gallery,
-- and proof-of-delivery photos on the public /track page — and a public URL
-- for a private bucket returns an error, so on production any photo uploaded
-- through the portal never displays. Uploads, updates and deletes are still
-- limited to the owner or staff by the "private buckets: …" policies.
