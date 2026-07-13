-- Logistics deep-build: proof-of-delivery, driver mobile task view (linked to auth
-- users), fleet maintenance history, route stop sequencing (map placeholder), and a
-- public, unauthenticated shipment tracking lookup for customers.

-- ===== New columns on existing tables =====
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'standard' CHECK (priority IN ('standard','express','fragile'));
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pod_photo_url text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pod_signature_name text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pod_notes text;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pickup_lat numeric;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS pickup_lng numeric;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS dropoff_lat numeric;
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS dropoff_lng numeric;

-- Linking a driver row to an auth user is what makes a real "my tasks" mobile view
-- possible (rather than everyone with logistics access seeing every driver's queue).
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS license_expiry date;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS current_lat numeric;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS current_lng numeric;

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS next_service_due date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS insurance_expiry date;

ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS waypoints jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.routes ADD COLUMN IF NOT EXISTS assigned_driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;

-- ===== Shipment tracking timeline (drives both the internal detail view and the
-- public customer tracking portal) =====
CREATE TABLE public.shipment_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Route stops (ordered waypoints for route optimisation UI; map is a
-- placeholder — pin list ordered by sequence, no real geocoding/routing engine) =====
CREATE TABLE public.route_stops (
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

-- ===== Fleet maintenance history =====
CREATE TABLE public.vehicle_maintenance_logs (
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

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipment_events TO authenticated;
GRANT ALL ON public.shipment_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.route_stops TO authenticated;
GRANT ALL ON public.route_stops TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_maintenance_logs TO authenticated;
GRANT ALL ON public.vehicle_maintenance_logs TO service_role;

-- ===== RLS =====
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logistics members read shipment events" ON public.shipment_events
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'logistics')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.drivers d ON d.id = s.driver_id
      WHERE s.id = shipment_events.shipment_id AND d.user_id = auth.uid()
    )
  );
CREATE POLICY "logistics members manage shipment events" ON public.shipment_events
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'logistics')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.drivers d ON d.id = s.driver_id
      WHERE s.id = shipment_events.shipment_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'logistics')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.shipments s
      JOIN public.drivers d ON d.id = s.driver_id
      WHERE s.id = shipment_events.shipment_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "logistics members read route stops" ON public.route_stops
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'logistics')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "logistics members manage route stops" ON public.route_stops
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'logistics')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'logistics')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "logistics members read maintenance logs" ON public.vehicle_maintenance_logs
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'logistics')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "logistics members manage maintenance logs" ON public.vehicle_maintenance_logs
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'logistics')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'logistics')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

-- ===== Driver self-service: a driver (app_role = 'driver', drivers.user_id = auth.uid())
-- can see their own driver profile and update the shipments assigned to them (status +
-- proof-of-delivery fields), without needing full logistics division access. =====
CREATE POLICY "drivers read own profile" ON public.drivers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "drivers read own shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = shipments.driver_id AND d.user_id = auth.uid())
  );
CREATE POLICY "drivers update own shipments" ON public.shipments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = shipments.driver_id AND d.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = shipments.driver_id AND d.user_id = auth.uid())
  );

-- (shipment_events / route_stops / vehicle_maintenance_logs have no updated_at column,
-- so no update-trigger is needed.)

-- ===== Storage bucket for proof-of-delivery photos (public read, like property-images,
-- since a delivery photo isn't sensitive and customers on the tracking portal should be
-- able to see it) =====
INSERT INTO storage.buckets (id, name, public) VALUES ('pod-photos', 'pod-photos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anyone reads pod photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'pod-photos');

CREATE POLICY "logistics members upload pod photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pod-photos'
    AND (
      private.has_division_access(auth.uid(), 'logistics')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
      OR EXISTS (SELECT 1 FROM public.drivers d WHERE d.user_id = auth.uid())
    )
  );

CREATE POLICY "logistics members delete pod photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'pod-photos'
    AND (
      private.has_division_access(auth.uid(), 'logistics')
      OR private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'staff'::app_role)
    )
  );

-- ===== Public shipment tracking =====
-- A SECURITY DEFINER function is used instead of a public RLS policy on `shipments`
-- so anonymous customers can only ever read a hand-picked, non-sensitive column list
-- (no customer name, no internal notes) for a shipment they already hold the
-- tracking code for — never a scan/listing of shipments.
CREATE OR REPLACE FUNCTION public.track_shipment(p_tracking_code text)
RETURNS TABLE (
  reference text,
  status text,
  pickup_city text,
  dropoff_city text,
  eta date,
  delivered_at timestamptz,
  priority text,
  pod_photo_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT s.reference, s.status, s.pickup_city, s.dropoff_city, s.eta, s.delivered_at, s.priority, s.pod_photo_url
  FROM public.shipments s
  WHERE s.tracking_code = p_tracking_code
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.track_shipment_events(p_tracking_code text)
RETURNS TABLE (
  status text,
  note text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT e.status, e.note, e.created_at
  FROM public.shipment_events e
  JOIN public.shipments s ON s.id = e.shipment_id
  WHERE s.tracking_code = p_tracking_code
  ORDER BY e.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.track_shipment(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_shipment_events(text) TO anon, authenticated;
