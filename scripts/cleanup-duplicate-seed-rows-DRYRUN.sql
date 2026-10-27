-- =============================================================================
-- STEP 1 of 2 — DRY RUN. This script reads only. It changes nothing.
-- =============================================================================
--
-- Run this first, in the Supabase dashboard: SQL Editor -> paste -> Run.
--
-- It tells you exactly what the cleanup script would do, so you can check the
-- numbers before anything is deleted. Nothing here writes, so it is safe to
-- run as many times as you like.
--
-- WHAT YOU SHOULD SEE
--
-- Every division seeder in src/lib/*.seed.ts used a bare `.insert()` with no
-- existence check, so each run appended another full copy of its batch. The
-- Real Estate seeder ran five times, and each run added 3 properties, 2
-- tenants, 2 leads and 2 investors.
--
-- Expected, before cleanup:
--
--     properties   46 rows  ->  35 real     (11 duplicates, all with state IS NULL)
--     tenants      12 rows  ->   4 real     ( 8 duplicates)
--     investors    12 rows  ->   4 real     ( 8 duplicates)
--     leads        13 rows  ->   5 real     ( 8 duplicates)
--
-- If your numbers differ from these, say so before running step 2 — the code
-- fix landed a while ago, so a seeder may have run again since these counts
-- were taken, or someone may have added real rows.
--
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Current row counts, and how many of each are duplicates.
-- ---------------------------------------------------------------------------
WITH property_keep AS (
  SELECT DISTINCT ON (address) id
  FROM properties
  WHERE state IS NULL
  ORDER BY address, created_at ASC
),
tenant_keep AS (
  SELECT DISTINCT ON (full_name, email) id
  FROM tenants ORDER BY full_name, email, created_at ASC
),
investor_keep AS (
  SELECT DISTINCT ON (full_name, email) id
  FROM investors ORDER BY full_name, email, created_at ASC
),
lead_keep AS (
  SELECT DISTINCT ON (full_name, email) id
  FROM leads ORDER BY full_name, email, created_at ASC
)
SELECT
  'properties' AS table_name,
  (SELECT count(*) FROM properties)                                     AS rows_now,
  (SELECT count(*) FROM properties WHERE state IS NULL
     AND id NOT IN (SELECT id FROM property_keep))                      AS would_delete,
  (SELECT count(*) FROM properties)
    - (SELECT count(*) FROM properties WHERE state IS NULL
         AND id NOT IN (SELECT id FROM property_keep))                  AS rows_after
UNION ALL SELECT
  'tenants',
  (SELECT count(*) FROM tenants),
  (SELECT count(*) FROM tenants WHERE id NOT IN (SELECT id FROM tenant_keep)),
  (SELECT count(*) FROM tenant_keep)
UNION ALL SELECT
  'investors',
  (SELECT count(*) FROM investors),
  (SELECT count(*) FROM investors WHERE id NOT IN (SELECT id FROM investor_keep)),
  (SELECT count(*) FROM investor_keep)
UNION ALL SELECT
  'leads',
  (SELECT count(*) FROM leads),
  (SELECT count(*) FROM leads WHERE id NOT IN (SELECT id FROM lead_keep)),
  (SELECT count(*) FROM lead_keep)
ORDER BY table_name;

-- ---------------------------------------------------------------------------
-- 2. The exact properties that would be deleted, so you can eyeball them.
--    Every row here should look like a copy of another row in the same list.
-- ---------------------------------------------------------------------------
WITH property_keep AS (
  SELECT DISTINCT ON (address) id
  FROM properties
  WHERE state IS NULL
  ORDER BY address, created_at ASC
)
SELECT
  p.title,
  p.address,
  p.city,
  p.created_at,
  CASE WHEN p.id IN (SELECT id FROM property_keep) THEN 'KEEP' ELSE 'delete' END AS action
FROM properties p
WHERE p.state IS NULL
ORDER BY p.address, p.created_at;

-- ---------------------------------------------------------------------------
-- 3. Child rows attached to properties that would be deleted.
--    The cleanup re-points these onto the surviving copy first, so none of
--    them is lost — this is just so you can see how many are involved.
-- ---------------------------------------------------------------------------
WITH property_keep AS (
  SELECT DISTINCT ON (address) id AS keep_id, address
  FROM properties
  WHERE state IS NULL
  ORDER BY address, created_at ASC
),
doomed AS (
  SELECT p.id
  FROM properties p
  WHERE p.state IS NULL
    AND p.id NOT IN (SELECT keep_id FROM property_keep)
)
SELECT 'units on duplicate properties'   AS what, count(*) FROM property_units WHERE property_id IN (SELECT id FROM doomed)
UNION ALL SELECT 'images on duplicate properties', count(*) FROM property_images WHERE property_id IN (SELECT id FROM doomed)
UNION ALL SELECT 'tenants on duplicate properties', count(*) FROM tenants        WHERE property_id IN (SELECT id FROM doomed)
UNION ALL SELECT 'leads on duplicate properties',   count(*) FROM leads          WHERE property_id IN (SELECT id FROM doomed)
ORDER BY what;
