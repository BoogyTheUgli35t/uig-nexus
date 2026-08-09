CREATE TABLE IF NOT EXISTS public.idea_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idea_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.idea_votes TO authenticated;
GRANT ALL ON public.idea_votes TO service_role;

ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "idea_votes_select" ON public.idea_votes;
CREATE POLICY "idea_votes_select" ON public.idea_votes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'staff'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_divisions ud WHERE ud.user_id = auth.uid() AND ud.division_slug = 'innovation-lab')
  );

DROP POLICY IF EXISTS "idea_votes_insert_own" ON public.idea_votes;
CREATE POLICY "idea_votes_insert_own" ON public.idea_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'staff'::app_role)
      OR EXISTS (SELECT 1 FROM public.user_divisions ud WHERE ud.user_id = auth.uid() AND ud.division_slug = 'innovation-lab')
    )
  );

DROP POLICY IF EXISTS "idea_votes_delete_own" ON public.idea_votes;
CREATE POLICY "idea_votes_delete_own" ON public.idea_votes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idea_votes_idea_id_idx ON public.idea_votes (idea_id);