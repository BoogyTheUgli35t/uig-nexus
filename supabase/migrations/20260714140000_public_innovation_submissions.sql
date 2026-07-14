-- Public idea-submission intake for UIG Innovation Lab. Deliberately a
-- separate table from `ideas` (the internal pipeline table) rather than
-- letting the public marketing site insert into it directly — `ideas` feeds
-- real prototype/demo-day workflows and was just hardened in
-- 20260709200000_innovation_lab_rls_tighten.sql; mixing unvetted public
-- submissions into it would undo that. Staff review submissions here and
-- manually promote the worthwhile ones into `ideas` via the portal.

CREATE TABLE IF NOT EXISTS public.innovation_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  idea_title text NOT NULL,
  idea_description text NOT NULL,
  category text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'accepted', 'declined')),
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS innovation_submissions_status_idx ON public.innovation_submissions (status);
CREATE INDEX IF NOT EXISTS innovation_submissions_created_idx ON public.innovation_submissions (created_at DESC);

ALTER TABLE public.innovation_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an idea (that's the point of a public intake form), but
-- can only insert — never read back other people's submissions.
GRANT INSERT ON public.innovation_submissions TO anon;
CREATE POLICY "public can submit ideas" ON public.innovation_submissions
  FOR INSERT TO anon
  WITH CHECK (true);

-- Innovation Lab staff (or admins/staff generally) review the queue — same
-- has_division_access() pattern as every other Innovation Lab table.
GRANT SELECT, UPDATE ON public.innovation_submissions TO authenticated;
CREATE POLICY "innovation members read submissions" ON public.innovation_submissions
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "innovation members review submissions" ON public.innovation_submissions
  FOR UPDATE TO authenticated
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
