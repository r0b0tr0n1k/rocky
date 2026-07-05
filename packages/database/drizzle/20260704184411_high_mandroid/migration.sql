CREATE TYPE "archive_document_type" AS ENUM('passport', 'census_form', 'tagging_receipt', 'order_form', 'inspection_form', 'slaughter_list', 'correspondence', 'other');--> statement-breakpoint
CREATE TYPE "archive_location" AS ENUM('cpc', 'vs', 'vi', 'bip');--> statement-breakpoint
CREATE TYPE "correction_case_type" AS ENUM('technician_resolvable', 'requires_clarification', 'complex');--> statement-breakpoint
CREATE TYPE "correction_status" AS ENUM('pending', 'under_review', 'resolved', 'escalated', 'rejected');--> statement-breakpoint
CREATE TYPE "import_export_status" AS ENUM('pending', 'in_transit', 'quarantine', 'registered', 'completed');--> statement-breakpoint
CREATE TYPE "import_type" AS ENUM('eu', 'third_country');--> statement-breakpoint
CREATE TYPE "inspection_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "passport_status" AS ENUM('issued', 'active', 'seized', 'archived');--> statement-breakpoint
CREATE TYPE "reprint_reason" AS ENUM('consumed', 'lost', 'damaged');--> statement-breakpoint
CREATE TYPE "reprint_status" AS ENUM('requested', 'processing', 'shipped', 'delivered');--> statement-breakpoint
CREATE TYPE "takeover_status" AS ENUM('COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "archive_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"document_type" "archive_document_type" NOT NULL,
	"document_ref" varchar(100),
	"archive_location" "archive_location" DEFAULT 'cpc'::"archive_location" NOT NULL,
	"physical_location" varchar(200),
	"animal_id" uuid,
	"farm_id" uuid,
	"passport_id" uuid,
	"inspection_id" uuid,
	"retention_expiry" date NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"destroyed_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "archive_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "cattle_passports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"passport_number" varchar(20) NOT NULL UNIQUE,
	"state_code" "state_code" DEFAULT 'MK'::"state_code" NOT NULL,
	"animal_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"status" "passport_status" DEFAULT 'issued'::"passport_status" NOT NULL,
	"issue_date" date DEFAULT now() NOT NULL,
	"seize_date" date,
	"archive_date" date,
	"death_date" date,
	"death_cause" "death_cause",
	"country_of_origin" varchar(3),
	"foreign_passport_number" varchar(50),
	"shipped_to_vs" boolean DEFAULT false NOT NULL,
	"shipped_at" timestamp,
	"delivered_to_keeper" boolean DEFAULT false NOT NULL,
	"delivered_at" timestamp,
	"is_reprint" boolean DEFAULT false NOT NULL,
	"original_passport_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "cattle_passports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ear_tag_takeovers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"supplier_organization_id" uuid NOT NULL,
	"status" "takeover_status" DEFAULT 'COMPLETED'::"takeover_status" NOT NULL,
	"total_tags_collected" integer NOT NULL,
	"exported_file_name" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "ear_tag_takeovers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "error_corrections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"detection_source" varchar(50) NOT NULL,
	"farm_id" uuid,
	"animal_id" uuid,
	"error_type" varchar(100) NOT NULL,
	"error_description" text NOT NULL,
	"original_data" jsonb,
	"corrected_data" jsonb,
	"status" "correction_status" DEFAULT 'pending'::"correction_status" NOT NULL,
	"case_type" "correction_case_type",
	"resolution_notes" text,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"archive_number" varchar(50),
	"passport_reprint_required" boolean DEFAULT false NOT NULL,
	"passport_id" uuid,
	"escalated_to" uuid,
	"escalated_at" timestamp,
	"escalation_reason" text,
	"assigned_to_vs" uuid,
	"assigned_at" timestamp,
	"vs_resolution_attempted" boolean DEFAULT false NOT NULL,
	"tech_code" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "error_corrections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "form_reprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"farm_id" uuid NOT NULL,
	"document_type" varchar(100) NOT NULL,
	"original_document_ref" varchar(100),
	"reason" "reprint_reason" NOT NULL,
	"notes" text,
	"status" "reprint_status" DEFAULT 'requested'::"reprint_status" NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"shipped_to_vs" boolean DEFAULT false NOT NULL,
	"delivered_to_keeper" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "form_reprints" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "import_export_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"direction" varchar(10) NOT NULL,
	"animal_id" uuid NOT NULL,
	"from_farm_id" uuid,
	"to_farm_id" uuid,
	"import_type" "import_type",
	"country_of_origin" varchar(3) NOT NULL,
	"destination_country" varchar(3),
	"foreign_passport_number" varchar(50),
	"national_passport_id" uuid,
	"foreign_passport_stored" boolean DEFAULT false NOT NULL,
	"foreign_passport_storage_expiry" date,
	"bip_id" uuid,
	"bip_entry_date" date,
	"bip_exit_date" date,
	"quarantine_stable_id" uuid,
	"quarantine_entry_date" date,
	"quarantine_exit_date" date,
	"retagged" boolean DEFAULT false NOT NULL,
	"retagged_at" timestamp,
	"new_ear_tag_number" varchar(8),
	"status" "import_export_status" DEFAULT 'pending'::"import_export_status" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "import_export_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"farm_id" uuid NOT NULL,
	"inspector_id" uuid NOT NULL,
	"status" "inspection_status" DEFAULT 'scheduled'::"inspection_status" NOT NULL,
	"scheduled_date" date,
	"inspection_date" date,
	"risk_score" varchar(20),
	"risk_criteria" text,
	"selected_by_risk_analysis" boolean DEFAULT false NOT NULL,
	"result" varchar(50),
	"notes" text,
	"discrepancies_found" boolean DEFAULT false NOT NULL,
	"checked_animals" jsonb,
	"form_printed" boolean DEFAULT false NOT NULL,
	"form_returned" boolean DEFAULT false NOT NULL,
	"keeper_signed" boolean DEFAULT false NOT NULL,
	"signed_at" timestamp,
	"stored_at_vi" boolean DEFAULT false NOT NULL,
	"retention_expiry" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "inspections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "data_source" "data_source" DEFAULT 'aimcs'::"data_source" NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_units" ADD COLUMN "data_source" "data_source" DEFAULT 'aimcs'::"data_source" NOT NULL;--> statement-breakpoint
ALTER TABLE "communes" ADD COLUMN "data_source" "data_source" DEFAULT 'aimcs'::"data_source" NOT NULL;--> statement-breakpoint
ALTER TABLE "states" ADD COLUMN "data_source" "data_source" DEFAULT 'aimcs'::"data_source" NOT NULL;--> statement-breakpoint
ALTER TABLE "zip_codes" ADD COLUMN "data_source" "data_source" DEFAULT 'aimcs'::"data_source" NOT NULL;--> statement-breakpoint
ALTER TABLE "farm_subjects" ADD COLUMN "data_source" "data_source" DEFAULT 'aimcs'::"data_source" NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "parent_subject_id" uuid;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "data_source" "data_source" DEFAULT 'aimcs'::"data_source" NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_errors" ADD COLUMN "zip_code_id" uuid;--> statement-breakpoint
ALTER TABLE "sync_errors" ADD CONSTRAINT "sync_errors_legacy_id_key" UNIQUE("legacy_id");--> statement-breakpoint
CREATE INDEX "idx_archive_documents_type" ON "archive_documents" ("document_type");--> statement-breakpoint
CREATE INDEX "idx_archive_documents_location" ON "archive_documents" ("archive_location");--> statement-breakpoint
CREATE INDEX "idx_archive_documents_farm" ON "archive_documents" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_archive_documents_animal" ON "archive_documents" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_archive_documents_expiry" ON "archive_documents" ("retention_expiry");--> statement-breakpoint
CREATE INDEX "idx_cattle_passports_animal" ON "cattle_passports" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_cattle_passports_farm" ON "cattle_passports" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_cattle_passports_status" ON "cattle_passports" ("status");--> statement-breakpoint
CREATE INDEX "idx_cattle_passports_number" ON "cattle_passports" ("passport_number");--> statement-breakpoint
CREATE INDEX "idx_takeovers_order" ON "ear_tag_takeovers" ("order_id");--> statement-breakpoint
CREATE INDEX "idx_takeovers_supplier" ON "ear_tag_takeovers" ("supplier_organization_id");--> statement-breakpoint
CREATE INDEX "idx_takeovers_status" ON "ear_tag_takeovers" ("status");--> statement-breakpoint
CREATE INDEX "idx_error_corrections_farm" ON "error_corrections" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_error_corrections_animal" ON "error_corrections" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_error_corrections_status" ON "error_corrections" ("status");--> statement-breakpoint
CREATE INDEX "idx_error_corrections_source" ON "error_corrections" ("detection_source");--> statement-breakpoint
CREATE INDEX "idx_form_reprints_farm" ON "form_reprints" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_form_reprints_status" ON "form_reprints" ("status");--> statement-breakpoint
CREATE INDEX "idx_form_reprints_reason" ON "form_reprints" ("reason");--> statement-breakpoint
CREATE INDEX "idx_import_export_animal" ON "import_export_records" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_import_export_farm" ON "import_export_records" ("from_farm_id");--> statement-breakpoint
CREATE INDEX "idx_import_export_status" ON "import_export_records" ("status");--> statement-breakpoint
CREATE INDEX "idx_import_export_direction" ON "import_export_records" ("direction");--> statement-breakpoint
CREATE INDEX "idx_inspections_farm" ON "inspections" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_inspections_inspector" ON "inspections" ("inspector_id");--> statement-breakpoint
CREATE INDEX "idx_inspections_status" ON "inspections" ("status");--> statement-breakpoint
CREATE INDEX "idx_inspections_date" ON "inspections" ("inspection_date");--> statement-breakpoint
CREATE INDEX "idx_subjects_parent" ON "subjects" ("parent_subject_id");--> statement-breakpoint
ALTER TABLE "archive_documents" ADD CONSTRAINT "archive_documents_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "cattle_passports" ADD CONSTRAINT "cattle_passports_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "cattle_passports" ADD CONSTRAINT "cattle_passports_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_takeovers" ADD CONSTRAINT "ear_tag_takeovers_order_id_ear_tag_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ear_tag_orders"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_takeovers" ADD CONSTRAINT "ear_tag_takeovers_VLXfrTzlBbP0_fkey" FOREIGN KEY ("supplier_organization_id") REFERENCES "organizations"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_takeovers" ADD CONSTRAINT "ear_tag_takeovers_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "error_corrections" ADD CONSTRAINT "error_corrections_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "error_corrections" ADD CONSTRAINT "error_corrections_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "form_reprints" ADD CONSTRAINT "form_reprints_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "import_export_records" ADD CONSTRAINT "import_export_records_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "import_export_records" ADD CONSTRAINT "import_export_records_from_farm_id_farms_id_fkey" FOREIGN KEY ("from_farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "import_export_records" ADD CONSTRAINT "import_export_records_to_farm_id_farms_id_fkey" FOREIGN KEY ("to_farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "import_export_records" ADD CONSTRAINT "import_export_records_bip_id_farms_id_fkey" FOREIGN KEY ("bip_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "import_export_records" ADD CONSTRAINT "import_export_records_quarantine_stable_id_farms_id_fkey" FOREIGN KEY ("quarantine_stable_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "sync_errors" ADD CONSTRAINT "sync_errors_zip_code_id_zip_codes_id_fkey" FOREIGN KEY ("zip_code_id") REFERENCES "zip_codes"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE POLICY "archive_document_access_policy" ON "archive_documents" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(($1, $2, $3))
        OR (current_setting('app.current_role', true) = ANY(($4, $5))
            AND ("archive_documents"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  )
                 OR "archive_documents"."farm_id" IS NULL))
      ));--> statement-breakpoint
CREATE POLICY "cattle_passport_access_policy" ON "cattle_passports" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(($1, $2, $3))
        OR (current_setting('app.current_role', true) = ANY(($4, $5))
            AND "cattle_passports"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
        OR (current_setting('app.current_role', true) = ANY(($6, $7, $8, $9))
            AND "cattle_passports"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
      ));--> statement-breakpoint
CREATE POLICY "ear_tag_takeover_access_policy" ON "ear_tag_takeovers" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(($1, $2, $3))
        OR "ear_tag_takeovers"."supplier_organization_id" = current_setting('app.current_org_id', true)::uuid
      )) WITH CHECK ((
        current_setting('app.current_role', true) = ANY(($1, $2, $3))
        OR "ear_tag_takeovers"."supplier_organization_id" = current_setting('app.current_org_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "error_correction_access_policy" ON "error_corrections" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(($1, $2, $3))
        OR (current_setting('app.current_role', true) = ANY(($4, $5))
            AND ("error_corrections"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  )
                 OR "error_corrections"."farm_id" IS NULL))
        OR (current_setting('app.current_role', true) = ANY(($6, $7, $8, $9))
            AND "error_corrections"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
      ));--> statement-breakpoint
CREATE POLICY "form_reprint_access_policy" ON "form_reprints" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(($1, $2, $3))
        OR (current_setting('app.current_role', true) = ANY(($4, $5))
            AND "form_reprints"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
        OR (current_setting('app.current_role', true) = ANY(($6, $7, $8, $9))
            AND "form_reprints"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
      ));--> statement-breakpoint
CREATE POLICY "import_export_access_policy" ON "import_export_records" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(($1, $2, $3))
        OR (current_setting('app.current_role', true) = ANY(($4, $5))
            AND ("import_export_records"."from_farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  )
                 OR "import_export_records"."to_farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  )))
        OR (current_setting('app.current_role', true) = ANY(($6, $7, $8, $9))
            AND ("import_export_records"."from_farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  )
                 OR "import_export_records"."to_farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  )))
      ));--> statement-breakpoint
CREATE POLICY "inspection_access_policy" ON "inspections" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(($1, $2, $3))
        OR (current_setting('app.current_role', true) = ANY(($4, $5))
            AND "inspections"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
      ));