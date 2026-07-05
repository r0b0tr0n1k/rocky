CREATE TYPE "detection_source" AS ENUM('field', 'a_priori', 'a_posteriori');--> statement-breakpoint
CREATE TYPE "device_status" AS ENUM('active', 'blocked', 'retired');--> statement-breakpoint
CREATE TYPE "health_record_type" AS ENUM('vaccination', 'treatment', 'labTest');--> statement-breakpoint
CREATE TYPE "health_severity" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
ALTER TYPE "language" ADD VALUE 'SQ';--> statement-breakpoint
ALTER TYPE "language" ADD VALUE 'SR';--> statement-breakpoint
CREATE TABLE "pda_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"device_identifier" varchar(255) NOT NULL UNIQUE,
	"name" varchar(200),
	"device_type" varchar(10) NOT NULL,
	"os_version" varchar(20),
	"app_version" varchar(20),
	"current_user_id" uuid,
	"push_token" text,
	"last_sync_at" timestamp,
	"last_sync_data" jsonb,
	"status" "device_status" DEFAULT 'active'::"device_status" NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"blocked_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp,
	CONSTRAINT "ck_device_failed_attempts_range" CHECK ("failed_attempts" >= 0 AND "failed_attempts" <= 3)
);
--> statement-breakpoint
ALTER TABLE "pda_devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "animals" ADD CONSTRAINT "ck_animal_not_own_mother" CHECK ("mother_id" IS DISTINCT FROM "id");--> statement-breakpoint
CREATE POLICY "pda_device_access_policy" ON "pda_devices" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(($1, $2, $3))) WITH CHECK (current_setting('app.current_role', true) = ANY(($1, $2, $3)));