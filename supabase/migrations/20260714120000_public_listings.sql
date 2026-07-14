-- Public real-estate listings: adds the columns the location-grouped public browse
-- experience needs (sale/rent, a groupable state field, land-specific title info),
-- and opens a narrow, read-only RLS window so the public marketing site (unauthenticated
-- "anon" requests) can list and view non off-market properties and their photos.
-- Nothing sensitive lives on these two tables (no owner PII, no internal notes), so a
-- public read policy on the already-public-facing listing fields is safe.

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listing_type text NOT NULL DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent'));
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS land_title_type text;

-- Backfill state for any existing rows from their city, so nothing seeded earlier is
-- left ungrouped once the public browse-by-location view ships.
UPDATE public.properties SET state = 'Lagos' WHERE state IS NULL AND city = 'Lagos';
UPDATE public.properties SET state = 'FCT (Abuja)' WHERE state IS NULL AND city = 'Abuja';
UPDATE public.properties SET state = 'Rivers' WHERE state IS NULL AND city = 'Port Harcourt';
UPDATE public.properties SET state = 'Enugu' WHERE state IS NULL AND city = 'Enugu';
UPDATE public.properties SET state = 'Kano' WHERE state IS NULL AND city = 'Kano';

CREATE INDEX IF NOT EXISTS properties_state_idx ON public.properties (state);
CREATE INDEX IF NOT EXISTS properties_public_listing_idx ON public.properties (status) WHERE status <> 'off_market';

-- ===== Public read policies =====
-- Portal-side policies ("realestate members read/manage properties" etc.) are untouched
-- and still govern the internal CRM. These are additive, anon-only-relevant policies for
-- the public marketing site's listing pages.
--
-- RLS policies alone are not sufficient — Postgres checks table-level GRANTs first, and
-- the anon role was never granted anything on these two tables (only authenticated and
-- service_role were, back in the original real-estate migration). Without this, every
-- anon request would fail with permission-denied before RLS is even evaluated.
GRANT SELECT ON public.properties TO anon;
GRANT SELECT ON public.property_images TO anon;

CREATE POLICY "public read listable properties" ON public.properties
  FOR SELECT TO anon
  USING (status <> 'off_market');

CREATE POLICY "public read listable property images" ON public.property_images
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_images.property_id AND p.status <> 'off_market'
    )
  );
