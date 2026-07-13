-- ADR-0095 — AHL disease master data + disease-event procedures
-- Idempotent migration (push-synced DB: applied via psql). No $N RLS placeholders.

BEGIN;

-- 1. Enums (idempotent) ----------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "species_rank" AS ENUM ('class','order','family','genus','species','group');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "applicability_role" AS ENUM ('host','vector');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "disease_event_status" AS ENUM ('suspicion','confirmed','contained','resolved','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "procedure_status" AS ENUM ('planned','in_progress','done','waived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "procedure_type" AS ENUM
    ('notification','sampling','laboratory_test','tracing','restriction_zone',
     'surveillance_zone','culling','stamping_out','disinfection','movement_control',
     'vaccination','treatment','quarantine','compensation','repopulation',
     'public_information','reporting_authority','derogation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Extend diseases with listed-disease + multi-category columns ----------
ALTER TABLE "diseases" ADD COLUMN IF NOT EXISTS
  "disease_categories" "disease_category"[] NOT NULL DEFAULT '{}'::"disease_category"[];
ALTER TABLE "diseases" ADD COLUMN IF NOT EXISTS
  "listed_disease" boolean NOT NULL DEFAULT true;
ALTER TABLE "diseases" ADD COLUMN IF NOT EXISTS
  "legal_basis" varchar(120);

-- 3. species_groups (reference) -------------------------------------------
CREATE TABLE IF NOT EXISTS "species_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(60) NOT NULL UNIQUE,
  "scientific_name" varchar(160),
  "common_name" varchar(120),
  "rank" "species_rank" NOT NULL,
  "parent_code" varchar(60),
  "maps_to_species" "species",
  "is_vector" boolean NOT NULL DEFAULT false,
  "eu_annex_ref" varchar(50),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "created_by" uuid,
  "updated_at" timestamp,
  "valid_to" timestamp
);
CREATE INDEX IF NOT EXISTS "idx_species_groups_rank" ON "species_groups" ("rank");
CREATE INDEX IF NOT EXISTS "idx_species_groups_vector" ON "species_groups" ("is_vector");
CREATE INDEX IF NOT EXISTS "idx_species_groups_parent" ON "species_groups" ("parent_code");
DROP POLICY IF EXISTS "species_group_access_policy" ON "species_groups";
CREATE POLICY "species_group_access_policy" ON "species_groups" AS PERMISSIVE FOR ALL TO public
  USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN','VD_ADMIN','VD_STAFF']))
  WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN','VD_ADMIN','VD_STAFF']));

-- 4. disease_species_applicability (the 1882 matrix) ----------------------
CREATE TABLE IF NOT EXISTS "disease_species_applicability" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "disease_id" uuid NOT NULL REFERENCES "diseases" ("id"),
  "species_group_id" uuid NOT NULL REFERENCES "species_groups" ("id"),
  "role" "applicability_role" NOT NULL,
  "categories" "disease_category"[] NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "created_by" uuid,
  "updated_at" timestamp,
  "valid_to" timestamp,
  UNIQUE ("disease_id","species_group_id","role")
);
CREATE INDEX IF NOT EXISTS "idx_dsa_disease" ON "disease_species_applicability" ("disease_id");
CREATE INDEX IF NOT EXISTS "idx_dsa_species" ON "disease_species_applicability" ("species_group_id");
CREATE INDEX IF NOT EXISTS "idx_dsa_role" ON "disease_species_applicability" ("role");
DROP POLICY IF EXISTS "dsa_access_policy" ON "disease_species_applicability";
CREATE POLICY "dsa_access_policy" ON "disease_species_applicability" AS PERMISSIVE FOR ALL TO public
  USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN','VD_ADMIN','VD_STAFF']))
  WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN','VD_ADMIN','VD_STAFF']));

-- 5. disease_events (operational outbreak instance) -----------------------
CREATE TABLE IF NOT EXISTS "disease_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "disease_id" uuid NOT NULL REFERENCES "diseases" ("id"),
  "farm_id" uuid,
  "detected_category" "disease_category" NOT NULL,
  "status" "disease_event_status" NOT NULL DEFAULT 'suspicion',
  "suspected_at" timestamp,
  "confirmed_at" timestamp,
  "resolved_at" timestamp,
  "disease_zone_id" uuid,
  "competent_authority" varchar(120),
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "created_by" uuid,
  "updated_at" timestamp
);
CREATE INDEX IF NOT EXISTS "idx_disease_events_disease" ON "disease_events" ("disease_id");
CREATE INDEX IF NOT EXISTS "idx_disease_events_status" ON "disease_events" ("status");
CREATE INDEX IF NOT EXISTS "idx_disease_events_farm" ON "disease_events" ("farm_id");
DROP POLICY IF EXISTS "disease_event_access_policy" ON "disease_events";
CREATE POLICY "disease_event_access_policy" ON "disease_events" AS PERMISSIVE FOR ALL TO public
  USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN','VD_ADMIN','VD_STAFF']))
  WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN','VD_ADMIN','VD_STAFF']));

-- 6. disease_event_procedures (2020/687 step log) -------------------------
CREATE TABLE IF NOT EXISTS "disease_event_procedures" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_id" uuid NOT NULL REFERENCES "disease_events" ("id"),
  "procedure_type" "procedure_type" NOT NULL,
  "status" "procedure_status" NOT NULL DEFAULT 'planned',
  "performed_at" timestamp,
  "performed_by" uuid,
  "outcome" text,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "created_by" uuid,
  "updated_at" timestamp
);
CREATE INDEX IF NOT EXISTS "idx_dep_event" ON "disease_event_procedures" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_dep_type" ON "disease_event_procedures" ("procedure_type");
CREATE INDEX IF NOT EXISTS "idx_dep_status" ON "disease_event_procedures" ("status");
DROP POLICY IF EXISTS "disease_event_procedure_access_policy" ON "disease_event_procedures";
CREATE POLICY "disease_event_procedure_access_policy" ON "disease_event_procedures" AS PERMISSIVE FOR ALL TO public
  USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN','VD_ADMIN','VD_STAFF']))
  WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN','VD_ADMIN','VD_STAFF']));

-- 7. Enable RLS on new tables --------------------------------------------
ALTER TABLE "species_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "disease_species_applicability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "disease_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "disease_event_procedures" ENABLE ROW LEVEL SECURITY;

COMMIT;
