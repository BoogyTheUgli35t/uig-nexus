-- ===== Vehicles =====
CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plate text NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'van' CHECK (vehicle_type IN ('bike','van','truck','trailer','refrigerated')),
  capacity_kg numeric NOT NULL DEFAULT 0 CHECK (capacity_kg >= 0),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','in_transit','maintenance','idle')),
  fuel_level integer NOT NULL DEFAULT 100 CHECK (fuel_level >= 0 AND fuel_level <= 100),
  odometer_km numeric NOT NULL DEFAULT 0 CHECK (odometer_km >= 0),
  last_service date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Drivers =====
CREATE TABLE public.drivers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  license_no text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','on_route','off_duty')),
  deliveries_completed integer NOT NULL DEFAULT 0 CHECK (deliveries_completed >= 0),
  rating numeric NOT NULL DEFAULT 5 CHECK (rating >= 0 AND rating <= 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Routes =====
CREATE TABLE public.routes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  distance_km numeric NOT NULL DEFAULT 0 CHECK (distance_km >= 0),
  est_hours numeric NOT NULL DEFAULT 0 CHECK (est_hours >= 0),
  stops integer NOT NULL DEFAULT 0 CHECK (stops >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','planned','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Shipments =====
CREATE TABLE public.shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference text NOT NULL,
  customer text NOT NULL,
  pickup_city text,
  dropoff_city text,
  cargo text,
  weight_kg numeric NOT NULL DEFAULT 0 CHECK (weight_kg >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','picked_up','in_transit','out_for_delivery','delivered','failed')),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  route_id uuid REFERENCES public.routes(id) ON DELETE SET NULL,
  eta date,
  tracking_code text,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routes TO authenticated;
GRANT ALL ON public.routes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;

-- ===== RLS =====
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logistics members read vehicles" ON public.vehicles
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "logistics members manage vehicles" ON public.vehicles
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "logistics members read drivers" ON public.drivers
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "logistics members manage drivers" ON public.drivers
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "logistics members read routes" ON public.routes
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "logistics members manage routes" ON public.routes
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "logistics members read shipments" ON public.shipments
  FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "logistics members manage shipments" ON public.shipments
  FOR ALL TO authenticated
  USING (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_division_access(auth.uid(), 'logistics') OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

-- updated_at triggers
CREATE TRIGGER set_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Seed: vehicles =====
INSERT INTO public.vehicles (plate, vehicle_type, capacity_kg, status, fuel_level, odometer_km, last_service) VALUES
  ('LAG-241-KJA', 'truck', 8000, 'in_transit', 62, 184250, DATE '2026-04-12'),
  ('ABJ-518-MNA', 'van', 1500, 'available', 88, 92430, DATE '2026-05-02'),
  ('LAG-907-EPE', 'refrigerated', 3000, 'in_transit', 45, 121870, DATE '2026-03-28'),
  ('RIV-336-PHC', 'trailer', 22000, 'maintenance', 20, 305610, DATE '2026-02-15'),
  ('KAN-104-FAG', 'bike', 80, 'available', 95, 41200, DATE '2026-05-20'),
  ('LAG-672-IKJ', 'van', 1500, 'idle', 73, 67340, DATE '2026-04-30');

-- ===== Seed: routes =====
INSERT INTO public.routes (name, origin, destination, distance_km, est_hours, stops, status) VALUES
  ('Lagos – Ibadan Express', 'Lagos', 'Ibadan', 130, 2.5, 3, 'active'),
  ('Lagos – Abuja Corridor', 'Lagos', 'Abuja', 760, 11, 5, 'active'),
  ('PH – Aba Distribution', 'Port Harcourt', 'Aba', 64, 1.5, 4, 'active'),
  ('Abuja – Kano Northline', 'Abuja', 'Kano', 440, 6, 4, 'planned'),
  ('Lagos Metro Last-Mile', 'Lagos', 'Lagos', 45, 4, 12, 'active');

-- ===== Seed: drivers (assigned to vehicles) =====
INSERT INTO public.drivers (vehicle_id, full_name, phone, license_no, status, deliveries_completed, rating)
SELECT v.id, d.full_name, d.phone, d.license_no, d.status, d.deliveries_completed, d.rating
FROM (VALUES
  ('LAG-241-KJA', 'Tunde Bakare', '+234 803 111 2233', 'LAG-DRV-44821', 'on_route', 1284, 4.8),
  ('ABJ-518-MNA', 'Ngozi Eze', '+234 805 332 9090', 'ABJ-DRV-10233', 'available', 932, 4.9),
  ('LAG-907-EPE', 'Suleiman Garba', '+234 802 778 1212', 'LAG-DRV-77654', 'on_route', 1567, 4.7),
  ('KAN-104-FAG', 'Ibrahim Musa', '+234 806 554 3322', 'KAN-DRV-30198', 'available', 2104, 4.6),
  ('LAG-672-IKJ', 'Blessing Okon', '+234 809 221 4455', 'LAG-DRV-55012', 'off_duty', 845, 4.9)
) AS d(plate, full_name, phone, license_no, status, deliveries_completed, rating)
JOIN public.vehicles v ON v.plate = d.plate;

-- ===== Seed: shipments =====
INSERT INTO public.shipments (reference, customer, pickup_city, dropoff_city, cargo, weight_kg, status, driver_id, route_id, eta, tracking_code)
SELECT s.reference, s.customer, s.pickup_city, s.dropoff_city, s.cargo, s.weight_kg, s.status,
       (SELECT id FROM public.drivers WHERE full_name = s.driver_name),
       (SELECT id FROM public.routes WHERE name = s.route_name),
       s.eta, s.tracking_code
FROM (VALUES
  ('UIG-SHP-10241', 'Jumia Nigeria', 'Lagos', 'Ibadan', 'Consumer electronics (24 cartons)', 640, 'in_transit', 'Tunde Bakare', 'Lagos – Ibadan Express', DATE '2026-06-10', 'TRK-7H2K9A'),
  ('UIG-SHP-10242', 'HealthPlus Pharmacy', 'Lagos', 'Lagos', 'Cold-chain pharmaceuticals', 320, 'out_for_delivery', 'Suleiman Garba', 'Lagos Metro Last-Mile', DATE '2026-06-09', 'TRK-3PL8QZ'),
  ('UIG-SHP-10243', 'Dangote Cement', 'Abuja', 'Kano', 'Building materials (palletised)', 18500, 'pending', NULL, 'Abuja – Kano Northline', DATE '2026-06-13', 'TRK-9MD4XX'),
  ('UIG-SHP-10244', 'Shoprite Holdings', 'Lagos', 'Abuja', 'FMCG retail stock', 5400, 'in_transit', 'Ngozi Eze', 'Lagos – Abuja Corridor', DATE '2026-06-11', 'TRK-5RT0WK'),
  ('UIG-SHP-10245', 'Konga Online', 'Port Harcourt', 'Aba', 'Mixed parcels (88 items)', 410, 'picked_up', 'Ibrahim Musa', 'PH – Aba Distribution', DATE '2026-06-10', 'TRK-1QB6VN'),
  ('UIG-SHP-10246', 'MTN Nigeria', 'Lagos', 'Ibadan', 'Network equipment', 1250, 'delivered', 'Tunde Bakare', 'Lagos – Ibadan Express', DATE '2026-06-07', 'TRK-8KP2LM'),
  ('UIG-SHP-10247', 'GIG Logistics Partner', 'Lagos', 'Lagos', 'E-commerce returns', 180, 'failed', 'Blessing Okon', 'Lagos Metro Last-Mile', DATE '2026-06-08', 'TRK-2WF7DC')
) AS s(reference, customer, pickup_city, dropoff_city, cargo, weight_kg, status, driver_name, route_name, eta, tracking_code);