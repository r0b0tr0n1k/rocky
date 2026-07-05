CREATE TYPE "administration_route" AS ENUM('intramuscular', 'subcutaneous', 'intranasal', 'oral', 'topical', 'other');--> statement-breakpoint
CREATE TYPE "vaccine_type" AS ENUM('live', 'inactivated', 'toxoid', 'recombinant', 'other');--> statement-breakpoint
CREATE TABLE "diseases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL UNIQUE,
	"notifiable" boolean DEFAULT false NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "diseases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "treatments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"animal_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"disease_id" uuid,
	"vet_id" uuid NOT NULL,
	"diagnosis_date" date NOT NULL,
	"treatment_desc" text,
	"isolated" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "treatments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vaccinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"animal_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"vaccine_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"vet_id" uuid NOT NULL,
	"admin_date" date NOT NULL,
	"route" "administration_route" NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "vaccinations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vaccine_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vaccine_id" uuid NOT NULL,
	"batch_no" varchar(50) NOT NULL,
	"production_date" date,
	"expiry_date" date NOT NULL,
	"quantity_received" integer NOT NULL,
	"quantity_remaining" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "vaccine_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vaccines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL UNIQUE,
	"manufacturer" varchar(100),
	"type" "vaccine_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "vaccines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_diseases_notifiable" ON "diseases" ("notifiable");--> statement-breakpoint
CREATE INDEX "idx_treatments_animal" ON "treatments" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_treatments_farm" ON "treatments" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_treatments_disease" ON "treatments" ("disease_id");--> statement-breakpoint
CREATE INDEX "idx_treatments_vet" ON "treatments" ("vet_id");--> statement-breakpoint
CREATE INDEX "idx_treatments_date" ON "treatments" ("diagnosis_date");--> statement-breakpoint
CREATE INDEX "idx_vaccinations_animal" ON "vaccinations" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_vaccinations_farm" ON "vaccinations" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_vaccinations_vaccine" ON "vaccinations" ("vaccine_id");--> statement-breakpoint
CREATE INDEX "idx_vaccinations_batch" ON "vaccinations" ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_vaccinations_vet" ON "vaccinations" ("vet_id");--> statement-breakpoint
CREATE INDEX "idx_vaccinations_date" ON "vaccinations" ("admin_date");--> statement-breakpoint
CREATE INDEX "idx_vaccine_batches_vaccine" ON "vaccine_batches" ("vaccine_id");--> statement-breakpoint
CREATE INDEX "idx_vaccine_batches_expiry" ON "vaccine_batches" ("expiry_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_vaccine_batches_no" ON "vaccine_batches" ("vaccine_id","batch_no");--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_disease_id_diseases_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id");--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_vaccine_id_vaccines_id_fkey" FOREIGN KEY ("vaccine_id") REFERENCES "vaccines"("id");--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_batch_id_vaccine_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "vaccine_batches"("id");--> statement-breakpoint
ALTER TABLE "vaccine_batches" ADD CONSTRAINT "vaccine_batches_vaccine_id_vaccines_id_fkey" FOREIGN KEY ("vaccine_id") REFERENCES "vaccines"("id");--> statement-breakpoint
CREATE POLICY "disease_access_policy" ON "diseases" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(($1, $2, $3))) WITH CHECK (current_setting('app.current_role', true) = ANY(($1, $2, $3)));--> statement-breakpoint
CREATE POLICY "treatment_access_policy" ON "treatments" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(($1, $2, $3))
    OR (current_setting('app.current_role', true) = ANY(($4, $5)) AND "treatments"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
    OR (current_setting('app.current_role', true) = ANY(($6, $7, $8, $9)) AND "treatments"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(($1, $2, $3, $4, $5)));--> statement-breakpoint
CREATE POLICY "vaccination_access_policy" ON "vaccinations" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(($1, $2, $3))
    OR (current_setting('app.current_role', true) = ANY(($4, $5)) AND "vaccinations"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
    OR (current_setting('app.current_role', true) = ANY(($6, $7, $8, $9)) AND "vaccinations"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(($1, $2, $3, $4, $5)));--> statement-breakpoint
CREATE POLICY "vaccine_batch_access_policy" ON "vaccine_batches" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(($1, $2, $3))) WITH CHECK (current_setting('app.current_role', true) = ANY(($1, $2, $3)));--> statement-breakpoint
CREATE POLICY "vaccine_access_policy" ON "vaccines" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(($1, $2, $3))) WITH CHECK (current_setting('app.current_role', true) = ANY(($1, $2, $3)));