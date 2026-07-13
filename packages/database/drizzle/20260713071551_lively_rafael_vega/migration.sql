ALTER TYPE "outbox_aggregate_type" ADD VALUE 'lab_test';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "acknowledged_at" timestamp;--> statement-breakpoint
CREATE INDEX "idx_notifications_acknowledged" ON "notifications" ("acknowledged_at");