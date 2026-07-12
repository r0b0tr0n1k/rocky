-- Ensures required extensions exist in the custom POSTGRES_DB (tbot).
-- The postgis/postgis image enables these in the default DB, but not
-- always in a named database created via POSTGRES_DB. Idempotent.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
