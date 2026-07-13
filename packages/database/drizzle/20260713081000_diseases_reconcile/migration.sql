-- Reconcile `diseases` to the Drizzle schema (pre-existing push-sync drift).
-- The schema declares woah_code / eu_annex_ref / control_measures; the
-- push-synced DB lacked them, so seeding failed (42703 undefined_column).
-- Idempotent; safe to re-run.

DO $$ BEGIN
  CREATE TYPE "control_measures" AS ENUM ('stamping_out','control_programme','surveillance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "diseases" ADD COLUMN IF NOT EXISTS "woah_code" varchar(50);
ALTER TABLE "diseases" ADD COLUMN IF NOT EXISTS "eu_annex_ref" varchar(50);
ALTER TABLE "diseases" ADD COLUMN IF NOT EXISTS "control_measures" "control_measures";

CREATE UNIQUE INDEX IF NOT EXISTS "idx_diseases_woah" ON "diseases" ("woah_code");
