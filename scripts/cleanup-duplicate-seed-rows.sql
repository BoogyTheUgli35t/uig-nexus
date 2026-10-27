-- =============================================================================
-- STEP 2 of 2 — the cleanup. This one DELETES rows.
-- =============================================================================
--
-- Run cleanup-duplicate-seed-rows-DRYRUN.sql FIRST and check its numbers.
-- Only run this once you are happy with what it said would be deleted.
--
-- WHY THIS EXISTS
--
-- Every division seeder in src/lib/*.seed.ts used a bare `.insert()` with no
-- existence check, so each run appended another full copy of its batch. The
-- Real Estate seeder ran five times, each run adding 3 properties, 2 tenants,
-- 2 leads and 2 investors.
--
--     properties   46 rows  ->  35 real     (11 duplicates, all state IS NULL)
--     tenants      12 rows  ->   4 real     ( 8 duplicates)
--     investors    12 rows  ->   4 real     ( 8 duplicates)
--     leads        13 rows  ->   5 real     ( 8 duplicates)
--
-- Every Real Estate KPI in the portal has been reading roughly triple. The
-- duplicate properties also have no `state`, which is the column the public
-- listings group on, so they were invisible on the marketing site — that is
-- why the public browse showed 34 listings while the portal showed 46.
--
-- The root cause is fixed in code (the seeders now check before inserting), so
-- this only needs to run once.
--
-- WHY IT IS NOT A MIGRATION
--
-- Migrations in supabase/migrations/ apply automatically on deploy. This
-- script deletes rows from a live database, so it is deliberately kept out of
-- that directory: run it by hand, once, after reading it.
--
-- HOW TO RUN
--
--   Supabase dashboard -> SQL Editor -> paste this whole file -> Run.
--
-- It runs inside a transaction, so either all of it applies or none of it
-- does. Nothing is deleted before the child rows pointing at it have been
-- moved to the surviving copy.
--
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Pick the survivors: the earliest row per address among the properties the
--    seeder left without a state.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE property_survivors ON COMMIT DROP AS
SELECT DISTINCT ON (address) id AS keep_id, address, city
FROM properties
WHERE state IS NULL
ORDER BY address, created_at ASC;

CREATE TEMP TABLE doomed_properties ON COMMIT DROP AS
SELECT p.id, p.address
FROM properties p
WHERE p.state IS NULL
  AND p.id NOT IN (SELECT keep_id FROM property_survivors);

-- ---------------------------------------------------------------------------
-- 2. Move every child row onto the surviving copy BEFORE anything is deleted.
--    All four of these tables cascade on delete, so skipping this step would
--    silently destroy real tenancies, leads and photographs.
-- ---------------------------------------------------------------------------

-- 2a. Tenants.
UPDATE tenants t
SET property_id = s.keep_id
FROM doomed_properties d
JOIN property_survivors s ON s.address = d.address
WHERE t.property_id = d.id;

-- 2b. Leads.
UPDATE leads l
SET property_id = s.keep_id
FROM doomed_properties d
JOIN property_survivors s ON s.address = d.address
WHERE l.property_id = d.id;

-- 2c. Images. `position` has no unique constraint, so the survivor's own
--     photos keep their order and the moved ones are appended after them.
UPDATE property_images i
SET property_id = s.keep_id,
    position = i.position + 100
FROM doomed_properties d
JOIN property_survivors s ON s.address = d.address
WHERE i.property_id = d.id;

-- 2d. Units. `property_units` has UNIQUE (property_id, unit_number), so a
--     unit can only move if the survivor doesn't already have that number.
--     One that would collide is a duplicate of a unit already on the
--     survivor, so it is left to cascade away with its parent.
UPDATE property_units u
SET property_id = s.keep_id
FROM doomed_properties d
JOIN property_survivors s ON s.address = d.address
WHERE u.property_id = d.id
  AND NOT EXISTS (
    SELECT 1 FROM property_units existing
    WHERE existing.property_id = s.keep_id
      AND existing.unit_number = u.unit_number
  );

-- ---------------------------------------------------------------------------
-- 3. Give the survivors the state the seeder never set, using the same values
--    the rest of the catalogue uses so they group with their neighbours on the
--    public listings pages.
-- ---------------------------------------------------------------------------
UPDATE properties
SET state = CASE city
              WHEN 'Lagos' THEN 'Lagos'
              WHEN 'Abuja' THEN 'FCT (Abuja)'
              ELSE city
            END
WHERE id IN (SELECT keep_id FROM property_survivors);

-- ---------------------------------------------------------------------------
-- 4. Delete the duplicate properties. Everything worth keeping now points at
--    a survivor instead.
-- ---------------------------------------------------------------------------
DELETE FROM properties WHERE id IN (SELECT id FROM doomed_properties);

-- ---------------------------------------------------------------------------
-- 5. Same treatment for the other three tables: keep the earliest row per
--    person, drop the copies. `crm_activities` cascades from `leads`, and the
--    activities live on the earliest lead, which is the one we keep.
-- ---------------------------------------------------------------------------
DELETE FROM tenants
WHERE id NOT IN (
  SELECT DISTINCT ON (full_name, email) id
  FROM tenants ORDER BY full_name, email, created_at ASC
);

DELETE FROM investors
WHERE id NOT IN (
  SELECT DISTINCT ON (full_name, email) id
  FROM investors ORDER BY full_name, email, created_at ASC
);

DELETE FROM leads
WHERE id NOT IN (
  SELECT DISTINCT ON (full_name, email) id
  FROM leads ORDER BY full_name, email, created_at ASC
);

-- ---------------------------------------------------------------------------
-- 6. What the result should look like.
--    properties 35, tenants 4, investors 4, leads 5, and zero properties
--    left without a state.
-- ---------------------------------------------------------------------------
SELECT 'properties'          AS table_name, count(*) AS row_count FROM properties
UNION ALL SELECT 'tenants',   count(*) FROM tenants
UNION ALL SELECT 'investors', count(*) FROM investors
UNION ALL SELECT 'leads',     count(*) FROM leads
UNION ALL SELECT 'properties with no state', count(*) FROM properties WHERE state IS NULL
ORDER BY table_name;

COMMIT;
