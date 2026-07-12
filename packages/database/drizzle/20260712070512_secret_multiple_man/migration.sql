CREATE TYPE "settlement_type" AS ENUM('village', 'town', 'city');--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(200) NOT NULL,
	"settlement_type" "settlement_type" NOT NULL,
	"location" geometry(point,4326),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settlements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_settlements_location" ON "settlements" USING gist ("location");--> statement-breakpoint
CREATE POLICY "settlement_read_policy" ON "settlements" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "settlement_write_policy" ON "settlements" AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));