-- Seeds the Real Estate division with a starter portfolio of real properties across
-- Nigeria, each carrying a small photo gallery of real, licensed photography (sourced
-- from Nigerian photographers on Unsplash — free-for-commercial-use license, no
-- attribution required) so the division no longer reads as an empty shell.
--
-- Every insert is guarded with WHERE NOT EXISTS keyed on the property title, so this
-- migration is safe to run more than once. property_images.storage_path stores a full
-- https:// URL here rather than a Supabase Storage object key — src/lib/utils.ts
-- `resolveImageUrl()` renders full URLs directly and only falls back to
-- `storage.getPublicUrl()` for bucket-relative keys, so both seeded and
-- user-uploaded photos render correctly through the same code path.

-- 1. Emerald Heights, Lekki Phase 1 (Lagos)
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, amenities, year_built, featured)
  SELECT 'Emerald Heights, Lekki Phase 1', 'residential', 'Lagos', 'Admiralty Way, Lekki Phase 1, Lagos', 185000000, 4, 5, 320, 'available',
    'A gated four-bedroom terrace development in the heart of Lekki Phase 1, minutes from the Lekki-Epe corridor. Finished to an international standard with a private courtyard and rooftop terrace.',
    '["Swimming pool","24/7 security","Backup power","Gated estate","Rooftop terrace"]'::jsonb, 2022, true
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Emerald Heights, Lekki Phase 1')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1580239808575-21a119018fb4?auto=format&fit=crop&w=1600&q=80', 0, 'Aerial view of the Lekki Phase 1 development'),
    ('https://images.unsplash.com/photo-1580239808566-2f1c56a693ac?auto=format&fit=crop&w=1600&q=80', 1, 'Estate skyline at dusk'),
    ('https://images.unsplash.com/photo-1701383835696-faf8569ed2d7?auto=format&fit=crop&w=1600&q=80', 2, 'Balcony detail, residential block')
  ) AS u(url, pos, caption);

-- 2. The Bourdillon Residences, Ikoyi (Lagos)
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, amenities, year_built, featured)
  SELECT 'The Bourdillon Residences, Ikoyi', 'residential', 'Lagos', 'Bourdillon Road, Ikoyi, Lagos', 420000000, 5, 6, 480, 'available',
    'A five-bedroom penthouse residence in Ikoyi with panoramic lagoon views, private elevator access and a full-floor layout designed for entertaining.',
    '["Private elevator","Lagoon view","Concierge","Backup power","Gym"]'::jsonb, 2021, true
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'The Bourdillon Residences, Ikoyi')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1745725427804-4d94df0c5eb7?auto=format&fit=crop&w=1600&q=80', 0, 'Building facade with palm-lined entrance'),
    ('https://images.unsplash.com/photo-1658394818344-20f0f11a9121?auto=format&fit=crop&w=1600&q=80', 1, 'Rooftop view over Ikoyi'),
    ('https://images.unsplash.com/photo-1628144688607-c373d8e3f31b?auto=format&fit=crop&w=1600&q=80', 2, 'Exterior daytime view')
  ) AS u(url, pos, caption);

-- 3. Ocean View Towers, Victoria Island (Lagos)
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, amenities, year_built, featured)
  SELECT 'Ocean View Towers, Victoria Island', 'mixed_use', 'Lagos', 'Ozumba Mbadiwe Avenue, Victoria Island, Lagos', 650000000, 0, 8, 2100, 'available',
    'A mixed-use tower on Ozumba Mbadiwe combining ground-floor retail with premium office floors and a rooftop event space overlooking the lagoon.',
    '["Retail frontage","Standby generators","Fibre-ready","Rooftop event space","Basement parking"]'::jsonb, 2023, true
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Ocean View Towers, Victoria Island')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1749058388308-744fdc8991ed?auto=format&fit=crop&w=1600&q=80', 0, 'Cityscape featuring the development and waterfront'),
    ('https://images.unsplash.com/photo-1744907895363-d351aa6019ef?auto=format&fit=crop&w=1600&q=80', 1, 'Aerial view of Victoria Island'),
    ('https://images.unsplash.com/photo-1618828665347-d870c38c95c7?auto=format&fit=crop&w=1600&q=80', 2, 'Skyline under a clear sky')
  ) AS u(url, pos, caption);

-- 4. Banana Island Villas (Lagos)
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, amenities, year_built, featured)
  SELECT 'Banana Island Villas', 'residential', 'Lagos', 'Banana Island, Ikoyi, Lagos', 980000000, 6, 7, 750, 'available',
    'A private waterfront villa on Banana Island with direct water access, staff quarters and a dedicated boat berth.',
    '["Waterfront","Boat berth","Staff quarters","Private garden","24/7 security"]'::jsonb, 2020, true
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Banana Island Villas')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1531300365552-da5abe58a725?auto=format&fit=crop&w=1600&q=80', 0, 'Villa exterior under blue sky'),
    ('https://images.unsplash.com/photo-1585011191285-8b443579631c?auto=format&fit=crop&w=1600&q=80', 1, 'Palm-lined approach to the residence'),
    ('https://images.unsplash.com/photo-1605307350812-0a31b45eeb11?auto=format&fit=crop&w=1600&q=80', 2, 'Villa facade, daytime')
  ) AS u(url, pos, caption);

-- 5. Maitama Diplomatic Court (Abuja)
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, amenities, year_built, featured)
  SELECT 'Maitama Diplomatic Court', 'residential', 'Abuja', 'Yedseram Street, Maitama, Abuja', 310000000, 5, 5, 420, 'available',
    'A five-bedroom detached duplex in Maitama''s diplomatic district, close to embassies and the Central Business District.',
    '["Detached duplex","BQ","Backup power","Landscaped garden","Gated street"]'::jsonb, 2019, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Maitama Diplomatic Court')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1537372023620-37161b1ad8ac?auto=format&fit=crop&w=1600&q=80', 0, 'Assorted residences in the district'),
    ('https://images.unsplash.com/photo-1651131998464-638a5ae7544d?auto=format&fit=crop&w=1600&q=80', 1, 'Street-level view, Abuja'),
    ('https://images.unsplash.com/photo-1704230093731-8dad84d386a9?auto=format&fit=crop&w=1600&q=80', 2, 'Aerial view of Abuja')
  ) AS u(url, pos, caption);

-- 6. Asokoro Grand Estate (Abuja)
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, amenities, year_built, featured)
  SELECT 'Asokoro Grand Estate', 'residential', 'Abuja', 'Yakubu Gowon Crescent, Asokoro, Abuja', 275000000, 4, 5, 380, 'reserved',
    'A gated four-bedroom estate home in Asokoro, walking distance from the Presidential Villa perimeter.',
    '["Gated estate","Backup power","Borehole","CCTV","Staff quarters"]'::jsonb, 2018, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Asokoro Grand Estate')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1696744999160-02e02ab8754a?auto=format&fit=crop&w=1600&q=80', 0, 'Entrance and forecourt'),
    ('https://images.unsplash.com/photo-1722442746061-054e1cb47540?auto=format&fit=crop&w=1600&q=80', 1, 'Street view with surrounding towers'),
    ('https://images.unsplash.com/photo-1707406534088-09c4b6958cfa?auto=format&fit=crop&w=1600&q=80', 2, 'Morning aerial view over Abuja')
  ) AS u(url, pos, caption);

-- 7. Central Business Plaza, Wuse II (Abuja)
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, amenities, year_built, featured)
  SELECT 'Central Business Plaza, Wuse II', 'commercial', 'Abuja', 'Aminu Kano Crescent, Wuse II, Abuja', 540000000, 0, 6, 1650, 'available',
    'A commercial office plaza in Wuse II with ground-floor banking hall space and five upper floors of Grade-A office suites.',
    '["Grade-A finish","Elevators","Standby generators","Ample parking","Fibre-ready"]'::jsonb, 2022, true
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Central Business Plaza, Wuse II')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1747367143603-f335ec66fff0?auto=format&fit=crop&w=1600&q=80', 0, 'Plaza exterior, Central Business District'),
    ('https://images.unsplash.com/photo-1609657726788-44564a8f304a?auto=format&fit=crop&w=1600&q=80', 1, 'Architectural detail'),
    ('https://images.unsplash.com/photo-1580239808463-daf9766788a7?auto=format&fit=crop&w=1600&q=80', 2, 'Aerial view of the business district')
  ) AS u(url, pos, caption);

-- 8. Harbour Point, Port Harcourt (Rivers)
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, amenities, year_built, featured)
  SELECT 'Harbour Point, Port Harcourt', 'residential', 'Port Harcourt', 'Old GRA, Port Harcourt, Rivers State', 165000000, 4, 4, 340, 'available',
    'A four-bedroom family home in Port Harcourt''s Old GRA, close to the waterfront and the city''s main business corridor.',
    '["Waterfront proximity","Backup power","Gated compound","Borehole"]'::jsonb, 2017, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Harbour Point, Port Harcourt')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1559585888-6b01c8ea796b?auto=format&fit=crop&w=1600&q=80', 0, 'Road and residential buildings, Old GRA'),
    ('https://images.unsplash.com/photo-1752622176337-5d9315e2df6e?auto=format&fit=crop&w=1600&q=80', 1, 'Street lined with houses'),
    ('https://images.unsplash.com/photo-1628353100822-0229ae96e820?auto=format&fit=crop&w=1600&q=80', 2, 'Frontage detail')
  ) AS u(url, pos, caption);

-- 9. Independence Layout Court (Enugu)
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, amenities, year_built, featured)
  SELECT 'Independence Layout Court', 'residential', 'Enugu', 'Independence Layout, Enugu', 92000000, 3, 3, 260, 'available',
    'A three-bedroom bungalow in Enugu''s Independence Layout, a quiet, established residential neighbourhood.',
    '["Gated compound","Backup power","Borehole","Garden"]'::jsonb, 2016, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Independence Layout Court')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1580239808371-077b6d8313c6?auto=format&fit=crop&w=1600&q=80', 0, 'Neighbourhood aerial view'),
    ('https://images.unsplash.com/photo-1559833064-6f4573ec1ac9?auto=format&fit=crop&w=1600&q=80', 1, 'Skyline at daytime'),
    ('https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?auto=format&fit=crop&w=1600&q=80', 2, 'Aerial view of surrounding buildings')
  ) AS u(url, pos, caption);

-- 10. Nassarawa GRA Terraces (Kano)
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, address, price, bedrooms, bathrooms, area_sqm, status, description, amenities, year_built, featured)
  SELECT 'Nassarawa GRA Terraces', 'residential', 'Kano', 'Nassarawa GRA, Kano', 78000000, 3, 3, 240, 'available',
    'A modern three-bedroom terrace home in Kano''s Nassarawa GRA, one of the city''s established residential districts.',
    '["Gated estate","Backup power","Borehole","Parking"]'::jsonb, 2020, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Nassarawa GRA Terraces')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1690987601363-83022d125159?auto=format&fit=crop&w=1600&q=80', 0, 'Terrace block exterior'),
    ('https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=1600&q=80', 1, 'Low angle view of the building'),
    ('https://images.unsplash.com/photo-1515120263166-b676e1f61045?auto=format&fit=crop&w=1600&q=80', 2, 'Daytime exterior view')
  ) AS u(url, pos, caption);
