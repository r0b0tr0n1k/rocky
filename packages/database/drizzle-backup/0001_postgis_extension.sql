-- ── Enable PostGIS Extension ──
-- PostGIS adds support for geographic objects to the PostgreSQL database
-- This enables storing, indexing, and querying geospatial data

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify installation
-- SELECT postgis_version();
-- Expected output: "3.x.x"
