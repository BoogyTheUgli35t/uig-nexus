-- 1. New roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'investor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'farmer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';

-- 2. Divisions directory
CREATE TABLE public.divisions (
  slug text PRIMARY KEY,
  name text NOT NULL,
  tagline text,
  accent text NOT NULL DEFAULT 'gold',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.divisions TO authenticated;
GRANT ALL ON public.divisions TO service_role;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authed read divisions" ON public.divisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage divisions" ON public.divisions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- 3. User divisions
CREATE TABLE public.user_divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  division_slug text NOT NULL REFERENCES public.divisions(slug) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, division_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_divisions TO authenticated;
GRANT ALL ON public.user_divisions TO service_role;
ALTER TABLE public.user_divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own divisions" ON public.user_divisions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage user divisions" ON public.user_divisions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

-- 4. Division access helper
CREATE OR REPLACE FUNCTION private.has_division_access(_user_id uuid, _slug text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT private.has_role(_user_id, 'admin')
    OR EXISTS (SELECT 1 FROM public.user_divisions ud WHERE ud.user_id = _user_id AND ud.division_slug = _slug)
$$;

-- 5. Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  division text,
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff admins insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'staff') OR user_id = auth.uid());
CREATE POLICY "admins delete notifications" ON public.notifications FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

-- 6. Messages (per-division chat)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division text NOT NULL,
  thread_key text NOT NULL DEFAULT 'general',
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "division members read messages" ON public.messages FOR SELECT TO authenticated
  USING (private.has_division_access(auth.uid(), division));
CREATE POLICY "division members post messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND private.has_division_access(auth.uid(), division));
CREATE POLICY "senders admins delete messages" ON public.messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

-- 7. Document division tag
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS division text;

-- 8. Seed divisions
INSERT INTO public.divisions (slug, name, tagline, accent, sort_order) VALUES
  ('technology', 'UIG Technology', 'AI-powered software, portals & automation', 'tech', 1),
  ('agritech', 'UIG AgriTech', 'Smart agriculture, IoT & yield intelligence', 'agritech', 2),
  ('real-estate', 'UIG Real Estate', 'Property systems, CRM & investor dashboards', 'realestate', 3),
  ('logistics', 'UIG Logistics', 'Fleet intelligence, shipments & routing', 'logistics', 4),
  ('intelligence', 'UIG Intelligence', 'AI models, predictive analytics & automation', 'intelligence', 5),
  ('innovation-lab', 'UIG Innovation Lab', 'Venture studio, prototyping & incubation', 'innovation', 6)
ON CONFLICT (slug) DO NOTHING;