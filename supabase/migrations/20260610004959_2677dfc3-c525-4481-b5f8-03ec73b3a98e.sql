-- ===== Datasets =====
CREATE TABLE public.datasets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  source_division text NOT NULL DEFAULT 'intelligence',
  description text,
  rows_count integer NOT NULL DEFAULT 0 CHECK (rows_count >= 0),
  size_mb numeric NOT NULL DEFAULT 0 CHECK (size_mb >= 0),
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('uploaded','processing','ready','error')),
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Models =====
CREATE TABLE public.models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  dataset_id uuid REFERENCES public.datasets(id) ON DELETE SET NULL,
  model_type text NOT NULL DEFAULT 'regression' CHECK (model_type IN ('regression','classification','forecast','nlp','vision','recommendation')),
  target_division text NOT NULL DEFAULT 'intelligence',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','training','trained','deployed','monitoring')),
  accuracy numeric NOT NULL DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 100),
  version text NOT NULL DEFAULT 'v0.1',
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Predictions =====
CREATE TABLE public.predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id uuid REFERENCES public.models(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  result text,
  confidence numeric NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.datasets TO authenticated;
GRANT ALL ON public.datasets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.models TO authenticated;
GRANT ALL ON public.models TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions TO authenticated;
GRANT ALL ON public.predictions TO service_role;

-- ===== RLS =====
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intelligence members read datasets" ON public.datasets
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'intelligence') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "intelligence members manage datasets" ON public.datasets
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'intelligence') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'intelligence') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "intelligence members read models" ON public.models
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'intelligence') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "intelligence members manage models" ON public.models
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'intelligence') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'intelligence') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "intelligence members read predictions" ON public.predictions
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'intelligence') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "intelligence members manage predictions" ON public.predictions
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'intelligence') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'intelligence') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

-- updated_at triggers
CREATE TRIGGER set_datasets_updated_at BEFORE UPDATE ON public.datasets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_models_updated_at BEFORE UPDATE ON public.models FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_predictions_updated_at BEFORE UPDATE ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Seed: datasets =====
INSERT INTO public.datasets (name, source_division, description, rows_count, size_mb, status) VALUES
  ('AgriTech Yield History 2021-2025', 'agritech', 'Seasonal yield, rainfall and soil readings across 6 Nigerian states.', 184320, 42.6, 'ready'),
  ('Real Estate Transactions — Lagos/Abuja', 'real-estate', 'Historical sale & rental prices with property attributes.', 96450, 28.1, 'ready'),
  ('Logistics Delivery Telemetry', 'logistics', 'Route timings, fuel use and on-time outcomes per shipment.', 311200, 67.9, 'ready'),
  ('Customer Support Conversations', 'technology', 'Anonymised support chats for NLP intent modelling.', 54100, 15.3, 'processing'),
  ('Drone Field Imagery (labelled)', 'agritech', 'Annotated crop-health images for vision models.', 22800, 512.4, 'uploaded');

-- ===== Seed: models =====
INSERT INTO public.models (name, dataset_id, model_type, target_division, status, accuracy, version)
SELECT m.name,
       (SELECT id FROM public.datasets WHERE name = m.dataset_name),
       m.model_type, m.target_division, m.status, m.accuracy, m.version
FROM (VALUES
  ('UIG YieldNet', 'AgriTech Yield History 2021-2025', 'forecast', 'agritech', 'deployed', 91.4, 'v2.3'),
  ('UIG PriceSense', 'Real Estate Transactions — Lagos/Abuja', 'regression', 'real-estate', 'monitoring', 88.7, 'v1.8'),
  ('UIG RouteOptimiser', 'Logistics Delivery Telemetry', 'recommendation', 'logistics', 'trained', 84.2, 'v1.1'),
  ('UIG SupportIntent', 'Customer Support Conversations', 'nlp', 'technology', 'training', 0, 'v0.4'),
  ('UIG CropVision', 'Drone Field Imagery (labelled)', 'vision', 'agritech', 'draft', 0, 'v0.1')
) AS m(name, dataset_name, model_type, target_division, status, accuracy, version);

-- ===== Seed: predictions =====
INSERT INTO public.predictions (model_id, prompt, result, confidence)
SELECT (SELECT id FROM public.models WHERE name = p.model_name), p.prompt, p.result, p.confidence
FROM (VALUES
  ('UIG YieldNet', 'Forecast maize yield for Kaduna Field A, rainy season 2026', 'Projected 4.8 t/ha (+12% vs 2025) — favourable rainfall, recommend nitrogen top-up wk 6.', 91.0),
  ('UIG PriceSense', 'Estimate sale price: 4-bed detached, Lekki Phase 1, 420 sqm', 'Estimated ₦285,000,000 (range ₦268M–₦302M). Demand index: high.', 89.0),
  ('UIG RouteOptimiser', 'Optimise Lagos → Abuja with 5 drops, depart 06:00', 'Suggested corridor saves 1h 40m; reorder stops 3↔4, avoid Lokoja 14:00 peak.', 83.0)
) AS p(model_name, prompt, result, confidence);