-- Fix schema/migration drift: geofences.polygon was created as geometry(point,4326)
-- but the schema (polygonGeometry, postgis.ts) declares type:"polygon".
-- A Point column can never store a geofence polygon, so no geofence ever rendered
-- on the admin map. Correct the column to geometry(Polygon,4326).
-- geometry(Point,4326) -> geometry(Polygon,4326) is a binary-coercible cast; the
-- table currently holds no rows, so no per-row conversion is required.
ALTER TABLE "geofences"
  ALTER COLUMN "polygon" TYPE geometry(Polygon,4326);
