CREATE OR REPLACE FUNCTION public.farm_org_id(p_farm_id uuid)
  RETURNS uuid
  LANGUAGE sql
  SECURITY DEFINER
  AS $function$
    SELECT oa.organization_id
    FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE f.id = p_farm_id
  $function$;

CREATE TYPE "control_measures" AS ENUM('stamping_out', 'control_programme', 'surveillance');--> statement-breakpoint
CREATE TYPE "disease_category" AS ENUM('category_a', 'category_b', 'category_c', 'category_d', 'category_e');--> statement-breakpoint
CREATE TYPE "sample_status" AS ENUM('sample_collected', 'in_transit', 'processing', 'completed');--> statement-breakpoint
CREATE TYPE "sanitary_decision" AS ENUM('passed', 'condemned', 'partial_condemnation');--> statement-breakpoint
CREATE TABLE "sanitary_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"movement_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"inspector_subject_id" uuid NOT NULL,
	"ante_mortem_decision" "sanitary_decision",
	"post_mortem_decision" "sanitary_decision",
	"ante_mortem_at" timestamp,
	"post_mortem_at" timestamp,
	"condemnation_reason" text,
	"disposition" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "sanitary_inspections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "diseases" ADD COLUMN "disease_category" "disease_category" NOT NULL;--> statement-breakpoint
ALTER TABLE "diseases" ADD COLUMN "woah_code" varchar(50);--> statement-breakpoint
ALTER TABLE "diseases" ADD COLUMN "eu_annex_ref" varchar(50);--> statement-breakpoint
ALTER TABLE "diseases" ADD COLUMN "control_measures" "control_measures";--> statement-breakpoint
ALTER TABLE "lab_tests" ADD COLUMN "sample_status" "sample_status" DEFAULT 'completed'::"sample_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "diseases" ADD CONSTRAINT "diseases_woah_code_key" UNIQUE("woah_code");--> statement-breakpoint
CREATE INDEX "idx_sanitary_movement" ON "sanitary_inspections" ("movement_id");--> statement-breakpoint
CREATE INDEX "idx_sanitary_farm" ON "sanitary_inspections" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_sanitary_inspector" ON "sanitary_inspections" ("inspector_subject_id");--> statement-breakpoint
CREATE INDEX "idx_diseases_category" ON "diseases" ("disease_category");--> statement-breakpoint
CREATE INDEX "idx_diseases_woah" ON "diseases" ("woah_code");--> statement-breakpoint
CREATE INDEX "idx_lab_tests_sample_status" ON "lab_tests" ("sample_status");--> statement-breakpoint
ALTER TABLE "sanitary_inspections" ADD CONSTRAINT "sanitary_inspections_movement_id_movements_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "movements"("id");--> statement-breakpoint
ALTER TABLE "sanitary_inspections" ADD CONSTRAINT "sanitary_inspections_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "sanitary_inspections" ADD CONSTRAINT "sanitary_inspections_inspector_subject_id_subjects_id_fkey" FOREIGN KEY ("inspector_subject_id") REFERENCES "subjects"("id");--> statement-breakpoint
CREATE POLICY "sanitary_inspection_access_policy" ON "sanitary_inspections" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN'])
            AND farm_org_id("sanitary_inspections"."farm_id") = current_setting('app.current_org_id', true)::uuid)
      ));