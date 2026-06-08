-- ===== Properties =====
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  title text NOT NULL,
  property_type text NOT NULL DEFAULT 'residential' CHECK (property_type IN ('residential','commercial','land','mixed_use')),
  city text,
  address text,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  bedrooms integer NOT NULL DEFAULT 0 CHECK (bedrooms >= 0),
  bathrooms integer NOT NULL DEFAULT 0 CHECK (bathrooms >= 0),
  area_sqm numeric NOT NULL DEFAULT 0 CHECK (area_sqm >= 0),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','sold','rented','off_market')),
  description text,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Tenants =====
CREATE TABLE public.tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  rent_amount numeric NOT NULL DEFAULT 0 CHECK (rent_amount >= 0),
  lease_start date,
  lease_end date,
  payment_status text NOT NULL DEFAULT 'current' CHECK (payment_status IN ('current','due','overdue')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Investors =====
CREATE TABLE public.investors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  phone text,
  amount_invested numeric NOT NULL DEFAULT 0 CHECK (amount_invested >= 0),
  portfolio_value numeric NOT NULL DEFAULT 0 CHECK (portfolio_value >= 0),
  expected_roi numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Leads (CRM) =====
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  stage text NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','viewing','negotiation','closed','lost')),
  notes text,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Grants =====
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investors TO authenticated;
GRANT ALL ON public.investors TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

-- ===== RLS =====
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "realestate members read properties" ON public.properties
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "realestate members manage properties" ON public.properties
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "realestate members read tenants" ON public.tenants
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "realestate members manage tenants" ON public.tenants
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "realestate members read investors" ON public.investors
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "realestate members manage investors" ON public.investors
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

CREATE POLICY "realestate members read leads" ON public.leads
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "realestate members manage leads" ON public.leads
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'real-estate')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

-- updated_at triggers
CREATE TRIGGER set_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_investors_updated_at
  BEFORE UPDATE ON public.investors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Seed sample data =====
INSERT INTO public.properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description) VALUES
  ('Lekki Phase 1 Smart Villa', 'residential', 'Lagos', '14 Admiralty Way, Lekki Phase 1', 285000000, 5, 6, 520, 'available', 'Automated 5-bedroom smart villa with solar backup, smart locks and a private cinema.'),
  ('Ikoyi Waterfront Penthouse', 'residential', 'Lagos', 'Banana Island Road, Ikoyi', 650000000, 4, 5, 410, 'reserved', 'Top-floor penthouse with panoramic lagoon views and full home automation.'),
  ('Maitama Executive Duplex', 'residential', 'Abuja', '7 Gana Street, Maitama', 420000000, 4, 5, 480, 'available', 'Diplomatic-zone duplex with energy management and integrated security.'),
  ('Victoria Island Grade-A Offices', 'commercial', 'Lagos', 'Adeola Odeku Street, VI', 1200000000, 0, 12, 2400, 'available', 'Six floors of premium office space, fibre-ready with smart building controls.'),
  ('GRA Port Harcourt Office Block', 'commercial', 'Port Harcourt', 'Aba Road, GRA Phase 2', 540000000, 0, 8, 1600, 'rented', 'Fully let commercial block with anchor multinational tenants.'),
  ('Ibeju-Lekki Investment Land', 'land', 'Lagos', 'Eleko Junction, Ibeju-Lekki', 95000000, 0, 0, 4000, 'available', 'Title-verified land near the Dangote refinery corridor, primed for appreciation.'),
  ('Gwarinpa Family Terrace', 'residential', 'Abuja', '3rd Avenue, Gwarinpa', 180000000, 4, 4, 360, 'rented', 'Modern terrace in a gated estate with 24/7 power and security.'),
  ('Enugu Mixed-Use Plaza', 'mixed_use', 'Enugu', 'Ogui Road, Enugu', 310000000, 6, 8, 1800, 'available', 'Ground-floor retail with serviced apartments above — strong rental yield.');

-- Tenants linked to rented/occupied properties
INSERT INTO public.tenants (property_id, full_name, email, phone, rent_amount, lease_start, lease_end, payment_status)
SELECT p.id, t.full_name, t.email, t.phone, t.rent_amount, t.lease_start, t.lease_end, t.payment_status
FROM (VALUES
  ('GRA Port Harcourt Office Block', 'Helios Energy Ltd', 'facilities@helios.example', '+234 803 555 1010', 36000000, DATE '2024-03-01', DATE '2026-02-28', 'current'),
  ('Gwarinpa Family Terrace', 'Bashir Adamu', 'bashir.adamu@example.com', '+234 805 222 3344', 9500000, DATE '2024-09-01', DATE '2025-08-31', 'due'),
  ('Enugu Mixed-Use Plaza', 'Crystal Retail Stores', 'lease@crystalretail.example', '+234 802 778 9911', 14400000, DATE '2025-01-01', DATE '2026-12-31', 'current'),
  ('Ikoyi Waterfront Penthouse', 'Adaeze Nwosu', 'adaeze.nwosu@example.com', '+234 809 441 7788', 48000000, DATE '2024-06-01', DATE '2025-05-31', 'overdue')
) AS t(prop_title, full_name, email, phone, rent_amount, lease_start, lease_end, payment_status)
JOIN public.properties p ON p.title = t.prop_title;

INSERT INTO public.investors (full_name, email, phone, amount_invested, portfolio_value, expected_roi) VALUES
  ('Olumide Bankole', 'olumide.bankole@example.com', '+234 803 100 2003', 500000000, 615000000, 14.5),
  ('Diaspora Capital Partners', 'invest@diasporacapital.example', '+1 713 555 0190', 1200000000, 1452000000, 12.8),
  ('Aisha Mohammed', 'aisha.m@example.com', '+234 806 332 4455', 250000000, 287500000, 11.0),
  ('Greenfield HNI Fund', 'fund@greenfield.example', '+234 701 909 1212', 800000000, 1004000000, 16.2);

-- CRM leads
INSERT INTO public.leads (property_id, full_name, email, phone, stage, notes)
SELECT p.id, l.full_name, l.email, l.phone, l.stage, l.notes
FROM (VALUES
  ('Lekki Phase 1 Smart Villa', 'Chukwuma Obi', 'chukwuma.obi@example.com', '+234 805 667 8899', 'viewing', 'Scheduled a second viewing this weekend. Interested in payment plan.'),
  ('Maitama Executive Duplex', 'Fatima Yusuf', 'fatima.yusuf@example.com', '+234 803 221 9090', 'negotiation', 'Offered 5% below asking. Awaiting owner response.'),
  ('Victoria Island Grade-A Offices', 'Northbridge Tech', 'leasing@northbridge.example', '+234 802 554 1100', 'contacted', 'Needs two floors. Sent floor plans and pricing.'),
  ('Ibeju-Lekki Investment Land', 'Emeka Okafor', 'emeka.okafor@example.com', '+234 809 776 5544', 'new', 'Diaspora buyer enquiring about title documentation.'),
  ('Ikoyi Waterfront Penthouse', 'Zainab Bello', 'zainab.bello@example.com', '+234 806 998 2211', 'closed', 'Reservation deposit received.')
) AS l(prop_title, full_name, email, phone, stage, notes)
JOIN public.properties p ON p.title = l.prop_title;