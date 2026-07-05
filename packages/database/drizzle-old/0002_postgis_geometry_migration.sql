-- ── PostGIS Geometry Columns Setup ──
-- This migration adds PostGIS geometry(Point, 4326) columns to farms and addresses tables
-- No data migration needed (starting fresh)

-- ==================================================================
-- IMPORTANT: This migration assumes PostGIS extension is already enabled
-- Run 0001_postgis_extension.sql before this migration
-- ==================================================================

-- ==================================================================
-- Add geometry columns to farms and addresses tables
-- ==================================================================

-- For farms table - GPS location of farm
ALTER TABLE farms ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

-- For addresses table - GPS location of address
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS location geometry(Point, 4326);

-- ==================================================================
-- Create spatial indexes (CRITICAL for performance)
-- ==================================================================
-- These indexes use GiST (Generalized Search Tree) for fast spatial queries

-- Index for farms location
CREATE INDEX IF NOT EXISTS idx_farms_location_gist
ON farms USING GIST (location);

-- Index for addresses location
CREATE INDEX IF NOT EXISTS idx_addresses_location_gist
ON addresses USING GIST (location);

-- ==================================================================
-- Verification
-- ==================================================================

-- Verify columns were created
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name IN ('farms', 'addresses')
  AND column_name = 'location';

-- Should show:
-- column_name | data_type | udt_name
-- -------------+-----------+----------
-- location     | user-defined | geometry

-- Verify indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('farms', 'addresses')
  AND indexname LIKE '%location%';

-- Should show:
-- idx_farms_location_gist
-- idx_addresses_location_gist

-- ==================================================================
-- Test PostGIS functionality
-- ==================================================================

-- Test geometry creation
SELECT
  ST_AsText(ST_SetSRID(ST_MakePoint(21.7453, 41.5123), 4326)) as wkt;
-- Expected: POINT(21.7453 41.5123)

-- Test distance calculation
SELECT
  ST_Distance(
    ST_SetSRID(ST_MakePoint(21.0, 41.0), 4326),
    ST_SetSRID(ST_MakePoint(22.0, 42.0), 4326)
  ) / 1000 as distance_km;
-- Expected: ~150 km

-- ==================================================================
-- Notes for Application Code
-- ==================================================================

-- INSERT with coordinates (Drizzle ORM):
-- Using the geometry column type with mode: 'xy'
-- await db.insert(farms).values({
--   farmId: 'MK12345678',
--   addressId: someAddressId,
--   name: 'My Farm',
--   location: { x: longitude, y: latitude }, // mode: 'xy'
-- });

-- Or using raw SQL:
-- await db.execute(sql`
--   INSERT INTO farms (farm_id, address_id, name, location)
--   VALUES (${farmId}, ${addressId}, ${name},
--     ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
-- `);

-- UPDATE coordinates:
-- await db.execute(sql`
--   UPDATE farms
--   SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
--   WHERE id = ${farmId}
-- `);

-- Query farms within radius:
-- const nearbyFarms = await db.execute(sql`
--   SELECT
--     f.id,
--     f.farm_id,
--     f.name,
--     ST_Distance(
--       f.location,
--       ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
--     ) / 1000 as distance_km
--   FROM farms f
--   WHERE f.location IS NOT NULL
--     AND ST_DWithin(
--       f.location,
--       ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
--       ${radiusMeters}
--     )
--   ORDER BY distance_km
--   LIMIT 20
-- `);

-- Get distance from a point:
-- await db.execute(sql`
--   SELECT *,
--     ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) / 1000 as distance_km
--   FROM farms
--   WHERE location IS NOT NULL
--   ORDER BY distance_km
--   LIMIT 20
-- `);
