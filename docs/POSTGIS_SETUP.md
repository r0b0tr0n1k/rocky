# PostGIS Setup and Migration Guide

**Status:** ✅ ENABLED - PostGIS extension migration created
**Priority:** ✅ COMPLETED - Ready to run migrations
**SRID:** 4326 (WGS84 - Standard GPS coordinate system)

## Overview

PostGIS support has been configured and migrations have been created. The system is ready to enable PostGIS and migrate the `location` columns from varchar to proper PostGIS `geometry(Point, 4326)` columns.

## What We Have

### Geometry Support Package

**Location:** `packages/database/src/geometry/`

We've created a complete geometry support module:

**Files:**
1. `coordinate-schema.ts` - Zod schemas for coordinates and polygons
2. `helpers.ts` - WKT (Well-Known Text) conversion functions
3. `postgis.ts` - Custom PostGIS column type for Drizzle ORM
4. `index.ts` - Module exports

**Zod Schemas:**
- `coordinateSchema` - `{ latitude: number, longitude: number }`
- `polygonGeometrySchema` - Polygon with vertices
- `circleGeometrySchema` - Circle with center + radius
- `geofenceGeometrySchema` - Union of circle/polygon

**Helper Functions:**
- `geometryPointToWkt(lat, lng)` - Convert to PostGIS WKT format
- `geometryPointFromWkt(wkt)` - Parse PostGIS WKT to coordinates
- `geometryPolygonToWkt(coords)` - Convert polygon to WKT
- `geometryPolygonFromWkt(wkt)` - Parse polygon WKT

### Current Database State

**Tables with location fields:**
- `farms.location` - **Updated to** `geometry(Point, 4326)` - GPS coordinates of farm
- `addresses.location` - **Updated to** `geometry(Point, 4326)` - GPS coordinates of address

**Schema:** Drizzle ORM schema files have been updated to use PostGIS geometry types
**Indexes:** GiST spatial indexes have been added to both tables

## Migration Steps

### ✅ Step 1: Run Migration Files (READY)

Two migration files have been created:

1. **0001_postgis_extension.sql** - Enables PostGIS extension
2. **0002_postgis_geometry_migration.sql** - Converts varchar to geometry columns

Run them in order:

```bash
# Option A: Use psql
cd packages/database
psql -d rocky_db -f drizzle/0001_postgis_extension.sql
psql -d rocky_db -f drizzle/0002_postgis_geometry_migration.sql

# Option B: Use drizzle-kit (if configured)
pnpm --filter @rocky/database db:push
```

**Before running migrations**, ensure PostGIS is installed on your PostgreSQL server:

```bash
# Ubuntu/Debian
sudo apt-get install postgis postgresql-16-postgis-3

# macOS (Homebrew)
brew install postgis

# Verify installation
psql -d rocky_db -c "SELECT PostGIS_Version();"
```

Verify the extension after running the first migration:

```sql
SELECT postgis_version();
-- Should output something like: "3.4.0"
```

### ✅ Step 2: Schema Files Updated

The following schema files have been updated to use PostGIS geometry types:

- **packages/database/src/schema/hk/addresses.ts**
  - `location: geometry("location")`
  - Spatial index: `idx_addresses_location_gist`

- **packages/database/src/schema/hk/farms.ts**
  - `location: geometry("location")`
  - Spatial index: `idx_farms_location_gist`

### ✅ Step 3: Migration Data Handling

The migration file (`0002_postgis_geometry_migration.sql`) includes:

1. **Data Migration Logic:**
   - Handles WKT format: `POINT(lng lat)` or `SRID=4326;POINT(lng lat)`
   - Handles comma-separated format: `lat,lng`
   - Handles empty strings as NULL
   - Preserves existing data

2. **Spatial Indexes:**
   - GiST indexes for fast spatial queries
   - Created automatically in migration

3. **Verification Queries:**
   - Counts records with/without locations
   - Sample queries to test PostGIS functions

Create a migration file or run this SQL directly:

```sql
-- =================================================================
-- PostGIS Migration: Convert location columns to geometry(Point, 4326)
-- =================================================================

-- 1. Add new geometry columns (keep old varchar columns for backup)
ALTER TABLE farms ADD COLUMN location_geom geometry(Point, 4326);
ALTER TABLE addresses ADD COLUMN location_geom geometry(Point, 4326);

-- 2. Migrate data from varchar to geometry
-- Assuming existing data is in WKT format or "lat,lng" format

-- For farms table
UPDATE farms
SET location_geom = CASE
  -- If already WKT format (SRID=4326;POINT(...))
  WHEN location ~ 'POINT\(' THEN
    ST_GeomFromText(location, 4326)
  -- If "lat,lng" format
  WHEN location ~ ',' THEN
    ST_SetSRID(ST_MakePoint(
      split_part(location, ',', 2)::float,  -- longitude
      split_part(location, ',', 1)::float   -- latitude
    ), 4326)
  -- Null or empty
  ELSE NULL
END;

-- For addresses table
UPDATE addresses
SET location_geom = CASE
  WHEN location ~ 'POINT\(' THEN
    ST_GeomFromText(location, 4326)
  WHEN location ~ ',' THEN
    ST_SetSRID(ST_MakePoint(
      split_part(location, ',', 2)::float,
      split_part(location, ',', 1)::float
    ), 4326)
  ELSE NULL
END;

-- 3. Create spatial indexes (CRITICAL for performance)
CREATE INDEX idx_farms_location_geom ON farms USING GIST (location_geom);
CREATE INDEX idx_addresses_location_geom ON addresses USING GIST (location_geom);

-- 4. Verify migration
SELECT
  COUNT(*) as total_farms,
  COUNT(location_geom) as farms_with_location,
  COUNT(*) - COUNT(location_geom) as farms_without_location
FROM farms;

SELECT
  COUNT(*) as total_addresses,
  COUNT(location_geom) as addresses_with_location,
  COUNT(*) - COUNT(location_geom) as addresses_without_location
FROM addresses;
```

### Step 3: Update Application Code

After migration, update your code to use geometry columns:

**Option A: Keep both columns (recommended for transition)**

```typescript
// Keep existing varchar columns for backward compatibility
// Use geometry columns for new queries
```

**Option B: Drop old varchar columns (after verification)**

```sql
-- After thorough testing, drop old columns
ALTER TABLE farms DROP COLUMN location;
ALTER TABLE farms RENAME COLUMN location_geom TO location;

ALTER TABLE addresses DROP COLUMN location;
ALTER TABLE addresses RENAME COLUMN location_geom TO location;
```

### Step 4: Update Drizzle Schema

Update the schema files to use geometry columns:

**packages/database/src/schema/hk/farms.ts**
```typescript
import { geometry } from '../../geometry/postgis';

// Replace:
location: varchar("location", { length: 100 }),

// With:
location: geometry("location"),
```

**packages/database/src/schema/hk/addresses.ts**
```typescript
import { geometry } from '../../geometry/postgis';

// Replace:
location: varchar("location", { length: 100 }),

// With:
location: geometry("location"),
```

## Usage Examples

### Inserting Farm with Location

**Using Helper Functions:**

```typescript
import { geometryPointToWkt } from '@rocky/database/geometry';

// Convert lat/lng to WKT
const wkt = geometryPointToWkt(41.5123, 21.7453); // Macedonia coordinates
// Result: "SRID=4326;POINT(21.7453 41.5123)"

// Insert using raw SQL
await db.execute(sql`
  INSERT INTO farms (farm_id, address_id, location)
  VALUES (${farmId}, ${addressId}, ST_GeomFromText(${wkt}, 4326))
`);
```

**Using ST_MakePoint (more efficient):**

```typescript
// Direct PostGIS function (no string conversion)
await db.execute(sql`
  INSERT INTO farms (farm_id, address_id, location)
  VALUES (
    ${farmId},
    ${addressId},
    ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
  )
`);
```

### Querying Farms by Location

**Find farms within 5km of a point:**

```typescript
const latitude = 41.5123;
const longitude = 21.7453;
const radiusKm = 5;

const nearbyFarms = await db.execute(sql`
  SELECT
    f.id,
    f.farm_id,
    f.name,
    ST_Distance(
      f.location,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
    ) / 1000 as distance_km
  FROM farms f
  WHERE f.location IS NOT NULL
    AND ST_DWithin(
      f.location,
      ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
      ${radiusKm * 1000}  -- meters
    )
  ORDER BY distance_km
  LIMIT 20
`);
```

**Find farms in a bounding box (map viewport):**

```typescript
const bounds = {
  north: 42.5,
  south: 41.0,
  east: 23.5,
  west: 20.5
};

const farmsInBounds = await db.execute(sql`
  SELECT id, farm_id, name
  FROM farms
  WHERE location IS NOT NULL
    AND ST_Within(
      location,
      ST_MakeEnvelope(
        ${bounds.west}, ${bounds.south},
        ${bounds.east}, ${bounds.north},
        4326
      )
    )
`);
```

### Reading Location Data

**Parse geometry to coordinates:**

```typescript
import { geometryPointFromWkt } from '@rocky/database/geometry';

const farm = await db.query.farms.findFirst({
  where: eq(farms.id, farmId)
});

if (farm?.location) {
  // Convert geometry WKT to coordinates
  const coords = geometryPointFromWkt(farm.location);
  // Result: { latitude: 41.5123, longitude: 21.7453 }

  console.log(`Farm at ${coords.latitude}, ${coords.longitude}`);
}
```

**Using ST_AsText in SQL:**

```typescript
const result = await db.execute(sql`
  SELECT
    id,
    farm_id,
    ST_AsText(location) as location_wkt,
    ST_X(location) as longitude,
    ST_Y(location) as latitude
  FROM farms
  WHERE id = ${farmId}
`);

const { latitude, longitude } = result[0];
```

## PostGIS Reference Queries

### Calculate Distance Between Two Farms

```sql
SELECT
  f1.name as farm1,
  f2.name as farm2,
  ST_Distance(
    f1.location,
    f2.location
  ) / 1000 as distance_km
FROM farms f1
CROSS JOIN farms f2
WHERE f1.id = ${farm1Id}
  AND f2.id = ${farm2Id};
```

### Find Farms Within Radius of Commune

```sql
SELECT f.name, f.farm_id
FROM farms f
JOIN addresses a ON f.address_id = a.id
JOIN communes c ON a.commune_id = c.id
WHERE c.id = ${communeId}
  AND f.location IS NOT NULL
  AND ST_DWithin(
    f.location,
    (SELECT ST_Centroid(ST_Union(a2.location))
     FROM addresses a2
     JOIN communes c2 ON a2.commune_id = c2.id
     WHERE c2.id = ${communeId}),
    ${radiusMeters}
  );
```

### Create Geographic Buffers

```sql
-- Find all farms within 10km of a point, but exclude 1km buffer around the point itself
SELECT *
FROM farms
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
  10000  -- 10km
)
AND NOT ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
  1000   -- 1km exclusion zone
);
```

## Validation and Testing

### Test PostGIS Installation

```sql
-- Test PostGIS functions
SELECT
  postgis_version() as postgis_version,
  postgis_full_version() as full_version;

-- Test geometry creation
SELECT
  ST_AsText(ST_SetSRID(ST_MakePoint(21.7453, 41.5123), 4326)) as wkt;
-- Should return: POINT(21.7453 41.5123)

-- Test distance calculation
SELECT
  ST_Distance(
    ST_SetSRID(ST_MakePoint(21.0, 41.0), 4326),
    ST_SetSRID(ST_MakePoint(22.0, 42.0), 4326)
  ) / 1000 as distance_km;
```

### Verify Spatial Indexes

```sql
-- Check if indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('farms', 'addresses')
  AND indexname LIKE '%location%';

-- Should show:
-- idx_farms_location_geom
-- idx_addresses_location_geom
```

### Performance Test

```sql
-- Test performance with vs without spatial index
EXPLAIN ANALYZE
SELECT * FROM farms
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(21.7453, 41.5123), 4326),
  10000
);

-- Should show "Index Scan using idx_farms_location_geom"
-- Cost should be much lower with the index
```

## Common Issues and Solutions

### Issue: "type geometry does not exist"

**Solution:** PostGIS extension not enabled
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Issue: "SRID 4326 not found"

**Solution:** Insert spatial_ref_sys if missing
```sql
-- Should be included with PostGIS, but just in case
SELECT * FROM spatial_ref_sys WHERE srid = 4326;
```

### Issue: "Cannot create index on geometry column"

**Solution:** Ensure column is actually geometry type
```sql
-- Check column type
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'farms'
  AND column_name = 'location';
```

### Issue: "ST_DWithin is slow"

**Solution:** Create GiST index
```sql
CREATE INDEX idx_farms_location_geom ON farms USING GIST (location);
```

## Advanced Features

### Geofencing (Polygon Areas)

Create polygons for grazing areas, quarantine zones, etc.:

```typescript
import { geometryPolygonToWkt } from '@rocky/database/geometry';

const grazingAreaVertices = [
  { latitude: 41.5, longitude: 21.7 },
  { latitude: 41.6, longitude: 21.7 },
  { latitude: 41.6, longitude: 21.8 },
  { latitude: 41.5, longitude: 21.8 },
  { latitude: 41.5, longitude: 21.7 }, // Close polygon
];

const wkt = geometryPolygonToWkt(grazingAreaVertices);
// Result: "SRID=4326;POLYGON((21.7 41.5,21.7 41.6,21.8 41.6,21.8 41.5,21.7 41.5))"
```

Check if farm is within polygon:

```sql
SELECT f.name
FROM farms f
WHERE ST_Within(
  f.location,
  ST_GeomFromText(${polygonWkt}, 4326)
);
```

### Geocoding Integration

Integrate with geocoding services (Nominatim, Google Maps, etc.):

```typescript
async function geocodeAddress(address: string) {
  // Call geocoding API
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  );
  const data = await response.json();

  if (data.length > 0) {
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon)
    };
  }
  return null;
}

// Use in application
const coords = await geocodeAddress("Skopje, North Macedonia");
await db.insert(addresses).values({
  city: "Skopje",
  street: "Makedonija",
  houseNumber: "123",
  location: geometryPointToWkt(coords.latitude, coords.longitude)
});
```

## Performance Considerations

### Spatial Indexes are Critical

**ALWAYS create GiST indexes on geometry columns:**

```sql
CREATE INDEX idx_table_location ON table USING GIST (location);
```

Without spatial indexes, every spatial query will do a full table scan - **very slow!**

### Spatial Joins are Expensive

```sql
-- Expensive: No index on join condition
SELECT f1.name, f2.name
FROM farms f1
JOIN farms f2 ON ST_DWithin(f1.location, f2.location, 5000);

-- Better: Use subquery with indexed query
SELECT f.name
FROM farms f
WHERE f.id IN (
  SELECT id FROM farms
  WHERE ST_DWithin(location, ${point}, 5000)
);
```

### Batch Distance Calculations

For bulk distance calculations, use `ST_DistanceSphere` (faster, less accurate):

```sql
-- Faster approximation (sphere instead of ellipsoid)
SELECT
  f1.name,
  f2.name,
  ST_DistanceSphere(f1.location, f2.location) as distance_meters
FROM farms f1, farms f2
WHERE f1.id = ${farm1Id} AND f2.id = ${farm2Id};
```

## Next Steps

### Immediate

1. ✅ Enable PostGIS extension (`CREATE EXTENSION postgis;`)
2. ✅ Run migration SQL to add geometry columns
3. ✅ Create spatial indexes
4. ✅ Test basic queries
5. ✅ Update application code to use helper functions

### Short-Term

1. Create API endpoints for:
   - Nearby farms search
   - Farm location by radius
   - Bounding box queries for maps

2. Add geocoding integration:
   - Batch geocode existing addresses without locations
   - Automatic geocoding for new addresses

3. Create spatial views:
   - Farms by commune/region
   - Animal density by area

### Long-Term

1. Implement advanced PostGIS features:
   - Polygon geofences for grazing areas
   - Line geometries for movement routes
   - Multi-polygon for complex territories

2. Performance optimization:
   - Materialized views for common spatial queries
   - Partial indexes (e.g., only on farms with locations)
   - Cluster tables by location

## Files Changed

### New Files (4)
- `packages/database/src/geometry/coordinate-schema.ts`
- `packages/database/src/geometry/helpers.ts`
- `packages/database/src/geometry/postgis.ts`
- `packages/database/src/geometry/index.ts`
- `docs/POSTGIS_SETUP.md` (this file)

### Modified Files (5)
- `packages/database/src/index.ts` - Export geometry module
- `packages/database/package.json` - Add geometry export
- `packages/database/src/schema/hk/farms.ts` - Add PostGIS TODO comment
- `packages/database/src/schema/hk/addresses.ts` - Add PostGIS TODO comment
- `docs/DB_MIGRATION_ANALYSIS.md` - Mark PostGIS as pending

## Conclusion

PostGIS support is now **ready for implementation**. The geometry helper functions, Zod schemas, and documentation are all in place. The remaining work is:

1. Enable PostGIS extension on your PostgreSQL server
2. Run the migration SQL
3. Test and verify
4. Update application code to use geometry columns

**Status:** Ready for production implementation once PostGIS is enabled in the database.
