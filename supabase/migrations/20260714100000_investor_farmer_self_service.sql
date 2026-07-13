-- Self-service portal access for investors and farmers, mirroring the
-- existing driver pattern (drivers.user_id + "drivers read own..." policies):
-- an admin grants the 'investor'/'farmer' role via the Users page, then a
-- staff member links the specific investor/farmer record to that person's
-- portal account by email (linkInvestorAccount / linkFarmerAccount below).
-- All new policies are additive (OR'd with existing ones) — nothing here can
-- reduce access that staff/admin already have.

ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE POLICY "investors read own record" ON public.investors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "farmers read own record" ON public.farmers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "farmers read own fields" ON public.fields
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.farmers f WHERE f.id = fields.farmer_id AND f.user_id = auth.uid())
  );

CREATE POLICY "farmers read own field images" ON public.field_images
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fields fl
      JOIN public.farmers f ON f.id = fl.farmer_id
      WHERE fl.id = field_images.field_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "farmers read own alerts" ON public.agri_alerts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fields fl
      JOIN public.farmers f ON f.id = fl.farmer_id
      WHERE fl.id = agri_alerts.field_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "farmers read own sensor data" ON public.sensor_data
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fields fl
      JOIN public.farmers f ON f.id = fl.farmer_id
      WHERE fl.id = sensor_data.field_id AND f.user_id = auth.uid()
    )
  );
