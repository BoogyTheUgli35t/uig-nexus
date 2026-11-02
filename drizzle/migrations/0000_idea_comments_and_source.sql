ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS source_submission_id uuid REFERENCES public.innovation_submissions(id) ON DELETE SET NULL;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.idea_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idea_comments_idea_idx ON public.idea_comments(idea_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.idea_comments TO authenticated;
GRANT ALL ON public.idea_comments TO service_role;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lab members read idea comments" ON public.idea_comments FOR SELECT TO authenticated
USING (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "lab members post idea comments" ON public.idea_comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role)));
CREATE POLICY "authors or admins delete idea comments" ON public.idea_comments FOR DELETE TO authenticated
USING (author_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));