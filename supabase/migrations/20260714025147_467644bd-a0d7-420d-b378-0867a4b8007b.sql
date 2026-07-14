-- ===== Documents center =====
CREATE TABLE IF NOT EXISTS public.document_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  division text,
  title text NOT NULL,
  description text,
  file_path text NOT NULL UNIQUE,
  file_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS document_library_division_idx ON public.document_library (division);
CREATE INDEX IF NOT EXISTS document_library_owner_idx ON public.document_library (owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_library TO authenticated;
GRANT ALL ON public.document_library TO service_role;
ALTER TABLE public.document_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read visible library documents" ON public.document_library;
CREATE POLICY "read visible library documents" ON public.document_library
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR division IS NULL OR private.has_division_access(auth.uid(), division) OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "upload library documents" ON public.document_library;
CREATE POLICY "upload library documents" ON public.document_library
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND (division IS NULL OR private.has_division_access(auth.uid(), division) OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role)));
DROP POLICY IF EXISTS "delete own library documents" ON public.document_library;
CREATE POLICY "delete own library documents" ON public.document_library
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));

-- ===== Messaging: division-mate profile visibility =====
DROP POLICY IF EXISTS "read division-mate profiles" ON public.profiles;
CREATE POLICY "read division-mate profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(id, 'staff'::app_role)
    OR private.has_role(id, 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.user_divisions ud1 JOIN public.user_divisions ud2 ON ud1.division_slug = ud2.division_slug WHERE ud1.user_id = auth.uid() AND ud2.user_id = profiles.id)
  );

-- ===== Lease e-sign stub =====
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS lease_signature_status text NOT NULL DEFAULT 'draft' CHECK (lease_signature_status IN ('draft', 'sent', 'signed', 'void')),
  ADD COLUMN IF NOT EXISTS lease_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS lease_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS lease_signed_name text,
  ADD COLUMN IF NOT EXISTS lease_document_path text;

-- ===== Billing =====
CREATE TABLE IF NOT EXISTS public.billing_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
  currency text NOT NULL DEFAULT 'ngn',
  division text,
  related_table text,
  related_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'void')),
  stripe_session_id text UNIQUE,
  stripe_payment_intent text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS billing_transactions_division_idx ON public.billing_transactions (division);
CREATE INDEX IF NOT EXISTS billing_transactions_created_by_idx ON public.billing_transactions (created_by);
CREATE INDEX IF NOT EXISTS billing_transactions_related_idx ON public.billing_transactions (related_table, related_id);
GRANT SELECT, INSERT ON public.billing_transactions TO authenticated;
GRANT ALL ON public.billing_transactions TO service_role;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own or division billing" ON public.billing_transactions;
CREATE POLICY "read own or division billing" ON public.billing_transactions
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR (division IS NOT NULL AND private.has_division_access(auth.uid(), division)) OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));
DROP POLICY IF EXISTS "create billing transactions" ON public.billing_transactions;
CREATE POLICY "create billing transactions" ON public.billing_transactions
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- ===== Investor / Farmer self-service =====
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
DROP POLICY IF EXISTS "investors read own record" ON public.investors;
CREATE POLICY "investors read own record" ON public.investors FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "farmers read own record" ON public.farmers;
CREATE POLICY "farmers read own record" ON public.farmers FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "farmers read own fields" ON public.fields;
CREATE POLICY "farmers read own fields" ON public.fields
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = fields.farmer_id AND f.user_id = auth.uid()));
DROP POLICY IF EXISTS "farmers read own field images" ON public.field_images;
CREATE POLICY "farmers read own field images" ON public.field_images
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fields fl JOIN public.farmers f ON f.id = fl.farmer_id WHERE fl.id = field_images.field_id AND f.user_id = auth.uid()));
DROP POLICY IF EXISTS "farmers read own alerts" ON public.agri_alerts;
CREATE POLICY "farmers read own alerts" ON public.agri_alerts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fields fl JOIN public.farmers f ON f.id = fl.farmer_id WHERE fl.id = agri_alerts.field_id AND f.user_id = auth.uid()));
DROP POLICY IF EXISTS "farmers read own sensor data" ON public.sensor_data;
CREATE POLICY "farmers read own sensor data" ON public.sensor_data
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fields fl JOIN public.farmers f ON f.id = fl.farmer_id WHERE fl.id = sensor_data.field_id AND f.user_id = auth.uid()));