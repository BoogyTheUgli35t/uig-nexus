-- Expands the Real Estate portfolio so every one of the five seeded locations
-- (Lagos, FCT Abuja, Rivers/Port Harcourt, Enugu, Kano) carries 5-6 live listings,
-- each with 4-5 photos covering exterior angles plus interior/land detail shots,
-- a sale/rent mix, and at least one landed (title-only, no structure) property
-- per location. Pairs with 20260714120000_public_listings.sql's listing_type,
-- state, and land_title_type columns and public RLS policies.
--
-- Part A tops up the original 10 properties (seeded in 20260714110000) from 3 to
-- 4 photos each. Part B adds 16 new properties. Every insert is idempotent —
-- guarded on title (properties) or on property_id + position (extra images) —
-- so this migration is safe to run more than once.

-- ===== Part A: one extra photo for each originally-seeded property =====

INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT p.id, v.url, v.pos, v.caption FROM public.properties p,
  (VALUES ('https://images.unsplash.com/photo-1701986903706-27e5e5fd8168?auto=format&fit=crop&w=1600&q=80'::text, 3, 'Interior common area, Lekki development'::text)) AS v(url, pos, caption)
WHERE p.title = 'Emerald Heights, Lekki Phase 1'
  AND NOT EXISTS (SELECT 1 FROM public.property_images WHERE property_id = p.id AND position = 3);

INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT p.id, v.url, v.pos, v.caption FROM public.properties p,
  (VALUES ('https://images.unsplash.com/photo-1673563932832-a0c9e0ed26f8?auto=format&fit=crop&w=1600&q=80'::text, 3, 'Living room interior, lagoon-facing window'::text)) AS v(url, pos, caption)
WHERE p.title = 'The Bourdillon Residences, Ikoyi'
  AND NOT EXISTS (SELECT 1 FROM public.property_images WHERE property_id = p.id AND position = 3);

INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT p.id, v.url, v.pos, v.caption FROM public.properties p,
  (VALUES ('https://images.unsplash.com/photo-1697371024648-7ae9420a242d?auto=format&fit=crop&w=1600&q=80'::text, 3, 'Office floor exterior detail'::text)) AS v(url, pos, caption)
WHERE p.title = 'Ocean View Towers, Victoria Island'
  AND NOT EXISTS (SELECT 1 FROM public.property_images WHERE property_id = p.id AND position = 3);

INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT p.id, v.url, v.pos, v.caption FROM public.properties p,
  (VALUES ('https://images.unsplash.com/photo-1673563932782-28daf64ff066?auto=format&fit=crop&w=1600&q=80'::text, 3, 'Living room interior, waterfront villa'::text)) AS v(url, pos, caption)
WHERE p.title = 'Banana Island Villas'
  AND NOT EXISTS (SELECT 1 FROM public.property_images WHERE property_id = p.id AND position = 3);

INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT p.id, v.url, v.pos, v.caption FROM public.properties p,
  (VALUES ('https://images.unsplash.com/photo-1721385936973-82e63e26f19d?auto=format&fit=crop&w=1600&q=80'::text, 3, 'Front elevation, Maitama duplex'::text)) AS v(url, pos, caption)
WHERE p.title = 'Maitama Diplomatic Court'
  AND NOT EXISTS (SELECT 1 FROM public.property_images WHERE property_id = p.id AND position = 3);

INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT p.id, v.url, v.pos, v.caption FROM public.properties p,
  (VALUES ('https://images.unsplash.com/photo-1641425944794-ea761d16edbd?auto=format&fit=crop&w=1600&q=80'::text, 3, 'Side elevation, Asokoro estate home'::text)) AS v(url, pos, caption)
WHERE p.title = 'Asokoro Grand Estate'
  AND NOT EXISTS (SELECT 1 FROM public.property_images WHERE property_id = p.id AND position = 3);

INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT p.id, v.url, v.pos, v.caption FROM public.properties p,
  (VALUES ('https://images.unsplash.com/photo-1580239808566-2f1c56a693ac?auto=format&fit=crop&w=1600&q=80'::text, 3, 'Plaza at dusk'::text)) AS v(url, pos, caption)
WHERE p.title = 'Central Business Plaza, Wuse II'
  AND NOT EXISTS (SELECT 1 FROM public.property_images WHERE property_id = p.id AND position = 3);

INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT p.id, v.url, v.pos, v.caption FROM public.properties p,
  (VALUES ('https://images.unsplash.com/photo-1585011191285-8b443579631c?auto=format&fit=crop&w=1600&q=80'::text, 3, 'Palm-lined street, Port Harcourt'::text)) AS v(url, pos, caption)
WHERE p.title = 'Harbour Point, Port Harcourt'
  AND NOT EXISTS (SELECT 1 FROM public.property_images WHERE property_id = p.id AND position = 3);

INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT p.id, v.url, v.pos, v.caption FROM public.properties p,
  (VALUES ('https://images.unsplash.com/photo-1531300365552-da5abe58a725?auto=format&fit=crop&w=1600&q=80'::text, 3, 'Bungalow frontage, Enugu'::text)) AS v(url, pos, caption)
WHERE p.title = 'Independence Layout Court'
  AND NOT EXISTS (SELECT 1 FROM public.property_images WHERE property_id = p.id AND position = 3);

INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT p.id, v.url, v.pos, v.caption FROM public.properties p,
  (VALUES ('https://images.unsplash.com/photo-1605307350812-0a31b45eeb11?auto=format&fit=crop&w=1600&q=80'::text, 3, 'Terrace exterior, Kano'::text)) AS v(url, pos, caption)
WHERE p.title = 'Nassarawa GRA Terraces'
  AND NOT EXISTS (SELECT 1 FROM public.property_images WHERE property_id = p.id AND position = 3);

-- ===== Part B: 16 new properties, 5-6 per location, sale + rent + land mix =====

-- 11. Palmgrove Court, Yaba (Lagos) — rent
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured)
  SELECT 'Palmgrove Court, Yaba', 'residential', 'Lagos', 'Lagos', 'Herbert Macaulay Way, Yaba, Lagos', 4500000, 3, 3, 180, 'available', 'rent',
    'A three-bedroom serviced apartment in Yaba, walking distance from the tech corridor, let annually with power and estate service included.',
    '["Serviced","Backup power","Estate security","Parking"]'::jsonb, 2021, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Palmgrove Court, Yaba')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1580239808566-2f1c56a693ac?auto=format&fit=crop&w=1600&q=80', 0, 'Apartment block exterior, Yaba'),
    ('https://images.unsplash.com/photo-1559833064-6f4573ec1ac9?auto=format&fit=crop&w=1600&q=80', 1, 'Street-facing elevation'),
    ('https://images.unsplash.com/photo-1673563932832-a0c9e0ed26f8?auto=format&fit=crop&w=1600&q=80', 2, 'Living room interior'),
    ('https://images.unsplash.com/photo-1559585888-6b01c8ea796b?auto=format&fit=crop&w=1600&q=80', 3, 'Compound entrance')
  ) AS u(url, pos, caption);

-- 12. Epe Waterfront Plots (Lagos) — land, sale
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, land_title_type, featured)
  SELECT 'Epe Waterfront Plots', 'land', 'Lagos', 'Lagos', 'Lekki-Epe Expressway, Epe, Lagos', 45000000, 0, 0, 1000, 'available', 'sale',
    'Dry, fenced waterfront land in Epe with direct road frontage on the Lekki-Epe corridor — sold in 1,000 sqm plots, ideal for a private residence or weekend retreat.',
    '["Dry land","Fenced","Road frontage","Survey plan available"]'::jsonb, 'Governor''s Consent', false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Epe Waterfront Plots')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1704230093402-c903d87735b4?auto=format&fit=crop&w=1600&q=80', 0, 'Aerial view of the plotted land'),
    ('https://images.unsplash.com/photo-1602939303655-c16afd4c593a?auto=format&fit=crop&w=1600&q=80', 1, 'Open cleared plot'),
    ('https://images.unsplash.com/photo-1704230093731-8dad84d386a9?auto=format&fit=crop&w=1600&q=80', 2, 'Surrounding waterfront corridor'),
    ('https://images.unsplash.com/photo-1744907895363-d351aa6019ef?auto=format&fit=crop&w=1600&q=80', 3, 'Aerial view of the wider Epe axis')
  ) AS u(url, pos, caption);

-- 13. Gwarinpa Family Homes (Abuja) — rent
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured)
  SELECT 'Gwarinpa Family Homes', 'residential', 'Abuja', 'FCT (Abuja)', '3rd Avenue, Gwarinpa, Abuja', 6000000, 4, 4, 300, 'available', 'rent',
    'A four-bedroom detached house in Gwarinpa, one of Abuja''s largest planned residential estates, let annually.',
    '["Detached","Borehole","Backup power","Estate roads"]'::jsonb, 2015, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Gwarinpa Family Homes')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1696744999160-02e02ab8754a?auto=format&fit=crop&w=1600&q=80', 0, 'House front, Gwarinpa'),
    ('https://images.unsplash.com/photo-1651131998464-638a5ae7544d?auto=format&fit=crop&w=1600&q=80', 1, 'Estate street view'),
    ('https://images.unsplash.com/photo-1673563932782-28daf64ff066?auto=format&fit=crop&w=1600&q=80', 2, 'Living room interior'),
    ('https://images.unsplash.com/photo-1747367143603-f335ec66fff0?auto=format&fit=crop&w=1600&q=80', 3, 'Side elevation')
  ) AS u(url, pos, caption);

-- 14. Katampe Extension Plots (Abuja) — land, sale
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, land_title_type, featured)
  SELECT 'Katampe Extension Plots', 'land', 'Abuja', 'FCT (Abuja)', 'Katampe Extension, Abuja', 65000000, 0, 0, 900, 'available', 'sale',
    'Titled dry land in the fast-developing Katampe Extension district, close to the Yangoji road network — sold in 900 sqm plots.',
    '["Dry land","Titled","Road network access"]'::jsonb, 'Certificate of Occupancy (C of O)', true
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Katampe Extension Plots')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1661332628689-17a220544628?auto=format&fit=crop&w=1600&q=80', 0, 'Development underway on adjoining plot'),
    ('https://images.unsplash.com/photo-1536467638680-868f39ec91d9?auto=format&fit=crop&w=1600&q=80', 1, 'Aerial view of the district'),
    ('https://images.unsplash.com/photo-1722442746061-054e1cb47540?auto=format&fit=crop&w=1600&q=80', 2, 'Access road to the plots'),
    ('https://images.unsplash.com/photo-1707406534088-09c4b6958cfa?auto=format&fit=crop&w=1600&q=80', 3, 'Morning aerial over the extension')
  ) AS u(url, pos, caption);

-- 15. GRA Phase 2 Duplex (Port Harcourt) — sale
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured)
  SELECT 'GRA Phase 2 Duplex', 'residential', 'Port Harcourt', 'Rivers', 'GRA Phase 2, Port Harcourt', 145000000, 5, 5, 360, 'available', 'sale',
    'A five-bedroom detached duplex in GRA Phase 2, Port Harcourt''s most established high-end residential district.',
    '["Detached","BQ","Backup power","Gated street"]'::jsonb, 2019, true
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'GRA Phase 2 Duplex')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1585011191285-8b443579631c?auto=format&fit=crop&w=1600&q=80', 0, 'Duplex front elevation'),
    ('https://images.unsplash.com/photo-1559585888-6b01c8ea796b?auto=format&fit=crop&w=1600&q=80', 1, 'GRA street view'),
    ('https://images.unsplash.com/photo-1673563932832-a0c9e0ed26f8?auto=format&fit=crop&w=1600&q=80', 2, 'Living room interior'),
    ('https://images.unsplash.com/photo-1658394818344-20f0f11a9121?auto=format&fit=crop&w=1600&q=80', 3, 'Rear compound view')
  ) AS u(url, pos, caption);

-- 16. Trans-Amadi Office Suites (Port Harcourt) — rent, commercial
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured)
  SELECT 'Trans-Amadi Office Suites', 'commercial', 'Port Harcourt', 'Rivers', 'Trans-Amadi Industrial Layout, Port Harcourt', 12000000, 0, 4, 520, 'available', 'rent',
    'Grade-B office suites in the Trans-Amadi industrial corridor, let per floor with dedicated parking and standby power.',
    '["Standby generator","Ample parking","Fibre-ready","Loading bay"]'::jsonb, 2016, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Trans-Amadi Office Suites')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1747367143603-f335ec66fff0?auto=format&fit=crop&w=1600&q=80', 0, 'Office building exterior'),
    ('https://images.unsplash.com/photo-1609657726788-44564a8f304a?auto=format&fit=crop&w=1600&q=80', 1, 'Architectural facade detail'),
    ('https://images.unsplash.com/photo-1580239808463-daf9766788a7?auto=format&fit=crop&w=1600&q=80', 2, 'Aerial view of the industrial layout'),
    ('https://images.unsplash.com/photo-1749058388308-744fdc8991ed?auto=format&fit=crop&w=1600&q=80', 3, 'Skyline near the corridor')
  ) AS u(url, pos, caption);

-- 17. Woji Waterside Land (Port Harcourt) — land, sale
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, land_title_type, featured)
  SELECT 'Woji Waterside Land', 'land', 'Port Harcourt', 'Rivers', 'Woji, Port Harcourt', 38000000, 0, 0, 850, 'available', 'sale',
    'Sand-filled waterside land in Woji, close to the New GRA extension — sold in 850 sqm plots with survey documents in place.',
    '["Sand-filled","Survey plan available","Waterside"]'::jsonb, 'Survey Plan & Deed of Assignment', false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Woji Waterside Land')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1704230093402-c903d87735b4?auto=format&fit=crop&w=1600&q=80', 0, 'Aerial view of the waterside plots'),
    ('https://images.unsplash.com/photo-1536467638680-868f39ec91d9?auto=format&fit=crop&w=1600&q=80', 1, 'Aerial view of the surrounding land'),
    ('https://images.unsplash.com/photo-1704230093731-8dad84d386a9?auto=format&fit=crop&w=1600&q=80', 2, 'Access road to the site'),
    ('https://images.unsplash.com/photo-1752622176337-5d9315e2df6e?auto=format&fit=crop&w=1600&q=80', 3, 'Nearby residential street')
  ) AS u(url, pos, caption);

-- 18. Rumuola Family Terrace (Port Harcourt) — rent
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured)
  SELECT 'Rumuola Family Terrace', 'residential', 'Port Harcourt', 'Rivers', 'Rumuola, Port Harcourt', 3200000, 3, 3, 190, 'available', 'rent',
    'A three-bedroom terrace duplex in Rumuola, close to Port Harcourt''s main commercial strip, let annually.',
    '["Gated compound","Backup power","Borehole"]'::jsonb, 2018, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Rumuola Family Terrace')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1580239808371-077b6d8313c6?auto=format&fit=crop&w=1600&q=80', 0, 'Terrace block exterior, Rumuola'),
    ('https://images.unsplash.com/photo-1628353100822-0229ae96e820?auto=format&fit=crop&w=1600&q=80', 1, 'Frontage detail'),
    ('https://images.unsplash.com/photo-1673563932782-28daf64ff066?auto=format&fit=crop&w=1600&q=80', 2, 'Living room interior'),
    ('https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?auto=format&fit=crop&w=1600&q=80', 3, 'Surrounding street view')
  ) AS u(url, pos, caption);

-- 19. New Haven Family Bungalow (Enugu) — sale
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured)
  SELECT 'New Haven Family Bungalow', 'residential', 'Enugu', 'Enugu', 'New Haven, Enugu', 68000000, 4, 3, 280, 'available', 'sale',
    'A four-bedroom family bungalow in New Haven, one of Enugu''s well-established residential neighbourhoods.',
    '["Gated compound","Backup power","Borehole","Garden"]'::jsonb, 2014, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'New Haven Family Bungalow')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1580239808575-21a119018fb4?auto=format&fit=crop&w=1600&q=80', 0, 'Bungalow exterior, New Haven'),
    ('https://images.unsplash.com/photo-1618828665347-d870c38c95c7?auto=format&fit=crop&w=1600&q=80', 1, 'Neighbourhood skyline'),
    ('https://images.unsplash.com/photo-1673563932832-a0c9e0ed26f8?auto=format&fit=crop&w=1600&q=80', 2, 'Living room interior'),
    ('https://images.unsplash.com/photo-1531300365552-da5abe58a725?auto=format&fit=crop&w=1600&q=80', 3, 'Front garden and driveway')
  ) AS u(url, pos, caption);

-- 20. Trans-Ekulu Apartments (Enugu) — rent
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured)
  SELECT 'Trans-Ekulu Apartments', 'residential', 'Enugu', 'Enugu', 'Trans-Ekulu, Enugu', 2200000, 2, 2, 140, 'available', 'rent',
    'A two-bedroom apartment in Trans-Ekulu, a fast-growing residential axis close to the University of Nigeria Teaching Hospital.',
    '["Serviced","Backup power","Estate security"]'::jsonb, 2020, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Trans-Ekulu Apartments')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1701383835696-faf8569ed2d7?auto=format&fit=crop&w=1600&q=80', 0, 'Apartment block exterior'),
    ('https://images.unsplash.com/photo-1628144688607-c373d8e3f31b?auto=format&fit=crop&w=1600&q=80', 1, 'Building daytime view'),
    ('https://images.unsplash.com/photo-1673563932782-28daf64ff066?auto=format&fit=crop&w=1600&q=80', 2, 'Living room interior'),
    ('https://images.unsplash.com/photo-1605307350812-0a31b45eeb11?auto=format&fit=crop&w=1600&q=80', 3, 'Compound frontage')
  ) AS u(url, pos, caption);

-- 21. Enugu-Onitsha Expressway Plots (Enugu) — land, sale
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, land_title_type, featured)
  SELECT 'Enugu-Onitsha Expressway Plots', 'land', 'Enugu', 'Enugu', 'Enugu-Onitsha Expressway, Enugu', 22000000, 0, 0, 1200, 'available', 'sale',
    'Commercially-zoned land fronting the Enugu-Onitsha Expressway, suited to warehousing, filling stations or roadside retail — sold in 1,200 sqm plots.',
    '["Expressway frontage","Commercial zoning","Survey plan available"]'::jsonb, 'Certificate of Occupancy (C of O)', false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Enugu-Onitsha Expressway Plots')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1602939303655-c16afd4c593a?auto=format&fit=crop&w=1600&q=80', 0, 'Open land along the expressway'),
    ('https://images.unsplash.com/photo-1661332628689-17a220544628?auto=format&fit=crop&w=1600&q=80', 1, 'Adjoining plot under development'),
    ('https://images.unsplash.com/photo-1722442746061-054e1cb47540?auto=format&fit=crop&w=1600&q=80', 2, 'Access road view'),
    ('https://images.unsplash.com/photo-1744907895363-d351aa6019ef?auto=format&fit=crop&w=1600&q=80', 3, 'Aerial view of the expressway corridor')
  ) AS u(url, pos, caption);

-- 22. Achara Layout Duplex (Enugu) — sale
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured)
  SELECT 'Achara Layout Duplex', 'residential', 'Enugu', 'Enugu', 'Achara Layout, Enugu', 95000000, 5, 4, 310, 'available', 'sale',
    'A five-bedroom duplex in Achara Layout, one of Enugu''s premium residential districts, finished to a modern standard.',
    '["Detached","BQ","Backup power","Borehole"]'::jsonb, 2019, true
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Achara Layout Duplex')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1690987601363-83022d125159?auto=format&fit=crop&w=1600&q=80', 0, 'Duplex front elevation, Achara Layout'),
    ('https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=1600&q=80', 1, 'Low angle exterior view'),
    ('https://images.unsplash.com/photo-1673563932832-a0c9e0ed26f8?auto=format&fit=crop&w=1600&q=80', 2, 'Living room interior'),
    ('https://images.unsplash.com/photo-1515120263166-b676e1f61045?auto=format&fit=crop&w=1600&q=80', 3, 'Daytime exterior view')
  ) AS u(url, pos, caption);

-- 23. Sabon Gari Commercial Plaza (Kano) — rent, commercial
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured)
  SELECT 'Sabon Gari Commercial Plaza', 'commercial', 'Kano', 'Kano', 'Sabon Gari, Kano', 5500000, 0, 3, 400, 'available', 'rent',
    'Ground-floor retail shops and upper-floor storage in Kano''s busy Sabon Gari commercial district, let per unit.',
    '["Retail frontage","Standby generator","Loading access"]'::jsonb, 2012, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Sabon Gari Commercial Plaza')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1696744999160-02e02ab8754a?auto=format&fit=crop&w=1600&q=80', 0, 'Plaza exterior, Sabon Gari'),
    ('https://images.unsplash.com/photo-1651131998464-638a5ae7544d?auto=format&fit=crop&w=1600&q=80', 1, 'Street-level commercial frontage'),
    ('https://images.unsplash.com/photo-1580239808463-daf9766788a7?auto=format&fit=crop&w=1600&q=80', 2, 'Aerial view of the commercial district'),
    ('https://images.unsplash.com/photo-1749058388308-744fdc8991ed?auto=format&fit=crop&w=1600&q=80', 3, 'Surrounding cityscape')
  ) AS u(url, pos, caption);

-- 24. Zoo Road Family Home (Kano) — sale
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured)
  SELECT 'Zoo Road Family Home', 'residential', 'Kano', 'Kano', 'Zoo Road, Kano', 58000000, 4, 3, 260, 'available', 'sale',
    'A four-bedroom family home on Zoo Road, a well-connected residential axis close to Kano''s commercial centre.',
    '["Gated compound","Backup power","Borehole","Parking"]'::jsonb, 2017, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Zoo Road Family Home')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1701986903706-27e5e5fd8168?auto=format&fit=crop&w=1600&q=80', 0, 'Home exterior, Zoo Road'),
    ('https://images.unsplash.com/photo-1697371024648-7ae9420a242d?auto=format&fit=crop&w=1600&q=80', 1, 'Street-facing view'),
    ('https://images.unsplash.com/photo-1673563932782-28daf64ff066?auto=format&fit=crop&w=1600&q=80', 2, 'Living room interior'),
    ('https://images.unsplash.com/photo-1721385936973-82e63e26f19d?auto=format&fit=crop&w=1600&q=80', 3, 'Front elevation, daytime')
  ) AS u(url, pos, caption);

-- 25. Kano Free Trade Zone Land (Kano) — land, sale
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, land_title_type, featured)
  SELECT 'Kano Free Trade Zone Land', 'land', 'Kano', 'Kano', 'Near Kano Free Trade Zone, Kano', 28000000, 0, 0, 1500, 'available', 'sale',
    'Industrially-zoned land close to the Kano Free Trade Zone, suited to warehousing or light manufacturing — sold in 1,500 sqm plots.',
    '["Industrial zoning","Road access","Survey plan available"]'::jsonb, 'Certificate of Occupancy (C of O)', true
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Kano Free Trade Zone Land')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1536467638680-868f39ec91d9?auto=format&fit=crop&w=1600&q=80', 0, 'Aerial view of the free trade zone plots'),
    ('https://images.unsplash.com/photo-1704230093402-c903d87735b4?auto=format&fit=crop&w=1600&q=80', 1, 'Aerial view of the surrounding land'),
    ('https://images.unsplash.com/photo-1707406534088-09c4b6958cfa?auto=format&fit=crop&w=1600&q=80', 2, 'Morning aerial over the district'),
    ('https://images.unsplash.com/photo-1704230093731-8dad84d386a9?auto=format&fit=crop&w=1600&q=80', 3, 'Access road to the site')
  ) AS u(url, pos, caption);

-- 26. Bompai Estate Terrace (Kano) — rent
WITH new_property AS (
  INSERT INTO public.properties (title, property_type, city, state, address, price, bedrooms, bathrooms, area_sqm, status, listing_type, description, amenities, year_built, featured)
  SELECT 'Bompai Estate Terrace', 'residential', 'Kano', 'Kano', 'Bompai, Kano', 2800000, 3, 2, 170, 'available', 'rent',
    'A three-bedroom terrace home in the Bompai industrial-residential axis, let annually with estate security included.',
    '["Gated estate","Backup power","Estate security"]'::jsonb, 2021, false
  WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Bompai Estate Terrace')
  RETURNING id
)
INSERT INTO public.property_images (property_id, storage_path, position, caption)
SELECT id, u.url, u.pos, u.caption FROM new_property,
  (VALUES
    ('https://images.unsplash.com/photo-1641425944794-ea761d16edbd?auto=format&fit=crop&w=1600&q=80', 0, 'Terrace exterior, Bompai'),
    ('https://images.unsplash.com/photo-1580239808566-2f1c56a693ac?auto=format&fit=crop&w=1600&q=80', 1, 'Estate skyline at dusk'),
    ('https://images.unsplash.com/photo-1673563932832-a0c9e0ed26f8?auto=format&fit=crop&w=1600&q=80', 2, 'Living room interior'),
    ('https://images.unsplash.com/photo-1559833064-6f4573ec1ac9?auto=format&fit=crop&w=1600&q=80', 3, 'Estate street view')
  ) AS u(url, pos, caption);
