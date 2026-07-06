-- Drop blanket "authenticated can do anything" policies (division/role-scoped policies remain)
DROP POLICY IF EXISTS auth_datasets ON public.datasets;
DROP POLICY IF EXISTS auth_drivers ON public.drivers;
DROP POLICY IF EXISTS auth_farmers ON public.farmers;
DROP POLICY IF EXISTS auth_fields ON public.fields;
DROP POLICY IF EXISTS auth_integrations ON public.integrations;
DROP POLICY IF EXISTS auth_investors ON public.investors;
DROP POLICY IF EXISTS auth_leads ON public.leads;
DROP POLICY IF EXISTS auth_models ON public.models;
DROP POLICY IF EXISTS auth_notifications ON public.notifications;
DROP POLICY IF EXISTS auth_predictions ON public.predictions;
DROP POLICY IF EXISTS auth_properties ON public.properties;
DROP POLICY IF EXISTS auth_routes ON public.routes;
DROP POLICY IF EXISTS auth_sensor_data ON public.sensor_data;
DROP POLICY IF EXISTS auth_shipments ON public.shipments;
DROP POLICY IF EXISTS auth_tech_projects ON public.tech_projects;
DROP POLICY IF EXISTS auth_tech_tasks ON public.tech_tasks;
DROP POLICY IF EXISTS auth_tenants ON public.tenants;
DROP POLICY IF EXISTS auth_vehicles ON public.vehicles;

-- ideas / prototypes / partners only had the blanket policy; replace with innovation-lab scoping
DROP POLICY IF EXISTS auth_ideas ON public.ideas;
DROP POLICY IF EXISTS auth_prototypes ON public.prototypes;
DROP POLICY IF EXISTS auth_partners ON public.partners;

-- ideas: innovation-lab members/admin/staff manage all; submitters manage their own
CREATE POLICY "innovation members read ideas" ON public.ideas
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
    OR submitted_by = auth.uid()
  );
CREATE POLICY "innovation members manage ideas" ON public.ideas
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
    OR submitted_by = auth.uid()
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
    OR submitted_by = auth.uid()
  );

-- prototypes: innovation-lab members/admin/staff
CREATE POLICY "innovation members read prototypes" ON public.prototypes
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "innovation members manage prototypes" ON public.prototypes
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );

-- partners: innovation-lab members/admin/staff
CREATE POLICY "innovation members read partners" ON public.partners
  FOR SELECT TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );
CREATE POLICY "innovation members manage partners" ON public.partners
  FOR ALL TO authenticated
  USING (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  )
  WITH CHECK (
    private.has_division_access(auth.uid(), 'innovation-lab')
    OR private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'staff'::app_role)
  );