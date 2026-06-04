-- ===== Farmers =====
CREATE TABLE public.farmers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  location text,
  cooperative text,
  primary_crop text,
  hectares numeric NOT NULL DEFAULT 0 CHECK (hectares >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','onboarding','inactive')),
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Fields =====
CREATE TABLE public.fields (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id uuid NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  name text NOT NULL,
  crop text,
  hectares numeric NOT NULL DEFAULT 0 CHECK (hectares >= 0),
  health integer NOT NULL DEFAULT 80 CHECK (health >= 0 AND health <= 100),
  status text NOT NULL DEFAULT 'healthy' CHECK (status IN ('healthy','at_risk','critical')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Sensor data =====
CREATE TABLE public.sensor_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  soil_moisture numeric,
  temperature numeric,
  humidity numeric,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Yield predictions =====
CREATE TABLE public.yield_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  season text NOT NULL,
  predicted_yield_tons numeric NOT NULL DEFAULT 0,
  confidence integer NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmers TO authenticated;
GRANT ALL ON public.farmers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fields TO authenticated;
GRANT ALL ON public.fields TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sensor_data TO authenticated;
GRANT ALL ON public.sensor_data TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.yield_predictions TO authenticated;
GRANT ALL ON public.yield_predictions TO service_role;

-- ===== RLS =====
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agritech members read farmers" ON public.farmers
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "agritech members manage farmers" ON public.farmers
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "agritech members read fields" ON public.fields
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "agritech members manage fields" ON public.fields
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "agritech members read sensor_data" ON public.sensor_data
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "agritech members manage sensor_data" ON public.sensor_data
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "agritech members read yield_predictions" ON public.yield_predictions
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "agritech members manage yield_predictions" ON public.yield_predictions
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'agritech')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

-- updated_at triggers
CREATE TRIGGER set_farmers_updated_at
  BEFORE UPDATE ON public.farmers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_fields_updated_at
  BEFORE UPDATE ON public.fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Seed sample data =====
WITH f AS (
  INSERT INTO public.farmers (full_name, phone, location, cooperative, primary_crop, hectares, status) VALUES
    ('Aliyu Bello', '+234 803 111 2233', 'Kano State', 'Kano Rice Growers', 'Rice', 12.5, 'active'),
    ('Ngozi Okeke', '+234 802 445 6677', 'Benue State', 'Benue Yam Cooperative', 'Yam', 8.0, 'active'),
    ('Musa Ibrahim', '+234 706 998 1122', 'Kaduna State', 'Kaduna Maize Union', 'Maize', 20.0, 'active'),
    ('Funke Adeyemi', '+234 805 332 7788', 'Oyo State', 'Oyo Cassava Hub', 'Cassava', 15.0, 'onboarding'),
    ('Chinedu Eze', '+234 809 221 4455', 'Enugu State', 'Enugu Vegetable Co-op', 'Tomato', 6.5, 'active')
  RETURNING id, primary_crop, hectares
),
fl AS (
  INSERT INTO public.fields (farmer_id, name, crop, hectares, health, status)
  SELECT id, primary_crop || ' Field A', primary_crop, round((hectares/2)::numeric, 1),
    (60 + floor(random()*40))::int,
    (ARRAY['healthy','healthy','at_risk','critical'])[1 + floor(random()*4)::int]
  FROM f
  RETURNING id, crop
)
INSERT INTO public.yield_predictions (field_id, season, predicted_yield_tons, confidence)
SELECT id, s.season, round((2 + random()*8)::numeric, 1), (70 + floor(random()*28))::int
FROM fl
CROSS JOIN (VALUES ('2024 Wet'), ('2025 Dry'), ('2025 Wet')) AS s(season);

-- Sensor readings for each field (last 6 readings)
INSERT INTO public.sensor_data (field_id, soil_moisture, temperature, humidity, recorded_at)
SELECT fl.id,
  round((30 + random()*40)::numeric, 1),
  round((24 + random()*10)::numeric, 1),
  round((45 + random()*40)::numeric, 1),
  now() - (g.n || ' hours')::interval
FROM public.fields fl
CROSS JOIN generate_series(0, 5) AS g(n);