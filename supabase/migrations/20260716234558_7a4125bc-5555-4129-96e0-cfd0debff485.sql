
ALTER TABLE public.experiments
  ADD COLUMN IF NOT EXISTS prototype_id uuid REFERENCES public.prototypes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS model_id uuid REFERENCES public.models(id) ON DELETE SET NULL;
