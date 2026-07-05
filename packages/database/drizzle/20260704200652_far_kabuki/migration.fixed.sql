CREATE TYPE "test_result" AS ENUM('positive', 'negative', 'inconclusive', 'quantitative');--> statement-breakpoint
CREATE TYPE "test_type" AS ENUM('serology', 'pcr', 'culture', 'elisa', 'necropsy', 'other');--> statement-breakpoint
CREATE TABLE "lab_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"animal_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"disease_id" uuid NOT NULL,
	"test_type" "test_type" NOT NULL,
	"test_method" varchar(100),
	"result" "test_result" NOT NULL,
	"result_numeric" numeric(10,3),
	"result_unit" varchar(20),
	"interpretation" text,
	"lab_name" varchar(200),
	"lab_sample_id" varchar(50),
	"sample_date" date NOT NULL,
	"result_date" date NOT NULL,
	"certificate_ref" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "lab_tests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vaccine_diseases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vaccine_id" uuid NOT NULL,
	"disease_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "vaccine_diseases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_lab_tests_animal" ON "lab_tests" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_lab_tests_farm" ON "lab_tests" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_lab_tests_disease" ON "lab_tests" ("disease_id");--> statement-breakpoint
CREATE INDEX "idx_lab_tests_type" ON "lab_tests" ("test_type");--> statement-breakpoint
CREATE INDEX "idx_lab_tests_date" ON "lab_tests" ("result_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_vaccine_diseases_pair" ON "vaccine_diseases" ("vaccine_id","disease_id");--> statement-breakpoint
CREATE INDEX "idx_vaccine_diseases_vaccine" ON "vaccine_diseases" ("vaccine_id");--> statement-breakpoint
CREATE INDEX "idx_vaccine_diseases_disease" ON "vaccine_diseases" ("disease_id");--> statement-breakpoint
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_disease_id_diseases_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id");--> statement-breakpoint
ALTER TABLE "vaccine_diseases" ADD CONSTRAINT "vaccine_diseases_vaccine_id_vaccines_id_fkey" FOREIGN KEY ("vaccine_id") REFERENCES "vaccines"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vaccine_diseases" ADD CONSTRAINT "vaccine_diseases_disease_id_diseases_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE POLICY "lab_test_access_policy" ON "lab_tests" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND "lab_tests"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP', 'SUPPLIER']) AND "lab_tests"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN', 'TECHNICIAN']));--> statement-breakpoint
CREATE POLICY "vaccine_disease_access_policy" ON "vaccine_diseases" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));