CREATE TYPE "admin_roles" AS ENUM('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF');--> statement-breakpoint
CREATE TYPE "administration_route" AS ENUM('intramuscular', 'subcutaneous', 'intranasal', 'oral', 'topical', 'other');--> statement-breakpoint
CREATE TYPE "allocation_status" AS ENUM('PENDING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "allocation_type" AS ENUM('INITIAL_ALLOCATION', 'ROUTINE_ALLOCATION', 'RETURN');--> statement-breakpoint
CREATE TYPE "animal_status" AS ENUM('alive', 'dead', 'slaughtered', 'sold', 'exported', 'imported', 'missing', 'stillborn');--> statement-breakpoint
CREATE TYPE "approval_action" AS ENUM('APPROVE', 'REJECT', 'REQUEST_CHANGES');--> statement-breakpoint
CREATE TYPE "archive_document_type" AS ENUM('passport', 'census_form', 'tagging_receipt', 'order_form', 'inspection_form', 'slaughter_list', 'correspondence', 'other');--> statement-breakpoint
CREATE TYPE "archive_location" AS ENUM('cpc', 'vs', 'vi', 'bip');--> statement-breakpoint
CREATE TYPE "audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'IMPORT');--> statement-breakpoint
CREATE TYPE "birth_notification_status" AS ENUM('PENDING', 'SENT', 'FAILED', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "birth_type" AS ENUM('single', 'twin', 'triplet', 'stillborn');--> statement-breakpoint
CREATE TYPE "conflict_resolution_status" AS ENUM('none', 'invalidated_natural', 'invalidated_data_error', 'reinstated');--> statement-breakpoint
CREATE TYPE "contingent_type" AS ENUM('supplier', 'vd', 'vs');--> statement-breakpoint
CREATE TYPE "correction_case_type" AS ENUM('technician_resolvable', 'requires_clarification', 'complex');--> statement-breakpoint
CREATE TYPE "correction_status" AS ENUM('pending', 'under_review', 'resolved', 'escalated', 'rejected');--> statement-breakpoint
CREATE TYPE "data_source" AS ENUM('aimcs', 'hk_imp', 'hk_pda', 'mobile', 'api', 'batch');--> statement-breakpoint
CREATE TYPE "death_cause" AS ENUM('DEATH_REGISTERED', 'DEATH_UNREGISTERED', 'DEATH_UNREGISTERED_IMPORT', 'STILLBORN', 'DEATH_AFTER_BIRTH');--> statement-breakpoint
CREATE TYPE "delivery_method" AS ENUM('HK_IMP', 'HK_PDA');--> statement-breakpoint
CREATE TYPE "detection_source" AS ENUM('field', 'a_priori', 'a_posteriori');--> statement-breakpoint
CREATE TYPE "device_status" AS ENUM('active', 'blocked', 'retired');--> statement-breakpoint
CREATE TYPE "device_type" AS ENUM('ruminal_bolus');--> statement-breakpoint
CREATE TYPE "distribution_method" AS ENUM('VD_DELIVERY', 'PICKUP');--> statement-breakpoint
CREATE TYPE "duplicate_type" AS ENUM('single', 'pair');--> statement-breakpoint
CREATE TYPE "ear_tag_order_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'ordered', 'partially_received', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "ear_tag_replacement_reason" AS ENUM('lost', 'damaged', 'defective', 'illegible', 'wrong_tag_applied', 'animal_died_before_tagging', 'other');--> statement-breakpoint
CREATE TYPE "ear_tag_replacement_status" AS ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "ear_tag_status" AS ENUM('new', 'available', 'ordered', 'collected', 'delivered', 'applied', 'cancelled', 'withdrawn', 'lost', 'destroyed');--> statement-breakpoint
CREATE TYPE "eartag_transition_status" AS ENUM('delivered', 'completed');--> statement-breakpoint
CREATE TYPE "email_status" AS ENUM('sent', 'queued', 'failed');--> statement-breakpoint
CREATE TYPE "entity_type" AS ENUM('FARM', 'SUBJECT', 'FARM_SUBJECT');--> statement-breakpoint
CREATE TYPE "environment" AS ENUM('dev', 'production', 'test', 'staging');--> statement-breakpoint
CREATE TYPE "event_source" AS ENUM('API', 'MOBILE', 'SYNC', 'SYSTEM', 'IMPORT', 'WEBHOOK');--> statement-breakpoint
CREATE TYPE "farm_book_status" AS ENUM('pending', 'assembled', 'printed', 'shipped_to_vs', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "farm_read_roles" AS ENUM('FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP');--> statement-breakpoint
CREATE TYPE "farm_type" AS ENUM('farm', 'slaughterhouse', 'livestock_market', 'pasture_mountain', 'pasture_village', 'bip', 'trader_yard', 'quarantine', 'other');--> statement-breakpoint
CREATE TYPE "fence_type" AS ENUM('farm_boundary', 'pasture_boundary', 'exclusion_zone', 'water_source');--> statement-breakpoint
CREATE TYPE "geofence_event_source" AS ENUM('manual', 'sensor', 'automated');--> statement-breakpoint
CREATE TYPE "geofence_event_type" AS ENUM('entered', 'exited', 'inside', 'outside');--> statement-breakpoint
CREATE TYPE "health_record_type" AS ENUM('vaccination', 'treatment', 'labTest');--> statement-breakpoint
CREATE TYPE "health_severity" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "holding_type" AS ENUM('FARM', 'SUBJECT', 'ADDRESS');--> statement-breakpoint
CREATE TYPE "import_export_status" AS ENUM('pending', 'in_transit', 'quarantine', 'registered', 'completed');--> statement-breakpoint
CREATE TYPE "import_type" AS ENUM('eu', 'third_country');--> statement-breakpoint
CREATE TYPE "inspection_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "iot_device_status" AS ENUM('active', 'low_battery', 'failed', 'retired');--> statement-breakpoint
CREATE TYPE "language" AS ENUM('MK', 'EN', 'SQ', 'SR');--> statement-breakpoint
CREATE TYPE "module_type" AS ENUM('CORE', 'FEATURE', 'INTEGRATION', 'REPORT', 'ADMIN');--> statement-breakpoint
CREATE TYPE "movement_type" AS ENUM('sale', 'purchase', 'market_sale', 'market_purchase', 'transfer', 'birth_registration', 'death', 'home_slaughter', 'slaughterhouse', 'pasture_departure', 'pasture_return', 'import', 'export', 'alpine_departure', 'alpine_return', 'correction');--> statement-breakpoint
CREATE TYPE "notification_category" AS ENUM('ear_tag_expiration', 'ear_tag_low_stock', 'ear_tag_allocation', 'ear_tag_replacement_request', 'ear_tag_replacement_approved', 'birth_tagging_deadline', 'animal_movement_request', 'animal_movement_verification', 'animal_health_alert', 'farm_registration_pending', 'farm_verification_required', 'farm_approved', 'farm_rejected', 'system_maintenance', 'system_error', 'system_update', 'user_invite', 'user_password_reset', 'user_role_changed', 'user_login_alert', 'inspection_due', 'inspection_overdue', 'quarantine_alert', 'disease_outbreak', 'report_generated', 'report_failed', 'data_sync_complete', 'data_sync_failed');--> statement-breakpoint
CREATE TYPE "notification_priority" AS ENUM('low', 'normal', 'high', 'urgent', 'critical');--> statement-breakpoint
CREATE TYPE "notification_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "notification_type" AS ENUM('email', 'sms', 'push', 'in_app', 'webhook');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('pending', 'collected', 'delivered', 'partially_delivered', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "org_read_roles" AS ENUM('VETERINARIAN', 'TECHNICIAN');--> statement-breakpoint
CREATE TYPE "org_type" AS ENUM('VD', 'VET_CLINIC', 'SLAUGHTERHOUSE', 'LIVESTOCK_MARKET', 'FARM_ASSOCIATION', 'GOVERNMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "outbox_aggregate_type" AS ENUM('animal', 'farm', 'movement', 'treatment');--> statement-breakpoint
CREATE TYPE "outbox_event_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'dead_letter');--> statement-breakpoint
CREATE TYPE "parent_type" AS ENUM('MOTHER', 'FATHER');--> statement-breakpoint
CREATE TYPE "passport_status" AS ENUM('issued', 'active', 'seized', 'archived', 'reprinted', 'cancelled');--> statement-breakpoint
CREATE TYPE "pasture_type" AS ENUM('MOUNTAIN', 'VILLAGE');--> statement-breakpoint
CREATE TYPE "permission_scope" AS ENUM('farm', 'org', '*');--> statement-breakpoint
CREATE TYPE "processing_stage" AS ENUM('raw', 'validated', 'enriched', 'archived');--> statement-breakpoint
CREATE TYPE "reading_type" AS ENUM('accelerometer', 'temperature', 'heart_rate', 'gps_coordinate', 'activity_level', 'rumination_time', 'ruminal_ph', 'weight', 'battery_level', 'signal_strength', 'motion_detection', 'proximity');--> statement-breakpoint
CREATE TYPE "reprint_reason" AS ENUM('consumed', 'lost', 'damaged');--> statement-breakpoint
CREATE TYPE "reprint_status" AS ENUM('requested', 'processing', 'shipped', 'delivered');--> statement-breakpoint
CREATE TYPE "role_priority" AS ENUM('NORMAL', 'HIGH', 'CRITICAL', 'LOW');--> statement-breakpoint
CREATE TYPE "severity" AS ENUM('ERROR', 'WARNING', 'INFO', 'DEBUG');--> statement-breakpoint
CREATE TYPE "sex" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "sort_animal_by" AS ENUM('birthDate', 'createdAt', 'earTagNumber');--> statement-breakpoint
CREATE TYPE "sort_by_eartag" AS ENUM('createdAt', 'appliedDate', 'manufactureDate');--> statement-breakpoint
CREATE TYPE "sort_by_farm" AS ENUM('name', 'farmId', 'createdAt');--> statement-breakpoint
CREATE TYPE "sort_by_movement" AS ENUM('movementDate', 'createdAt');--> statement-breakpoint
CREATE TYPE "sort_by_user" AS ENUM('username', 'createdAt', 'lastLoginAt');--> statement-breakpoint
CREATE TYPE "sort_order" AS ENUM('asc', 'desc');--> statement-breakpoint
CREATE TYPE "state_code" AS ENUM('MK');--> statement-breakpoint
CREATE TYPE "subject_role" AS ENUM('owner', 'keeper', 'veterinarian', 'vi', 'trader', 'slaughterhouse_op', 'market_op', 'technician', 'guardian');--> statement-breakpoint
CREATE TYPE "sync_error_type" AS ENUM('PARSE_ERROR', 'VALIDATION_ERROR', 'NETWORK_ERROR', 'DUPLICATE', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "sync_record_type" AS ENUM('vaccination', 'treatment', 'labTest', 'animal', 'farm', 'movement', 'inspection', 'earTag');--> statement-breakpoint
CREATE TYPE "sync_status" AS ENUM('PASSED', 'WARNING', 'REJECTED');--> statement-breakpoint
CREATE TYPE "tag_category" AS ENUM('ELECTRONIC', 'VISUAL', 'BOTH');--> statement-breakpoint
CREATE TYPE "takeover_status" AS ENUM('COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "test_result" AS ENUM('positive', 'negative', 'inconclusive', 'quantitative');--> statement-breakpoint
CREATE TYPE "test_type" AS ENUM('serology', 'pcr', 'culture', 'elisa', 'necropsy', 'other');--> statement-breakpoint
CREATE TYPE "transmission_type" AS ENUM('LORAWAN', 'SIGFOX', 'NB_IOT', 'LTE_M', 'SATELLITE', 'BLUETOOTH');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN', 'TECHNICIAN', 'SLAUGHTERHOUSE_OP', 'MARKET_OP', 'FARMER');--> statement-breakpoint
CREATE TYPE "user_status" AS ENUM('active', 'inactive', 'blocked', 'pending_verification');--> statement-breakpoint
CREATE TYPE "vaccine_type" AS ENUM('live', 'inactivated', 'toxoid', 'recombinant', 'other');--> statement-breakpoint
CREATE TYPE "verification_status" AS ENUM('draft', 'pending_vd_approval', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "vs_contract_status" AS ENUM('draft', 'active', 'suspended', 'terminated', 'expired');--> statement-breakpoint
CREATE TYPE "weighing_type" AS ENUM('LIVE_WEIGHT', 'WARM_HALVES');--> statement-breakpoint
CREATE TYPE "write_roles" AS ENUM('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN');--> statement-breakpoint
CREATE ROLE "FARMER";--> statement-breakpoint
CREATE ROLE "MARKET_OP";--> statement-breakpoint
CREATE ROLE "SLAUGHTERHOUSE_OP";--> statement-breakpoint
CREATE ROLE "SUPER_ADMIN" WITH CREATEROLE;--> statement-breakpoint
CREATE ROLE "TECHNICIAN";--> statement-breakpoint
CREATE ROLE "VD_ADMIN" WITH CREATEROLE;--> statement-breakpoint
CREATE ROLE "VD_STAFF";--> statement-breakpoint
CREATE ROLE "VETERINARIAN";--> statement-breakpoint
CREATE TABLE "animal_geofence_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"animal_id" uuid NOT NULL,
	"geofence_id" uuid NOT NULL,
	"farm_id" uuid,
	"event_type" "geofence_event_type" NOT NULL,
	"event_at" timestamp NOT NULL,
	"location" geometry(point,4326),
	"source" "geofence_event_source" DEFAULT 'manual'::"geofence_event_source",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "animal_geofence_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "animal_parents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"animal_id" uuid NOT NULL,
	"parent_id" uuid NOT NULL,
	"parent_type" "parent_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "animal_parents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "animals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"state_code" "state_code" DEFAULT 'MK'::"state_code" NOT NULL,
	"ear_tag_number" varchar(8) NOT NULL,
	"birth_date" date NOT NULL,
	"sex" "sex" NOT NULL,
	"breed" varchar(50),
	"birth_type" "birth_type",
	"birth_weight" integer,
	"mother_id" uuid,
	"father_id" uuid,
	"current_farm_id" uuid NOT NULL,
	"status" "animal_status" DEFAULT 'alive'::"animal_status" NOT NULL,
	"is_first_tagging" boolean DEFAULT false NOT NULL,
	"tagging_date" date,
	"imported" boolean DEFAULT false NOT NULL,
	"import_country" varchar(3),
	"import_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp,
	CONSTRAINT "ck_animal_not_own_mother" CHECK ("mother_id" IS DISTINCT FROM "id")
);
--> statement-breakpoint
ALTER TABLE "animals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "birth_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"farm_id" uuid NOT NULL,
	"notification_date" date NOT NULL,
	"expected_birth_date" date,
	"actual_birth_date" date,
	"number_of_calves" integer DEFAULT 1 NOT NULL,
	"mother_animal_id" uuid,
	"notes" text,
	"source" "data_source" DEFAULT 'mobile'::"data_source" NOT NULL,
	"status" "birth_notification_status" DEFAULT 'PENDING'::"birth_notification_status" NOT NULL,
	"assigned_to" uuid,
	"assigned_at" timestamp,
	"tagging_deadline" date NOT NULL,
	"tagged_at" date,
	"tagging_exceeded" boolean DEFAULT false NOT NULL,
	"animal_ids" uuid[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "birth_notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "ear_tag_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"contingent_type" "contingent_type",
	"farm_id" uuid NOT NULL,
	"supplier_organization_id" uuid,
	"allocation_number" varchar(50) NOT NULL UNIQUE,
	"allocation_date" date NOT NULL,
	"type_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"tag_range_start" varchar(8),
	"tag_range_end" varchar(8),
	"tag_ids" uuid[],
	"distribution_method" "distribution_method" DEFAULT 'VD_DELIVERY'::"distribution_method" NOT NULL,
	"delivery_date" date,
	"received_by" uuid,
	"received_date" timestamp,
	"signature_data" text,
	"photo_url" varchar(500),
	"gps_location" varchar(100),
	"status" "allocation_status" DEFAULT 'PENDING'::"allocation_status" NOT NULL,
	"notes" text,
	"requested_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "ear_tag_allocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ear_tag_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"order_number" varchar(50) NOT NULL UNIQUE,
	"order_date" date NOT NULL,
	"organization_id" uuid NOT NULL,
	"supplier_organization_id" uuid,
	"supplier_name" varchar(100) NOT NULL,
	"supplier_code" varchar(50),
	"supplier_contact" varchar(100),
	"supplier_address" text,
	"items" text NOT NULL,
	"total_quantity" integer NOT NULL,
	"total_amount" varchar(20),
	"expected_delivery_date" date,
	"actual_delivery_date" date,
	"status" "ear_tag_order_status" DEFAULT 'draft'::"ear_tag_order_status" NOT NULL,
	"requested_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"notes" text,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "ear_tag_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ear_tag_replacements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"replacement_number" varchar(50) NOT NULL UNIQUE,
	"animal_id" uuid NOT NULL,
	"old_tag_number" varchar(8) NOT NULL,
	"new_tag_number" varchar(8) NOT NULL,
	"farm_id" uuid NOT NULL,
	"reason" "ear_tag_replacement_reason" NOT NULL,
	"reason_details" text,
	"status" "ear_tag_replacement_status" DEFAULT 'pending'::"ear_tag_replacement_status" NOT NULL,
	"reported_date" date NOT NULL,
	"replacement_date" date,
	"reported_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"new_tag_allocation_id" uuid,
	"photo_old_tag_url" varchar(500),
	"photo_new_tag_url" varchar(500),
	"photo_animal_url" varchar(500),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "ear_tag_replacements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ear_tag_takeovers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"supplier_organization_id" uuid NOT NULL,
	"status" "takeover_status" DEFAULT 'COMPLETED'::"takeover_status" NOT NULL,
	"total_tags_collected" integer NOT NULL,
	"exported_file_name" varchar(255),
	"file_content" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "ear_tag_takeovers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ear_tag_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"code" varchar(20) NOT NULL UNIQUE,
	"name" varchar(100) NOT NULL,
	"name_alt" varchar(100),
	"category" "tag_category" NOT NULL,
	"tag_gender" varchar(10),
	"color" varchar(50),
	"material" varchar(50),
	"size" varchar(50),
	"prefix" varchar(10),
	"number_range_start" integer,
	"number_range_end" integer,
	"supplier" varchar(100),
	"supplier_code" varchar(50),
	"unit_price" varchar(20),
	"description" text,
	"image_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "ear_tag_types" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ear_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"state_code" "state_code" DEFAULT 'MK'::"state_code" NOT NULL,
	"tag_number" varchar(8) NOT NULL,
	"type_id" uuid NOT NULL,
	"status" "ear_tag_status" DEFAULT 'available'::"ear_tag_status" NOT NULL,
	"order_id" uuid,
	"allocation_id" uuid,
	"animal_id" uuid,
	"applied_date" date,
	"is_defective" boolean DEFAULT false NOT NULL,
	"defect_reason" text,
	"quality_checked" boolean DEFAULT false NOT NULL,
	"quality_checked_by" uuid,
	"quality_checked_at" timestamp,
	"batch_number" varchar(50),
	"manufacture_date" date,
	"expiry_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "ear_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "geofences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(200) NOT NULL,
	"description" text,
	"farm_id" uuid NOT NULL,
	"pasture_id" uuid,
	"geometry" jsonb NOT NULL,
	"polygon" geometry(point,4326),
	"cadastral_reference" varchar(100),
	"fence_type" "fence_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "geofences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "iot_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"device_eui" varchar(64) UNIQUE,
	"manufacturer" varchar(100),
	"model" varchar(100),
	"serial_number" varchar(100),
	"firmware_version" varchar(30),
	"transmission_type" "transmission_type",
	"transmission_interval_seconds" integer,
	"assigned_to_animal_id" uuid,
	"assigned_to_farm_id" uuid,
	"activation_date" date,
	"deactivation_date" date,
	"battery_level" integer,
	"battery_last_checked" timestamp,
	"last_transmission_at" timestamp,
	"status" "iot_device_status" DEFAULT 'active'::"iot_device_status" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "iot_devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"animal_id" uuid NOT NULL,
	"from_farm_id" uuid,
	"to_farm_id" uuid NOT NULL,
	"type" "movement_type" NOT NULL,
	"movement_date" date NOT NULL,
	"arrival_date" date,
	"parent_movement_id" uuid,
	"leg_order" integer DEFAULT 0,
	"movement_group_id" uuid,
	"reason" varchar(100),
	"document_ref" varchar(50),
	"death_date" date,
	"death_cause" "death_cause",
	"import_country" varchar(3),
	"export_country" varchar(3),
	"breeding_state" varchar(3),
	"breeding_place_id" varchar(50),
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"verified_by" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "movements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pasture_declarations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"from_farm_id" uuid NOT NULL,
	"to_farm_id" uuid NOT NULL,
	"departure_date" date NOT NULL,
	"expected_return_date" date NOT NULL,
	"pasture_type" "pasture_type" NOT NULL,
	"animal_ids" uuid[] NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"completed_at" date,
	"conflict_resolution_status" "conflict_resolution_status" DEFAULT 'none'::"conflict_resolution_status" NOT NULL,
	"invalidated_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "pasture_declarations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "risk_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"year" integer NOT NULL,
	"quarter" varchar(10),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"total_farms" integer DEFAULT 0 NOT NULL,
	"selected_farms" integer DEFAULT 0 NOT NULL,
	"algorithm_version" varchar(20) DEFAULT 'v1',
	"selection_percentage" integer DEFAULT 10 NOT NULL,
	"params_snapshot" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
CREATE TABLE "risk_analysis_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"analysis_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"score" numeric(12,6) NOT NULL,
	"selected" boolean DEFAULT false NOT NULL,
	"risk_factors_snapshot" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sensor_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"device_id" uuid NOT NULL,
	"animal_id" uuid,
	"farm_id" uuid,
	"recorded_at" timestamp NOT NULL,
	"ingested_at" timestamp DEFAULT now() NOT NULL,
	"reading_type" "reading_type" NOT NULL,
	"value_numeric" numeric(20,6),
	"value_text" text,
	"unit" varchar(20),
	"location" geometry(point,4326),
	"raw_payload" jsonb,
	"processing_stage" "processing_stage" DEFAULT 'raw'::"processing_stage",
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sensor_readings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "auth_account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone" text,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_type" varchar(100) NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"target_id" uuid NOT NULL,
	"conditions" jsonb DEFAULT '[]',
	"channels" jsonb DEFAULT '{"inApp": true, "email": false, "push": false}',
	"delay_minutes" integer DEFAULT 0 NOT NULL,
	"reminder_enabled" boolean DEFAULT false NOT NULL,
	"reminder_offset_days" integer DEFAULT 0 NOT NULL,
	"reminder_duration_hours" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "event_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"outbox_event_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_id" uuid,
	"delivery_key" varchar(255) NOT NULL UNIQUE,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_message" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"outbox_event_id" uuid,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"user_id" uuid NOT NULL,
	"role" varchar(50),
	"title" varchar(255) NOT NULL,
	"description" varchar(1000),
	"due_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"recurrence" varchar(20) DEFAULT 'none' NOT NULL,
	"recurrence_until" timestamp with time zone,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reminders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "diseases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL UNIQUE,
	"notifiable" boolean DEFAULT false NOT NULL,
	"description" text,
	"quarantine_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "diseases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "treatments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"animal_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"disease_id" uuid,
	"vet_id" uuid NOT NULL,
	"diagnosis_date" date NOT NULL,
	"treatment_desc" text,
	"isolated" boolean DEFAULT false NOT NULL,
	"antibiotic_name" varchar(100),
	"amr_flag" boolean DEFAULT false NOT NULL,
	"withdrawal_period" integer,
	"alert_triggered_at" timestamp with time zone,
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
	"valid_to" timestamp,
	CONSTRAINT "ck_quantity_non_negative" CHECK ("quantity_remaining" >= 0)
);
--> statement-breakpoint
ALTER TABLE "vaccine_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vaccine_diseases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vaccine_id" uuid NOT NULL,
	"disease_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "vaccine_diseases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"city" varchar(30) NOT NULL,
	"street" varchar(50),
	"house_number" varchar(10) NOT NULL,
	"house_number_add" varchar(5),
	"zip_code_id" uuid NOT NULL,
	"commune_id" uuid,
	"admin_unit_id" uuid,
	"location" varchar(100),
	"geocoded_address" varchar(500),
	"geocoded_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "admin_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"name" varchar(50) NOT NULL,
	"au_id" varchar(20) NOT NULL,
	"level" varchar(12) DEFAULT 'LAU' NOT NULL,
	"parent_id" uuid,
	"nuts_code" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"valid_to" timestamp
);
--> statement-breakpoint
CREATE TABLE "communes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"valid_to" timestamp
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"name" varchar(50) NOT NULL,
	"short_name" varchar(3) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"valid_to" timestamp
);
--> statement-breakpoint
CREATE TABLE "zip_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"name" varchar(50) NOT NULL,
	"zip_code" varchar(20) NOT NULL,
	"state_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"valid_to" timestamp
);
--> statement-breakpoint
CREATE TABLE "farm_books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"farm_id" uuid NOT NULL,
	"status" "farm_book_status" NOT NULL,
	"assembled_at" timestamp,
	"printed_at" timestamp,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"assembled_by" uuid,
	"printed_by" uuid,
	"shipped_to_vs" boolean DEFAULT false NOT NULL,
	"delivered_to_keeper" boolean DEFAULT false NOT NULL,
	"vs_id" uuid,
	"reprint_of" uuid,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "farm_books" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "farm_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"farm_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"role" "subject_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "farm_subjects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "farms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"farm_id" varchar(9) NOT NULL UNIQUE,
	"address_id" uuid NOT NULL,
	"name" varchar(50),
	"type" "farm_type" DEFAULT 'farm'::"farm_type" NOT NULL,
	"parent_farm_id" uuid,
	"verification_status" "verification_status" DEFAULT 'pending_vd_approval'::"verification_status" NOT NULL,
	"verification_note" text,
	"verified_at" timestamp,
	"verified_by" uuid,
	"data_source" "data_source" DEFAULT 'mobile'::"data_source" NOT NULL,
	"location" geometry(point,4326),
	"digital_signature" text,
	"signature_captured_at" timestamp,
	"photo_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"updated_by" uuid,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "farms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"short_name" varchar(50) NOT NULL,
	"short_name_alt" varchar(50),
	"first_name" varchar(50),
	"first_name_alt" varchar(50),
	"last_name" varchar(50),
	"last_name_alt" varchar(50),
	"company_name" varchar(100),
	"personal_id" varchar(20),
	"vat_number" varchar(20),
	"phone_number" varchar(30),
	"email" varchar(255),
	"address_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "subjects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sync_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer,
	"farm_id" uuid,
	"address_id" uuid,
	"subject_id" uuid,
	"error_type" "sync_error_type" NOT NULL,
	"sync_status" "sync_status" DEFAULT 'WARNING'::"sync_status" NOT NULL,
	"note" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "sync_errors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vs_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"contract_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "vs_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vs_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"subject_id" uuid NOT NULL,
	"contract_number" varchar(50) NOT NULL UNIQUE,
	"region" varchar(100) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"status" "vs_contract_status" DEFAULT 'draft'::"vs_contract_status" NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "vs_contracts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"session_id" uuid,
	"action" "audit_action" NOT NULL,
	"resource" varchar(50) NOT NULL,
	"resource_id" varchar(50),
	"old_value" jsonb,
	"new_value" jsonb,
	"changes" jsonb,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"source" "event_source" NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"expo_push_token" text NOT NULL,
	"platform" text DEFAULT 'ios' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "device_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "business_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"validator_path" varchar(200),
	"severity" "severity" DEFAULT 'ERROR'::"severity" NOT NULL,
	"execute_if" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"run_on_server" boolean DEFAULT true NOT NULL,
	"run_on_mobile" boolean DEFAULT false NOT NULL,
	"message_template" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "code_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group" varchar(50) NOT NULL,
	"code" varchar(50) NOT NULL,
	"label" jsonb NOT NULL,
	"description" varchar(500),
	"display_order" integer DEFAULT 0 NOT NULL,
	"parent_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"valid_to" timestamp
);
--> statement-breakpoint
CREATE TABLE "module_business_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"module_id" uuid NOT NULL,
	"business_rule_id" uuid NOT NULL,
	"condition" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(50) NOT NULL UNIQUE,
	"title" varchar(100) NOT NULL,
	"type" "module_type" NOT NULL,
	"order_seq" integer DEFAULT 0 NOT NULL,
	"parent_id" uuid,
	"icon" varchar(50),
	"route" varchar(200),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_parameters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(50) NOT NULL UNIQUE,
	"value" text NOT NULL,
	"data_type" varchar(20) DEFAULT 'STRING' NOT NULL,
	"description" varchar(500),
	"group" varchar(50),
	"min_value" varchar(100),
	"max_value" varchar(100),
	"allowed_values" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_editable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"category" "notification_category" NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"quiet_hours_start" varchar(5),
	"quiet_hours_end" varchar(5),
	"timezone" varchar(50) DEFAULT 'Europe/Skopje' NOT NULL,
	"digest_mode" boolean DEFAULT false NOT NULL,
	"digest_frequency" varchar(20),
	"filters" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"code" varchar(50) NOT NULL UNIQUE,
	"name" varchar(100) NOT NULL,
	"description" text,
	"category" "notification_category" NOT NULL,
	"type" "notification_type" NOT NULL,
	"subject_template" jsonb,
	"body_template" jsonb NOT NULL,
	"variables" jsonb,
	"priority" "notification_priority" DEFAULT 'normal'::"notification_priority" NOT NULL,
	"scheduled" boolean DEFAULT false NOT NULL,
	"expires_in_hours" integer,
	"tags" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "notification_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"category" "notification_category" NOT NULL,
	"priority" "notification_priority" DEFAULT 'normal'::"notification_priority" NOT NULL,
	"status" "notification_status" DEFAULT 'pending'::"notification_status" NOT NULL,
	"subject" varchar(250),
	"message" text NOT NULL,
	"data" jsonb,
	"email_address" varchar(255),
	"phone_number" varchar(30),
	"push_token" varchar(500),
	"webhook_url" varchar(500),
	"template_id" uuid,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"expires_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"last_attempt_at" timestamp,
	"external_id" varchar(100),
	"source" "event_source" NOT NULL,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "org_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"commune_id" uuid,
	"region" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "org_areas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name1" varchar(100) NOT NULL,
	"name2" varchar(100),
	"name3" varchar(100),
	"address" jsonb,
	"phone" varchar(30),
	"fax" varchar(30),
	"email" varchar(255),
	"org_type" "org_type" NOT NULL,
	"parent_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"type" varchar(100) NOT NULL,
	"aggregate_type" varchar(50) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"payload" jsonb DEFAULT '{}' NOT NULL,
	"status" "outbox_event_status" DEFAULT 'pending'::"outbox_event_status" NOT NULL,
	"processed_at" timestamp with time zone,
	"error_message" text,
	"delivery_attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"resource" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"description" varchar(250),
	"scope" varchar(100) DEFAULT '*' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"condition" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(50) NOT NULL,
	"description" varchar(250),
	"priority" "role_priority" DEFAULT 'NORMAL'::"role_priority" NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"scope_org_id" uuid,
	"scope_farm_id" uuid,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"access_token" varchar(500) NOT NULL,
	"refresh_token" varchar(500),
	"device_info" jsonb,
	"ip_address" varchar(45),
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_activity_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"auth_user_id" varchar(255),
	"username" varchar(50) NOT NULL,
	"email" varchar(255),
	"password_hash" varchar(255),
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"mfa_secret" varchar(100),
	"first_name" varchar(50),
	"first_name_alt" varchar(50),
	"last_name" varchar(50),
	"last_name_alt" varchar(50),
	"mobile_phone" varchar(30),
	"mobile_verified" boolean DEFAULT false NOT NULL,
	"device_id" varchar(255),
	"role" "user_role" DEFAULT 'FARMER'::"user_role" NOT NULL,
	"organization_id" uuid,
	"language" "language" DEFAULT 'MK'::"language" NOT NULL,
	"geo_unlimited" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"status" "user_status" DEFAULT 'active'::"user_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp,
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sync_idempotency" (
	"idempotency_key" varchar PRIMARY KEY,
	"entity_type" varchar NOT NULL,
	"entity_id" uuid,
	"created_by" varchar NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_geofence_events_animal" ON "animal_geofence_events" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_geofence_events_geofence" ON "animal_geofence_events" ("geofence_id");--> statement-breakpoint
CREATE INDEX "idx_geofence_events_farm" ON "animal_geofence_events" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_geofence_events_type" ON "animal_geofence_events" ("event_type");--> statement-breakpoint
CREATE INDEX "idx_geofence_events_time" ON "animal_geofence_events" ("event_at");--> statement-breakpoint
CREATE INDEX "idx_animal_parents_animal" ON "animal_parents" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_animal_parents_parent" ON "animal_parents" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_animals_ear_tag" ON "animals" ("state_code","ear_tag_number");--> statement-breakpoint
CREATE INDEX "idx_animals_farm" ON "animals" ("current_farm_id");--> statement-breakpoint
CREATE INDEX "idx_animals_status" ON "animals" ("status");--> statement-breakpoint
CREATE INDEX "idx_animals_mother" ON "animals" ("mother_id");--> statement-breakpoint
CREATE INDEX "idx_archive_documents_type" ON "archive_documents" ("document_type");--> statement-breakpoint
CREATE INDEX "idx_archive_documents_location" ON "archive_documents" ("archive_location");--> statement-breakpoint
CREATE INDEX "idx_archive_documents_farm" ON "archive_documents" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_archive_documents_animal" ON "archive_documents" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_archive_documents_expiry" ON "archive_documents" ("retention_expiry");--> statement-breakpoint
CREATE INDEX "idx_birth_notifications_farm" ON "birth_notifications" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_birth_notifications_status" ON "birth_notifications" ("status");--> statement-breakpoint
CREATE INDEX "idx_birth_notifications_deadline" ON "birth_notifications" ("tagging_deadline");--> statement-breakpoint
CREATE INDEX "idx_birth_notifications_assigned" ON "birth_notifications" ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_cattle_passports_animal" ON "cattle_passports" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_cattle_passports_farm" ON "cattle_passports" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_cattle_passports_status" ON "cattle_passports" ("status");--> statement-breakpoint
CREATE INDEX "idx_cattle_passports_number" ON "cattle_passports" ("passport_number");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ear_tag_allocations_number" ON "ear_tag_allocations" ("allocation_number");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_allocations_farm" ON "ear_tag_allocations" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_allocations_date" ON "ear_tag_allocations" ("allocation_date");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_allocations_status" ON "ear_tag_allocations" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ear_tag_orders_number" ON "ear_tag_orders" ("order_number");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_orders_org" ON "ear_tag_orders" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_orders_date" ON "ear_tag_orders" ("order_date");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_orders_status" ON "ear_tag_orders" ("status");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_replacements_number" ON "ear_tag_replacements" ("replacement_number");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_replacements_animal" ON "ear_tag_replacements" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_replacements_farm" ON "ear_tag_replacements" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_replacements_status" ON "ear_tag_replacements" ("status");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_replacements_date" ON "ear_tag_replacements" ("reported_date");--> statement-breakpoint
CREATE INDEX "idx_takeovers_order" ON "ear_tag_takeovers" ("order_id");--> statement-breakpoint
CREATE INDEX "idx_takeovers_supplier" ON "ear_tag_takeovers" ("supplier_organization_id");--> statement-breakpoint
CREATE INDEX "idx_takeovers_status" ON "ear_tag_takeovers" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ear_tag_types_code" ON "ear_tag_types" ("code");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_types_category" ON "ear_tag_types" ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ear_tags_tag" ON "ear_tags" ("state_code","tag_number");--> statement-breakpoint
CREATE INDEX "idx_ear_tags_status" ON "ear_tags" ("status");--> statement-breakpoint
CREATE INDEX "idx_ear_tags_type" ON "ear_tags" ("type_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tags_order" ON "ear_tags" ("order_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tags_allocation" ON "ear_tags" ("allocation_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tags_animal" ON "ear_tags" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_error_corrections_farm" ON "error_corrections" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_error_corrections_animal" ON "error_corrections" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_error_corrections_status" ON "error_corrections" ("status");--> statement-breakpoint
CREATE INDEX "idx_error_corrections_source" ON "error_corrections" ("detection_source");--> statement-breakpoint
CREATE INDEX "idx_form_reprints_farm" ON "form_reprints" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_form_reprints_status" ON "form_reprints" ("status");--> statement-breakpoint
CREATE INDEX "idx_form_reprints_reason" ON "form_reprints" ("reason");--> statement-breakpoint
CREATE INDEX "idx_geofences_farm" ON "geofences" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_geofences_pasture" ON "geofences" ("pasture_id");--> statement-breakpoint
CREATE INDEX "idx_geofences_type" ON "geofences" ("fence_type");--> statement-breakpoint
CREATE INDEX "idx_geofences_active" ON "geofences" ("is_active");--> statement-breakpoint
CREATE INDEX "idx_geofences_polygon" ON "geofences" USING gist ("polygon");--> statement-breakpoint
CREATE INDEX "idx_import_export_animal" ON "import_export_records" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_import_export_farm" ON "import_export_records" ("from_farm_id");--> statement-breakpoint
CREATE INDEX "idx_import_export_status" ON "import_export_records" ("status");--> statement-breakpoint
CREATE INDEX "idx_import_export_direction" ON "import_export_records" ("direction");--> statement-breakpoint
CREATE INDEX "idx_inspections_farm" ON "inspections" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_inspections_inspector" ON "inspections" ("inspector_id");--> statement-breakpoint
CREATE INDEX "idx_inspections_status" ON "inspections" ("status");--> statement-breakpoint
CREATE INDEX "idx_inspections_date" ON "inspections" ("inspection_date");--> statement-breakpoint
CREATE INDEX "idx_iot_devices_animal" ON "iot_devices" ("assigned_to_animal_id");--> statement-breakpoint
CREATE INDEX "idx_iot_devices_farm" ON "iot_devices" ("assigned_to_farm_id");--> statement-breakpoint
CREATE INDEX "idx_iot_devices_status" ON "iot_devices" ("status");--> statement-breakpoint
CREATE INDEX "idx_iot_devices_transmission" ON "iot_devices" ("transmission_type");--> statement-breakpoint
CREATE INDEX "idx_iot_devices_last_tx" ON "iot_devices" ("last_transmission_at");--> statement-breakpoint
CREATE INDEX "idx_movements_animal" ON "movements" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_movements_date" ON "movements" ("movement_date");--> statement-breakpoint
CREATE INDEX "idx_movements_type" ON "movements" ("type");--> statement-breakpoint
CREATE INDEX "idx_movements_from" ON "movements" ("from_farm_id");--> statement-breakpoint
CREATE INDEX "idx_movements_to" ON "movements" ("to_farm_id");--> statement-breakpoint
CREATE INDEX "idx_movements_parent" ON "movements" ("parent_movement_id");--> statement-breakpoint
CREATE INDEX "idx_pasture_from" ON "pasture_declarations" ("from_farm_id");--> statement-breakpoint
CREATE INDEX "idx_pasture_to" ON "pasture_declarations" ("to_farm_id");--> statement-breakpoint
CREATE INDEX "idx_pasture_type" ON "pasture_declarations" ("pasture_type");--> statement-breakpoint
CREATE INDEX "idx_risk_analyses_year" ON "risk_analyses" ("year");--> statement-breakpoint
CREATE INDEX "idx_risk_analyses_status" ON "risk_analyses" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uk_risk_analysis_results_analysis_farm" ON "risk_analysis_results" ("analysis_id","farm_id");--> statement-breakpoint
CREATE INDEX "idx_risk_analysis_results_farm" ON "risk_analysis_results" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_risk_analysis_results_analysis" ON "risk_analysis_results" ("analysis_id");--> statement-breakpoint
CREATE INDEX "idx_sensor_readings_device" ON "sensor_readings" ("device_id");--> statement-breakpoint
CREATE INDEX "idx_sensor_readings_animal" ON "sensor_readings" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_sensor_readings_farm" ON "sensor_readings" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_sensor_readings_type" ON "sensor_readings" ("reading_type");--> statement-breakpoint
CREATE INDEX "idx_sensor_readings_recorded" ON "sensor_readings" ("recorded_at");--> statement-breakpoint
CREATE INDEX "idx_event_subscriptions_type" ON "event_subscriptions" ("event_type");--> statement-breakpoint
CREATE INDEX "idx_event_subscriptions_target" ON "event_subscriptions" ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_event" ON "notification_deliveries" ("outbox_event_id");--> statement-breakpoint
CREATE INDEX "idx_notification_deliveries_user" ON "notification_deliveries" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reminders_user_pending" ON "reminders" ("user_id","status","due_at") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_reminders_due" ON "reminders" ("due_at") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_diseases_notifiable" ON "diseases" ("notifiable");--> statement-breakpoint
CREATE INDEX "idx_lab_tests_animal" ON "lab_tests" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_lab_tests_farm" ON "lab_tests" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_lab_tests_disease" ON "lab_tests" ("disease_id");--> statement-breakpoint
CREATE INDEX "idx_lab_tests_type" ON "lab_tests" ("test_type");--> statement-breakpoint
CREATE INDEX "idx_lab_tests_date" ON "lab_tests" ("result_date");--> statement-breakpoint
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
CREATE UNIQUE INDEX "idx_vaccine_diseases_pair" ON "vaccine_diseases" ("vaccine_id","disease_id");--> statement-breakpoint
CREATE INDEX "idx_vaccine_diseases_vaccine" ON "vaccine_diseases" ("vaccine_id");--> statement-breakpoint
CREATE INDEX "idx_vaccine_diseases_disease" ON "vaccine_diseases" ("disease_id");--> statement-breakpoint
CREATE INDEX "idx_addresses_zip" ON "addresses" ("zip_code_id");--> statement-breakpoint
CREATE INDEX "idx_addresses_commune" ON "addresses" ("commune_id");--> statement-breakpoint
CREATE INDEX "idx_addresses_city" ON "addresses" ("city");--> statement-breakpoint
CREATE INDEX "idx_admin_units_auid" ON "admin_units" ("au_id");--> statement-breakpoint
CREATE INDEX "idx_admin_units_level" ON "admin_units" ("level");--> statement-breakpoint
CREATE INDEX "idx_admin_units_parent" ON "admin_units" ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_communes_name" ON "communes" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_states_short_name" ON "states" ("short_name");--> statement-breakpoint
CREATE INDEX "idx_zip_codes_code" ON "zip_codes" ("zip_code");--> statement-breakpoint
CREATE INDEX "idx_zip_codes_state" ON "zip_codes" ("state_id");--> statement-breakpoint
CREATE INDEX "idx_farm_books_farm" ON "farm_books" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_farm_books_status" ON "farm_books" ("status");--> statement-breakpoint
CREATE INDEX "idx_farm_books_vs" ON "farm_books" ("vs_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_farm_subjects_unique" ON "farm_subjects" ("farm_id","subject_id","role");--> statement-breakpoint
CREATE INDEX "idx_farm_subjects_farm" ON "farm_subjects" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_farm_subjects_subject" ON "farm_subjects" ("subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_farms_farm_id" ON "farms" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_farms_address" ON "farms" ("address_id");--> statement-breakpoint
CREATE INDEX "idx_farms_verification" ON "farms" ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_farms_parent" ON "farms" ("parent_farm_id");--> statement-breakpoint
CREATE INDEX "idx_farms_type" ON "farms" ("type");--> statement-breakpoint
CREATE INDEX "idx_farms_location_gist" ON "farms" USING gist ("location");--> statement-breakpoint
CREATE INDEX "idx_subjects_personal_id" ON "subjects" ("personal_id");--> statement-breakpoint
CREATE INDEX "idx_subjects_vat" ON "subjects" ("vat_number");--> statement-breakpoint
CREATE INDEX "idx_subjects_name" ON "subjects" ("short_name");--> statement-breakpoint
CREATE INDEX "idx_sync_errors_farm" ON "sync_errors" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_sync_errors_type" ON "sync_errors" ("error_type");--> statement-breakpoint
CREATE INDEX "idx_sync_errors_resolved" ON "sync_errors" ("resolved");--> statement-breakpoint
CREATE INDEX "idx_vs_assignments_contract" ON "vs_assignments" ("contract_id");--> statement-breakpoint
CREATE INDEX "idx_vs_assignments_farm" ON "vs_assignments" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_vs_assignments_active" ON "vs_assignments" ("farm_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_vs_contracts_subject" ON "vs_contracts" ("subject_id");--> statement-breakpoint
CREATE INDEX "idx_vs_contracts_status" ON "vs_contracts" ("status");--> statement-breakpoint
CREATE INDEX "idx_vs_contracts_region" ON "vs_contracts" ("region");--> statement-breakpoint
CREATE INDEX "idx_audit_resource" ON "audit_log" ("resource","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_log" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_action" ON "audit_log" ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "audit_log" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_device_tokens_user" ON "device_tokens" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_device_tokens_device" ON "device_tokens" ("device_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_device_tokens_user_device" ON "device_tokens" ("user_id","device_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_br_name" ON "business_rules" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_code_tables_group_code" ON "code_tables" ("group","code");--> statement-breakpoint
CREATE INDEX "idx_code_tables_group" ON "code_tables" ("group");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_module_br" ON "module_business_rules" ("module_id","business_rule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sys_params_code" ON "system_parameters" ("code");--> statement-breakpoint
CREATE INDEX "idx_sys_params_group" ON "system_parameters" ("group");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notification_prefs_user_category" ON "notification_preferences" ("user_id","category");--> statement-breakpoint
CREATE INDEX "idx_notification_prefs_user" ON "notification_preferences" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notification_prefs_category" ON "notification_preferences" ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notification_templates_code" ON "notification_templates" ("code");--> statement-breakpoint
CREATE INDEX "idx_notification_templates_category" ON "notification_templates" ("category");--> statement-breakpoint
CREATE INDEX "idx_notification_templates_type" ON "notification_templates" ("type");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_status" ON "notifications" ("status");--> statement-breakpoint
CREATE INDEX "idx_notifications_category" ON "notifications" ("category");--> statement-breakpoint
CREATE INDEX "idx_notifications_type" ON "notifications" ("type");--> statement-breakpoint
CREATE INDEX "idx_notifications_priority" ON "notifications" ("priority");--> statement-breakpoint
CREATE INDEX "idx_notifications_scheduled" ON "notifications" ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_created" ON "notifications" ("created_at");--> statement-breakpoint
CREATE INDEX "idx_org_area_org" ON "org_areas" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_org_type" ON "organizations" ("org_type");--> statement-breakpoint
CREATE INDEX "idx_org_parent" ON "organizations" ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_outbox_pending" ON "outbox_events" ("status","next_attempt_at") WHERE "status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_outbox_aggregate" ON "outbox_events" ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX "idx_outbox_type" ON "outbox_events" ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_perm_resource_action" ON "permissions" ("resource","action");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_role_permissions" ON "role_permissions" ("role_id","permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_roles_name" ON "roles" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_roles" ON "user_roles" ("user_id","role_id","scope_org_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user" ON "user_roles" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "user_sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_token" ON "user_sessions" ("access_token");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_username" ON "users" ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email");--> statement-breakpoint
CREATE INDEX "idx_users_org" ON "users" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" ("role");--> statement-breakpoint
CREATE INDEX "idx_users_status" ON "users" ("status");--> statement-breakpoint
ALTER TABLE "animal_geofence_events" ADD CONSTRAINT "animal_geofence_events_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "animal_geofence_events" ADD CONSTRAINT "animal_geofence_events_geofence_id_geofences_id_fkey" FOREIGN KEY ("geofence_id") REFERENCES "geofences"("id");--> statement-breakpoint
ALTER TABLE "animal_parents" ADD CONSTRAINT "animal_parents_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "animal_parents" ADD CONSTRAINT "animal_parents_parent_id_animals_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "animals"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "animals" ADD CONSTRAINT "animals_current_farm_id_farms_id_fkey" FOREIGN KEY ("current_farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "archive_documents" ADD CONSTRAINT "archive_documents_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "birth_notifications" ADD CONSTRAINT "birth_notifications_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "cattle_passports" ADD CONSTRAINT "cattle_passports_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "cattle_passports" ADD CONSTRAINT "cattle_passports_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_allocations" ADD CONSTRAINT "ear_tag_allocations_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_allocations" ADD CONSTRAINT "ear_tag_allocations_65326VHfHlPx_fkey" FOREIGN KEY ("supplier_organization_id") REFERENCES "organizations"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_allocations" ADD CONSTRAINT "ear_tag_allocations_received_by_users_id_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_allocations" ADD CONSTRAINT "ear_tag_allocations_requested_by_users_id_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_allocations" ADD CONSTRAINT "ear_tag_allocations_approved_by_users_id_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_orders" ADD CONSTRAINT "ear_tag_orders_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_orders" ADD CONSTRAINT "ear_tag_orders_supplier_organization_id_organizations_id_fkey" FOREIGN KEY ("supplier_organization_id") REFERENCES "organizations"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_orders" ADD CONSTRAINT "ear_tag_orders_requested_by_users_id_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_orders" ADD CONSTRAINT "ear_tag_orders_approved_by_users_id_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_replacements" ADD CONSTRAINT "ear_tag_replacements_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_replacements" ADD CONSTRAINT "ear_tag_replacements_reported_by_users_id_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_replacements" ADD CONSTRAINT "ear_tag_replacements_approved_by_users_id_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_takeovers" ADD CONSTRAINT "ear_tag_takeovers_order_id_ear_tag_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "ear_tag_orders"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_takeovers" ADD CONSTRAINT "ear_tag_takeovers_VLXfrTzlBbP0_fkey" FOREIGN KEY ("supplier_organization_id") REFERENCES "organizations"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_takeovers" ADD CONSTRAINT "ear_tag_takeovers_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "ear_tags" ADD CONSTRAINT "ear_tags_type_id_ear_tag_types_id_fkey" FOREIGN KEY ("type_id") REFERENCES "ear_tag_types"("id");--> statement-breakpoint
ALTER TABLE "error_corrections" ADD CONSTRAINT "error_corrections_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "error_corrections" ADD CONSTRAINT "error_corrections_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "form_reprints" ADD CONSTRAINT "form_reprints_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_pasture_id_pasture_declarations_id_fkey" FOREIGN KEY ("pasture_id") REFERENCES "pasture_declarations"("id");--> statement-breakpoint
ALTER TABLE "import_export_records" ADD CONSTRAINT "import_export_records_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "import_export_records" ADD CONSTRAINT "import_export_records_from_farm_id_farms_id_fkey" FOREIGN KEY ("from_farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "import_export_records" ADD CONSTRAINT "import_export_records_to_farm_id_farms_id_fkey" FOREIGN KEY ("to_farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "import_export_records" ADD CONSTRAINT "import_export_records_bip_id_farms_id_fkey" FOREIGN KEY ("bip_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "import_export_records" ADD CONSTRAINT "import_export_records_quarantine_stable_id_farms_id_fkey" FOREIGN KEY ("quarantine_stable_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_assigned_to_animal_id_animals_id_fkey" FOREIGN KEY ("assigned_to_animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_assigned_to_farm_id_farms_id_fkey" FOREIGN KEY ("assigned_to_farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_from_farm_id_farms_id_fkey" FOREIGN KEY ("from_farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_to_farm_id_farms_id_fkey" FOREIGN KEY ("to_farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "pda_devices" ADD CONSTRAINT "pda_devices_current_user_id_users_id_fkey" FOREIGN KEY ("current_user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "risk_analysis_results" ADD CONSTRAINT "risk_analysis_results_analysis_id_risk_analyses_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "risk_analyses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "risk_analysis_results" ADD CONSTRAINT "risk_analysis_results_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_device_id_iot_devices_id_fkey" FOREIGN KEY ("device_id") REFERENCES "iot_devices"("id");--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_subscriptions" ADD CONSTRAINT "event_subscriptions_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_outbox_event_id_outbox_events_id_fkey" FOREIGN KEY ("outbox_event_id") REFERENCES "outbox_events"("id");--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id");--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_outbox_event_id_outbox_events_id_fkey" FOREIGN KEY ("outbox_event_id") REFERENCES "outbox_events"("id");--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_disease_id_diseases_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id");--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_disease_id_diseases_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id");--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_vaccine_id_vaccines_id_fkey" FOREIGN KEY ("vaccine_id") REFERENCES "vaccines"("id");--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_batch_id_vaccine_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "vaccine_batches"("id");--> statement-breakpoint
ALTER TABLE "vaccine_batches" ADD CONSTRAINT "vaccine_batches_vaccine_id_vaccines_id_fkey" FOREIGN KEY ("vaccine_id") REFERENCES "vaccines"("id");--> statement-breakpoint
ALTER TABLE "vaccine_diseases" ADD CONSTRAINT "vaccine_diseases_vaccine_id_vaccines_id_fkey" FOREIGN KEY ("vaccine_id") REFERENCES "vaccines"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vaccine_diseases" ADD CONSTRAINT "vaccine_diseases_disease_id_diseases_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "diseases"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_zip_code_id_zip_codes_id_fkey" FOREIGN KEY ("zip_code_id") REFERENCES "zip_codes"("id");--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_commune_id_communes_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id");--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_admin_unit_id_admin_units_id_fkey" FOREIGN KEY ("admin_unit_id") REFERENCES "admin_units"("id");--> statement-breakpoint
ALTER TABLE "zip_codes" ADD CONSTRAINT "zip_codes_state_id_states_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id");--> statement-breakpoint
ALTER TABLE "farm_books" ADD CONSTRAINT "farm_books_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "farm_subjects" ADD CONSTRAINT "farm_subjects_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "farm_subjects" ADD CONSTRAINT "farm_subjects_subject_id_subjects_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_address_id_addresses_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id");--> statement-breakpoint
ALTER TABLE "vs_assignments" ADD CONSTRAINT "vs_assignments_contract_id_vs_contracts_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "vs_contracts"("id");--> statement-breakpoint
ALTER TABLE "vs_assignments" ADD CONSTRAINT "vs_assignments_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "vs_contracts" ADD CONSTRAINT "vs_contracts_subject_id_subjects_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id");--> statement-breakpoint
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "module_business_rules" ADD CONSTRAINT "module_business_rules_module_id_modules_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "module_business_rules" ADD CONSTRAINT "module_business_rules_business_rule_id_business_rules_id_fkey" FOREIGN KEY ("business_rule_id") REFERENCES "business_rules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "org_areas" ADD CONSTRAINT "org_areas_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");--> statement-breakpoint
CREATE POLICY "geofence_event_access_policy" ON "animal_geofence_events" AS PERMISSIVE FOR ALL TO public USING ((
				current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
				OR ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("animal_geofence_events"."farm_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "animal_geofence_events"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  ))
			));--> statement-breakpoint
CREATE POLICY "animal_parent_access_policy" ON "animal_parents" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("animal_parents"."animal_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "animal_parents"."animal_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  ));--> statement-breakpoint
CREATE POLICY "animal_access_policy" ON "animals" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("animals"."current_farm_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "animals"."current_farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN']));--> statement-breakpoint
CREATE POLICY "archive_document_access_policy" ON "archive_documents" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN'])
            AND (farm_org_id("archive_documents"."farm_id") = current_setting('app.current_org_id', true)::uuid
                 OR "archive_documents"."farm_id" IS NULL))
      ));--> statement-breakpoint
CREATE POLICY "birth_notification_access_policy" ON "birth_notifications" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN'])
            AND (farm_org_id("birth_notifications"."farm_id") = current_setting('app.current_org_id', true)::uuid
                 OR "birth_notifications"."assigned_to" = current_setting('app.current_user_id', true)::uuid))
        OR (current_setting('app.current_role', true) = $1
            AND "birth_notifications"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN']));--> statement-breakpoint
CREATE POLICY "cattle_passport_access_policy" ON "cattle_passports" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN'])
            AND farm_org_id("cattle_passports"."farm_id") = current_setting('app.current_org_id', true)::uuid)
        OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP'])
            AND "cattle_passports"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
      ));--> statement-breakpoint
CREATE POLICY "ear_tag_allocation_access_policy" ON "ear_tag_allocations" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("ear_tag_allocations"."farm_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "ear_tag_allocations"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "ear_tag_order_access_policy" ON "ear_tag_orders" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR "ear_tag_orders"."organization_id" = current_setting('app.current_org_id', true)::uuid
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "ear_tag_replacement_access_policy" ON "ear_tag_replacements" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("ear_tag_replacements"."farm_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "ear_tag_replacements"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "ear_tag_takeover_access_policy" ON "ear_tag_takeovers" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR "ear_tag_takeovers"."supplier_organization_id" = current_setting('app.current_org_id', true)::uuid
      )) WITH CHECK ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR "ear_tag_takeovers"."supplier_organization_id" = current_setting('app.current_org_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "ear_tag_type_access_policy" ON "ear_tag_types" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "ear_tag_access_policy" ON "ear_tags" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR "ear_tags"."allocation_id" IN (
    SELECT eta.id FROM ear_tag_allocations eta
    JOIN farm_subjects fs ON eta.farm_id = fs.farm_id
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  )
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "error_correction_access_policy" ON "error_corrections" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN'])
            AND (farm_org_id("error_corrections"."farm_id") = current_setting('app.current_org_id', true)::uuid
                 OR "error_corrections"."farm_id" IS NULL))
        OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP'])
            AND "error_corrections"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
      ));--> statement-breakpoint
CREATE POLICY "form_reprint_access_policy" ON "form_reprints" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN'])
            AND farm_org_id("form_reprints"."farm_id") = current_setting('app.current_org_id', true)::uuid)
        OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP'])
            AND "form_reprints"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
      ));--> statement-breakpoint
CREATE POLICY "geofence_access_policy" ON "geofences" AS PERMISSIVE FOR ALL TO public USING ((
				current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
				OR ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("geofences"."farm_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "geofences"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  ))
			)) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "import_export_access_policy" ON "import_export_records" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN'])
            AND (farm_org_id("import_export_records"."from_farm_id") = current_setting('app.current_org_id', true)::uuid
                 OR farm_org_id("import_export_records"."to_farm_id") = current_setting('app.current_org_id', true)::uuid))
        OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP'])
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
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN'])
            AND farm_org_id("inspections"."farm_id") = current_setting('app.current_org_id', true)::uuid)
      ));--> statement-breakpoint
CREATE POLICY "iot_device_access_policy" ON "iot_devices" AS PERMISSIVE FOR ALL TO public USING ((
				current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
				OR ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("iot_devices"."assigned_to_farm_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "iot_devices"."assigned_to_farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  ))
			)) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "movement_access_policy" ON "movements" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN'])
            AND (farm_org_id("movements"."from_farm_id") = current_setting('app.current_org_id', true)::uuid
                 OR farm_org_id("movements"."to_farm_id") = current_setting('app.current_org_id', true)::uuid))
        OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP'])
            AND ("movements"."from_farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  )
                 OR "movements"."to_farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  )))
      ));--> statement-breakpoint
CREATE POLICY "pasture_access_policy" ON "pasture_declarations" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = $1
            AND (farm_org_id("pasture_declarations"."from_farm_id") = current_setting('app.current_org_id', true)::uuid
                 OR farm_org_id("pasture_declarations"."to_farm_id") = current_setting('app.current_org_id', true)::uuid))
        OR (current_setting('app.current_role', true) = $2
            AND ("pasture_declarations"."from_farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  )
                 OR "pasture_declarations"."to_farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  )))
      ));--> statement-breakpoint
CREATE POLICY "pda_device_access_policy" ON "pda_devices" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "sensor_reading_access_policy" ON "sensor_readings" AS PERMISSIVE FOR ALL TO public USING ((
				current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
				OR ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("sensor_readings"."farm_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "sensor_readings"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  ))
			));--> statement-breakpoint
CREATE POLICY "event_subscription_access_policy" ON "event_subscriptions" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR "event_subscriptions"."created_by" = current_setting('app.current_user_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "reminder_access_policy" ON "reminders" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR "reminders"."user_id" = current_setting('app.current_user_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "disease_access_policy" ON "diseases" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "lab_test_access_policy" ON "lab_tests" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("lab_tests"."farm_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "lab_tests"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN']));--> statement-breakpoint
CREATE POLICY "treatment_access_policy" ON "treatments" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("treatments"."farm_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "treatments"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN']));--> statement-breakpoint
CREATE POLICY "vaccination_access_policy" ON "vaccinations" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("vaccinations"."farm_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "vaccinations"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN']));--> statement-breakpoint
CREATE POLICY "vaccine_batch_access_policy" ON "vaccine_batches" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "vaccine_disease_access_policy" ON "vaccine_diseases" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "vaccine_access_policy" ON "vaccines" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "address_access_policy" ON "addresses" AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "farm_book_access_policy" ON "farm_books" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("farm_books"."farm_id") = current_setting('app.current_org_id', true)::uuid)
      ));--> statement-breakpoint
CREATE POLICY "farm_subject_access_policy" ON "farm_subjects" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("farm_subjects"."farm_id") = current_setting('app.current_org_id', true)::uuid)
        OR "farm_subjects"."subject_id" = current_setting('app.current_user_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "farm_access_policy" ON "farms" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("farms"."id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "farms"."id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN']));--> statement-breakpoint
CREATE POLICY "subject_access_policy" ON "subjects" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN'])
        OR "subjects"."id" IN (
          SELECT fs.subject_id FROM farm_subjects fs
          WHERE farm_org_id(fs.farm_id) = current_setting('app.current_org_id', true)::uuid
        )
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "sync_error_access_policy" ON "sync_errors" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR (current_setting('app.current_role', true) = $1 AND farm_org_id("sync_errors"."farm_id") = current_setting('app.current_org_id', true)::uuid)
      ));--> statement-breakpoint
CREATE POLICY "vs_assignment_access_policy" ON "vs_assignments" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
    OR (current_setting('app.current_role', true) = ANY(ARRAY['VETERINARIAN', 'TECHNICIAN']) AND farm_org_id("vs_assignments"."farm_id") = current_setting('app.current_org_id', true)::uuid)
    OR (current_setting('app.current_role', true) = ANY(ARRAY['FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP']) AND "vs_assignments"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "vs_contract_access_policy" ON "vs_contracts" AS PERMISSIVE FOR ALL TO public USING ((current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])));--> statement-breakpoint
CREATE POLICY "audit_log_access_policy" ON "audit_log" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN'])
        OR "audit_log"."user_id" = current_setting('app.current_user_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "device_tokens_access_policy" ON "device_tokens" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR "device_tokens"."user_id" = current_setting('app.current_user_id', true)::uuid
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "notification_preference_access_policy" ON "notification_preferences" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR "notification_preferences"."user_id" = current_setting('app.current_user_id', true)::uuid
      )) WITH CHECK ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR "notification_preferences"."user_id" = current_setting('app.current_user_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "notification_template_access_policy" ON "notification_templates" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "notification_access_policy" ON "notifications" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR "notifications"."user_id" = current_setting('app.current_user_id', true)::uuid
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF']));--> statement-breakpoint
CREATE POLICY "org_area_access_policy" ON "org_areas" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR "org_areas"."organization_id" = current_setting('app.current_org_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "org_access_policy" ON "organizations" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN'])
        OR "organizations"."id" = current_setting('app.current_org_id', true)::uuid
        OR "organizations"."parent_id" = current_setting('app.current_org_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "user_role_access_policy" ON "user_roles" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN'])
        OR "user_roles"."user_id" = current_setting('app.current_user_id', true)::uuid
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN']));--> statement-breakpoint
CREATE POLICY "session_access_policy" ON "user_sessions" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN'])
        OR "user_sessions"."user_id" = current_setting('app.current_user_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "user_access_policy" ON "users" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN'])
        OR (current_setting('app.current_role', true) = $1
            AND "users"."organization_id" = current_setting('app.current_org_id', true)::uuid)
        OR "users"."id" = current_setting('app.current_user_id', true)::uuid
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN']));