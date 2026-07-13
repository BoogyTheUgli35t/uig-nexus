-- Backfill migration: the Innovation Lab tables (ideas, prototypes, partners) were created
-- directly in the live database (via the Lovable Cloud schema UI) and never had a matching
-- migration file, even though supabase/migrations/20260706005252_*.sql already assumes they
-- exist (it drops a blanket "auth_ideas"/"auth_prototypes"/"auth_partners" policy on them).
-- This migration reconstructs that starting state so a fresh environment built from
-- `supabase/migrations/` alone ends up with the same schema as production.
--
-- Column shapes are copied 1:1 from the generated src/integrations/supabase/types.ts
-- (the actual live schema), not guessed from app code — notably these tables have no
-- `updated_at` column and most columns are nullable (no NOT NULL constraints) in production.

-- ===== Ideas =====
CREATE TABLE public.ideas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  tags jsonb,
  status text CHECK (status IS NULL OR status IN ('concept','prototype','pilot','production')),
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ===== Prototypes =====
CREATE TABLE public.prototypes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id uuid REFERENCES public.ideas(id) ON DELETE SET NULL,
  repo_link text,
  demo_link text,
  status text CHECK (status IS NULL OR status IN ('concept','design','build','pilot','ready')),
  screenshots jsonb,
  created_at timestamptz DEFAULT now()
);

-- ===== Partners =====
CREATE TABLE public.partners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text,
  contact text,
  created_at timestamptz DEFAULT now()
);

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideas TO authenticated;
GRANT ALL ON public.ideas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prototypes TO authenticated;
GRANT ALL ON public.prototypes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;

-- ===== RLS =====
-- Enabled with the same temporary blanket "authenticated can do anything" policy that
-- every other division table started with (see 20260706005252, which tightens these to
-- proper innovation-lab-scoped policies immediately after this migration runs).
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prototypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_ideas" ON public.ideas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_prototypes" ON public.prototypes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_partners" ON public.partners FOR ALL TO authenticated USING (true) WITH CHECK (true);
