-- ===== Logistics =====
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'standard' CHECK (priority IN ('standard','express','fragile'));
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pod_photo_url text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pod_signature_name text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pod_notes text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pickup_lat numeric;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pickup_lng numeric;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS dropoff_lat numeric;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS dropoff_lng numeric;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS license_expiry date;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS current_lat numeric;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS current_lng numeric;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS next_service_due date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS insurance_expiry date;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS waypoints jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS assigned_driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.shipment_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.route_stops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE SET NULL,
  sequence integer NOT NULL DEFAULT 0,
  address text NOT NULL,
  lat numeric,
  lng numeric,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  notes text,
  cost numeric CHECK (cost IS NULL OR cost >= 0),
  performed_at date NOT NULL DEFAULT CURRENT_DATE,
  next_due date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipment_events TO authenticated;
GRANT ALL ON public.shipment_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_stops TO authenticated;
GRANT ALL ON public.route_stops TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_maintenance_logs TO authenticated;
GRANT ALL ON public.vehicle_maintenance_logs TO service_role;

ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logistics members read shipment events" ON public.shipment_events;
CREATE POLICY "logistics members read shipment events" ON public.shipment_events
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role) OR EXISTS (SELECT 1 FROM public.shipments s JOIN public.drivers d ON d.id = s.driver_id WHERE s.id = shipment_events.shipment_id AND d.user_id = auth.uid()));
DROP POLICY IF EXISTS "logistics members manage shipment events" ON public.shipment_events;
CREATE POLICY "logistics members manage shipment events" ON public.shipment_events
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role) OR EXISTS (SELECT 1 FROM public.shipments s JOIN public.drivers d ON d.id = s.driver_id WHERE s.id = shipment_events.shipment_id AND d.user_id = auth.uid()))
  WITH CHECK (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role) OR EXISTS (SELECT 1 FROM public.shipments s JOIN public.drivers d ON d.id = s.driver_id WHERE s.id = shipment_events.shipment_id AND d.user_id = auth.uid()));

DROP POLICY IF EXISTS "logistics members read route stops" ON public.route_stops;
CREATE POLICY "logistics members read route stops" ON public.route_stops
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "logistics members manage route stops" ON public.route_stops;
CREATE POLICY "logistics members manage route stops" ON public.route_stops
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

DROP POLICY IF EXISTS "logistics members read maintenance logs" ON public.vehicle_maintenance_logs;
CREATE POLICY "logistics members read maintenance logs" ON public.vehicle_maintenance_logs
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "logistics members manage maintenance logs" ON public.vehicle_maintenance_logs;
CREATE POLICY "logistics members manage maintenance logs" ON public.vehicle_maintenance_logs
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

DROP POLICY IF EXISTS "drivers read own profile" ON public.drivers;
CREATE POLICY "drivers read own profile" ON public.drivers
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "drivers read own shipments" ON public.shipments;
CREATE POLICY "drivers read own shipments" ON public.shipments
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = shipments.driver_id AND d.user_id = auth.uid()));
DROP POLICY IF EXISTS "drivers update own shipments" ON public.shipments;
CREATE POLICY "drivers update own shipments" ON public.shipments
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = shipments.driver_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = shipments.driver_id AND d.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.track_shipment(p_tracking_code text)
RETURNS TABLE (reference text, status text, pickup_city text, dropoff_city text, eta date, delivered_at timestamptz, priority text, pod_photo_url text)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT s.reference, s.status, s.pickup_city, s.dropoff_city, s.eta, s.delivered_at, s.priority, s.pod_photo_url
  FROM public.shipments s WHERE s.tracking_code = p_tracking_code LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.track_shipment_events(p_tracking_code text)
RETURNS TABLE (status text, note text, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT e.status, e.note, e.created_at FROM public.shipment_events e
  JOIN public.shipments s ON s.id = e.shipment_id WHERE s.tracking_code = p_tracking_code ORDER BY e.created_at ASC;
$$;
GRANT EXECUTE ON FUNCTION public.track_shipment(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_shipment_events(text) TO anon, authenticated;

-- ===== AgriTech =====
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS lat numeric;
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS lng numeric;
CREATE TABLE IF NOT EXISTS public.field_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('drone', 'manual')),
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.agri_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id uuid NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  message text NOT NULL,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_images TO authenticated;
GRANT ALL ON public.field_images TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agri_alerts TO authenticated;
GRANT ALL ON public.agri_alerts TO service_role;
ALTER TABLE public.field_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agri_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agritech members read field images" ON public.field_images;
CREATE POLICY "agritech members read field images" ON public.field_images
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'agritech') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role) OR private.has_role(auth.uid(), 'farmer'::app_role));
DROP POLICY IF EXISTS "agritech members manage field images" ON public.field_images;
CREATE POLICY "agritech members manage field images" ON public.field_images
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'agritech') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'agritech') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "agritech members read alerts" ON public.agri_alerts;
CREATE POLICY "agritech members read alerts" ON public.agri_alerts
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'agritech') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role) OR private.has_role(auth.uid(), 'farmer'::app_role));
DROP POLICY IF EXISTS "agritech members manage alerts" ON public.agri_alerts;
CREATE POLICY "agritech members manage alerts" ON public.agri_alerts
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'agritech') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'agritech') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

-- ===== Intelligence =====
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.ai_chat_messages TO authenticated;
GRANT ALL ON public.ai_chat_messages TO service_role;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users read own chat messages" ON public.ai_chat_messages;
CREATE POLICY "users read own chat messages" ON public.ai_chat_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "users insert own chat messages" ON public.ai_chat_messages;
CREATE POLICY "users insert own chat messages" ON public.ai_chat_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "users delete own chat messages" ON public.ai_chat_messages;
CREATE POLICY "users delete own chat messages" ON public.ai_chat_messages FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS ai_chat_messages_user_created_idx ON public.ai_chat_messages (user_id, created_at);

-- ===== Innovation Lab =====
CREATE TABLE IF NOT EXISTS public.mvp_checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  task text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.demo_days (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  event_date date NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.demo_day_slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demo_day_id uuid NOT NULL REFERENCES public.demo_days(id) ON DELETE CASCADE,
  prototype_id uuid NOT NULL REFERENCES public.prototypes(id) ON DELETE CASCADE,
  slot_time text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (demo_day_id, prototype_id)
);
CREATE TABLE IF NOT EXISTS public.experiments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id uuid REFERENCES public.ideas(id) ON DELETE SET NULL,
  prototype_id uuid REFERENCES public.prototypes(id) ON DELETE SET NULL,
  model_id uuid REFERENCES public.models(id) ON DELETE SET NULL,
  hypothesis text NOT NULL,
  result text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'running', 'concluded')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mvp_checklist_items TO authenticated;
GRANT ALL ON public.mvp_checklist_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_days TO authenticated;
GRANT ALL ON public.demo_days TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_day_slots TO authenticated;
GRANT ALL ON public.demo_day_slots TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experiments TO authenticated;
GRANT ALL ON public.experiments TO service_role;
ALTER TABLE public.mvp_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_day_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "innovation members read checklist" ON public.mvp_checklist_items;
CREATE POLICY "innovation members read checklist" ON public.mvp_checklist_items
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "innovation members manage checklist" ON public.mvp_checklist_items;
CREATE POLICY "innovation members manage checklist" ON public.mvp_checklist_items
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "innovation members read demo days" ON public.demo_days;
CREATE POLICY "innovation members read demo days" ON public.demo_days
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "innovation members manage demo days" ON public.demo_days;
CREATE POLICY "innovation members manage demo days" ON public.demo_days
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "innovation members read demo slots" ON public.demo_day_slots;
CREATE POLICY "innovation members read demo slots" ON public.demo_day_slots
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "innovation members manage demo slots" ON public.demo_day_slots;
CREATE POLICY "innovation members manage demo slots" ON public.demo_day_slots
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "innovation members read experiments" ON public.experiments;
CREATE POLICY "innovation members read experiments" ON public.experiments
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "innovation members manage experiments" ON public.experiments;
CREATE POLICY "innovation members manage experiments" ON public.experiments
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'innovation-lab') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

-- ===== Notifications insert fix =====
DROP POLICY IF EXISTS "staff admins insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "authenticated users insert notifications" ON public.notifications;
CREATE POLICY "authenticated users insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);