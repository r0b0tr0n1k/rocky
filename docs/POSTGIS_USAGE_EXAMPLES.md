# PostGIS Usage Examples

This guide provides practical examples for working with PostGIS geometry columns in your application.

## Configuration

**SRID:** 4326 (WGS84 - Standard GPS coordinate system)
**Mode:** `xy` (Drizzle ORM)

## Inserting Locations

### Option 1: Using Drizzle ORM (Recommended)

```typescript
import { db } from '@rocky/database';
import { farms } from '@rocky/database/schema/hk';
import { sql } from 'drizzle-orm';

// Using xy mode (x=longitude, y=latitude)
await db.insert(farms).values({
  farmId: 'MK12345678',
  addressId: 'some-uuid',
  name: 'My Farm',
  type: 'FARM',
  location: {
    x: 21.7453,  // longitude
    y: 41.5123,  // latitude
  },
});
```

### Option 2: Using Raw SQL

```typescript
await db.execute(sql`
  INSERT INTO farms (farm_id, address_id, name, location)
  VALUES (
    ${farmId},
    ${addressId},
    ${name},
    ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
  )
`);
```

## Querying Locations

### Find Farms Within Radius

```typescript
const latitude = 41.5123;
const longitude = 21.7453;
const radiusKm = 10;

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
      ${radiusKm * 1000}
    )
  ORDER BY distance_km
  LIMIT 20
`);
```

### Find Nearest Farm

```typescript
const point = {
  x: 21.7453, // longitude
  y: 41.5123, // latitude
};

const sqlPoint = sql`ST_SetSRID(ST_MakePoint(${point.x}, ${point.y}), 4326)`;

const nearestFarm = await db.execute(sql`
  SELECT
    f.id,
    f.farm_id,
    f.name,
    ST_Distance(f.location, ${sqlPoint}) / 1000 as distance_km
  FROM farms f
  WHERE f.location IS NOT NULL
  ORDER BY f.location <-> ${sqlPoint}
  LIMIT 1
`);
```

### Find Farms in Bounding Box (Map Viewport)

```typescript
const bounds = {
  north: 42.5,
  south: 41.0,
  east: 23.5,
  west: 20.5,
};

const farmsInBounds = await db.execute(sql`
  SELECT
    id,
    farm_id,
    name,
    ST_X(location) as longitude,
    ST_Y(location) as latitude
  FROM farms
  WHERE location IS NOT NULL
    AND ST_Within(
      location,
      ST_MakeEnvelope(
        ${bounds.west},
        ${bounds.south},
        ${bounds.east},
        ${bounds.north},
        4326
      )
    )
`);
```

### Calculate Distance Between Two Farms

```typescript
const farm1Id = 'uuid-1';
const farm2Id = 'uuid-2';

const distance = await db.execute(sql`
  SELECT
    ST_Distance(f1.location, f2.location) / 1000 as distance_km
  FROM farms f1, farms f2
  WHERE f1.id = ${farm1Id} AND f2.id = ${farm2Id}
`);
```

## Updating Locations

```typescript
await db.execute(sql`
  UPDATE farms
  SET location = ST_SetSRID(ST_MakePoint(${newLongitude}, ${newLatitude}), 4326)
  WHERE id = ${farmId}
`);
```

## Reading Geometry Data

### Option 1: Using Drizzle ORM (xy mode)

```typescript
const farm = await db.query.farms.findFirst({
  where: eq(farms.id, farmId),
});

if (farm?.location) {
  // location is { x: number, y: number }
  console.log(`Farm at ${farm.location.y}, ${farm.location.x}`);
}
```

### Option 2: Using Raw SQL

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

## Helper Functions

The `@rocky/database/geometry` module provides helper functions:

```typescript
import {
  geometryPointToWkt,
  geometryPointFromWkt,
} from '@rocky/database/geometry';

// Convert to WKT format
const wkt = geometryPointToWkt(41.5123, 21.7453);
// Result: "POINT(21.7453 41.5123)"

// Parse from WKT format
const coords = geometryPointFromWkt('POINT(21.7453 41.5123)');
// Result: { latitude: 41.5123, longitude: 21.7453 }
```

## Common PostGIS Functions

### ST_Distance - Calculate distance

```sql
ST_Distance(geom1, geom2) -- Returns distance in meters (for geography)
ST_Distance(geom1, geom2) / 1000 -- Convert to kilometers
```

### ST_DWithin - Check if within radius

```sql
ST_DWithin(location, point, radius_meters)
-- Returns TRUE if location is within radius meters of point
```

### ST_MakePoint - Create point geometry

```sql
ST_MakePoint(longitude, latitude) -- Creates point without SRID
ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) -- With SRID
```

### ST_Within - Check if inside polygon

```sql
ST_Within(point, polygon)
-- Returns TRUE if point is inside polygon
```

### ST_MakeEnvelope - Create bounding box

```sql
ST_MakeEnvelope(west, south, east, north, srid)
-- Creates rectangular polygon
```

### <-> - Nearest neighbor operator

```sql
ORDER BY location <-> point
-- Fast ordering by distance (uses index)
```

## Performance Tips

1. **Always create GiST indexes on geometry columns**
   ```sql
   CREATE INDEX idx_location ON farms USING GIST (location);
   ```

2. **Use ST_DWithin instead of ST_Distance in WHERE clauses**
   ```sql
   -- Good: Uses index
   WHERE ST_DWithin(location, point, 1000)

   -- Bad: Full table scan
   WHERE ST_Distance(location, point) < 1000
   ```

3. **Use <-> for ordering by distance**
   ```sql
   -- Good: Uses KNN index
   ORDER BY location <-> point

   -- Slower: Calculates distance for all rows
   ORDER BY ST_Distance(location, point)
   ```

4. **Consider materialized views for complex queries**
   ```sql
   CREATE MATERIALIZED VIEW nearby_farms AS
   SELECT ...
   ```

## Testing

### Test PostGIS is working

```typescript
const result = await db.execute(sql`
  SELECT
    postgis_version() as version,
    ST_AsText(ST_SetSRID(ST_MakePoint(21.7453, 41.5123), 4326)) as test_point
`);

console.log('PostGIS version:', result[0].version);
console.log('Test point:', result[0].test_point);
// Expected: POINT(21.7453 41.5123)
```

## Coordinate System Notes

**SRID 4326 (WGS84):**
- Standard GPS coordinate system
- Units: degrees
- Used by most GPS devices and mapping APIs
- Lat/Lng order: (latitude, y) for most APIs, (longitude, x) for PostGIS

**Important:** PostGIS uses (longitude, latitude) order:
- `ST_MakePoint(longitude, latitude)` - x is longitude, y is latitude
- When storing: `{ x: lng, y: lat }`
- When reading: `location.x` is longitude, `location.y` is latitude

## Integration with Maps

### Leaflet.js Example

```typescript
// Fetch farms in bounds
const bounds = map.getBounds();
const farms = await db.execute(sql`
  SELECT
    id,
    farm_id,
    name,
    ST_X(location) as lng,
    ST_Y(location) as lat
  FROM farms
  WHERE location IS NOT NULL
    AND ST_Within(
      location,
      ST_MakeEnvelope(${bounds.getWest()}, ${bounds.getSouth()},
                      ${bounds.getEast()}, ${bounds.getNorth()}, 4326)
    )
`);

// Display on map
farms.forEach(farm => {
  L.marker([farm.lat, farm.lng])
   .addTo(map)
   .bindPopup(farm.name);
});
```

### Google Maps API Example

```typescript
// Calculate distance from user location
const userLocation = { lat: 41.5123, lng: 21.7453 };

const nearbyFarms = await db.execute(sql`
  SELECT
    id,
    farm_id,
    name,
    ST_X(location) as lng,
    ST_Y(location) as lat,
    ST_Distance(
      location,
      ST_SetSRID(ST_MakePoint(${userLocation.lng}, ${userLocation.lat}), 4326)
    ) / 1000 as distance_km
  FROM farms
  WHERE location IS NOT NULL
    AND ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(${userLocation.lng}, ${userLocation.lat}), 4326),
      50000 -- 50km radius
    )
  ORDER BY distance_km
  LIMIT 20
`);
```

## Troubleshooting

### "type geometry does not exist"

PostGIS extension is not enabled. Run:
```bash
psql -d rocky_db -f packages/database/drizzle/0001_postgis_extension.sql
```

### "function st_makepoint does not exist"

PostGIS extension is not enabled. See above.

### Spatial queries are slow

Check if GiST index exists:
```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'farms' AND indexname LIKE '%location%';
```

Should show: `idx_farms_location_gist`

### Distance seems wrong

Make sure you're using the correct SRID (4326) and coordinate order (longitude, latitude).
