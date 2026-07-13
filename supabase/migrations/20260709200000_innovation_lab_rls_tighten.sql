-- Security tightening: the innovation lab expansion migration
-- (20260709190000_innovation_lab_expansion.sql) gave every authenticated portal
-- user — including clients, farmers and drivers with no relationship to the
-- Innovation Lab — full read/write/delete on mvp_checklist_items, demo_days,
-- demo_day_slots and experiments (the last of which links to real UIG
-- Intelligence model rows). Replace those blanket policies with the same
-- has_division_access() pattern used by every other division's tables.
--
-- Note: the *original* ideas/prototypes/partners tables (from
-- 20260615000000_create_innovation_lab_tables.sql) still use the older blanket
-- auth_ideas/auth_prototypes/auth_partners USING(true) policies. That was a
-- pre-existing precedent, not introduced by this deep-build, and is left as-is
-- here to avoid changing behavior that predates this work without being asked —
-- flagging it so it can be tightened in the same way if desired.

DROP POLICY IF EXISTS auth_mvp_checklist_items ON public.mvp_checklist_items;
DROP POLICY IF EXISTS auth_demo_days ON public.demo_days;
DROP POLICY IF EXISTS auth_demo_day_slots ON public.demo_day_slots;
DROP POLICY IF EXISTS auth_experiments ON public.experiments;

CREATE POLICY "innovation members read checklist" ON public.mvp_checklist_items
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "innovation members manage checklist" ON public.mvp_checklist_items
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "innovation members read demo days" ON public.demo_days
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "innovation members manage demo days" ON public.demo_days
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "innovation members read demo slots" ON public.demo_day_slots
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "innovation members manage demo slots" ON public.demo_day_slots
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "innovation members read experiments" ON public.experiments
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "innovation members manage experiments" ON public.experiments
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

-- The prototype-images storage bucket had the same gap: any authenticated user
-- (not just innovation-lab members) could upload/delete. Tighten to match.
DROP POLICY IF EXISTS "authenticated upload prototype images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated delete prototype images" ON storage.objects;

CREATE POLICY "innovation members upload prototype images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'prototype-images'
    AND (
      private.has_division_access(auth.uid(), 'innovation-lab')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );

CREATE POLICY "innovation members delete prototype images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'prototype-images'
    AND (
      private.has_division_access(auth.uid(), 'innovation-lab')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );
