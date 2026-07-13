-- Newsletter signup on /insights previously had no backend at all
-- (onSubmit={(e) => e.preventDefault()} — it silently did nothing). This adds a real table
-- and the public.submitContact-style insert policy so the form can actually persist signups.

CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.newsletter_subscribers TO service_role;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anonymous visitors) can subscribe; only admins can read the list.
CREATE POLICY "anyone can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (
    length(trim(email)) > 3
    AND position('@' IN email) > 1
  );

CREATE POLICY "admins read newsletter subscribers" ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));
