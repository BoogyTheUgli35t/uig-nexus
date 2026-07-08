CREATE TABLE public.experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  hypothesis text,
  source_division text NOT NULL DEFAULT 'innovation-lab',
  idea_id uuid REFERENCES public.ideas(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'running',
  result text,
  confidence numeric NOT NULL DEFAULT 0,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiments TO authenticated;
GRANT ALL ON public.experiments TO service_role;

ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "innovation members read experiments" ON public.experiments
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
    OR owner_id = auth.uid()
  );

CREATE POLICY "innovation members manage experiments" ON public.experiments
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
    OR owner_id = auth.uid()
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
    OR owner_id = auth.uid()
  );

CREATE TRIGGER experiments_set_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();