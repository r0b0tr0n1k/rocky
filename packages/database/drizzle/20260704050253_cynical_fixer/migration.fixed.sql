CREATE TYPE "admin_roles" AS ENUM('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF');--> statement-breakpoint
CREATE TYPE "allocation_status" AS ENUM('PENDING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "allocation_type" AS ENUM('INITIAL_ALLOCATION', 'ROUTINE_ALLOCATION', 'RETURN');--> statement-breakpoint
CREATE TYPE "animal_status" AS ENUM('alive', 'dead', 'slaughtered', 'sold', 'exported', 'imported', 'missing', 'stillborn');--> statement-breakpoint
CREATE TYPE "approval_action" AS ENUM('APPROVE', 'REJECT', 'REQUEST_CHANGES');--> statement-breakpoint
CREATE TYPE "audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'IMPORT');--> statement-breakpoint
CREATE TYPE "birth_notification_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "birth_type" AS ENUM('single', 'twin', 'triplet', 'stillborn');--> statement-breakpoint
CREATE TYPE "contingent_type" AS ENUM('supplier', 'vd', 'vs');--> statement-breakpoint
CREATE TYPE "data_source" AS ENUM('aimcs', 'hk_imp', 'hk_pda', 'mobile', 'api', 'batch');--> statement-breakpoint
CREATE TYPE "death_cause" AS ENUM('DEATH_REGISTERED', 'DEATH_UNREGISTERED', 'DEATH_UNREGISTERED_IMPORT', 'STILLBORN', 'DEATH_AFTER_BIRTH');--> statement-breakpoint
CREATE TYPE "delivery_method" AS ENUM('HK_IMP', 'HK_PDA');--> statement-breakpoint
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
CREATE TYPE "farm_read_roles" AS ENUM('FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP', 'SUPPLIER');--> statement-breakpoint
CREATE TYPE "farm_type" AS ENUM('farm', 'slaughterhouse', 'livestock_market', 'pasture_mountain', 'pasture_village', 'bip', 'trader_yard', 'quarantine', 'other');--> statement-breakpoint
CREATE TYPE "holding_type" AS ENUM('FARM', 'SUBJECT', 'ADDRESS');--> statement-breakpoint
CREATE TYPE "language" AS ENUM('MK', 'EN');--> statement-breakpoint
CREATE TYPE "module_type" AS ENUM('CORE', 'FEATURE', 'INTEGRATION', 'REPORT', 'ADMIN');--> statement-breakpoint
CREATE TYPE "movement_type" AS ENUM('sale', 'purchase', 'market_sale', 'market_purchase', 'transfer', 'birth_registration', 'death', 'home_slaughter', 'slaughterhouse', 'pasture_departure', 'pasture_return', 'import', 'export', 'alpine_departure', 'alpine_return', 'correction');--> statement-breakpoint
CREATE TYPE "notification_category" AS ENUM('ear_tag_expiration', 'ear_tag_low_stock', 'ear_tag_allocation', 'ear_tag_replacement_request', 'ear_tag_replacement_approved', 'birth_tagging_deadline', 'animal_movement_request', 'animal_movement_verification', 'animal_health_alert', 'farm_registration_pending', 'farm_verification_required', 'farm_approved', 'farm_rejected', 'system_maintenance', 'system_error', 'system_update', 'user_invite', 'user_password_reset', 'user_role_changed', 'user_login_alert', 'inspection_due', 'inspection_overdue', 'quarantine_alert', 'disease_outbreak', 'report_generated', 'report_failed', 'data_sync_complete', 'data_sync_failed');--> statement-breakpoint
CREATE TYPE "notification_priority" AS ENUM('low', 'normal', 'high', 'urgent', 'critical');--> statement-breakpoint
CREATE TYPE "notification_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "notification_type" AS ENUM('email', 'sms', 'push', 'in_app', 'webhook');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('pending', 'collected', 'delivered', 'partially_delivered', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "org_read_roles" AS ENUM('VETERINARIAN', 'TECHNICIAN');--> statement-breakpoint
CREATE TYPE "org_type" AS ENUM('VD', 'VET_CLINIC', 'SLAUGHTERHOUSE', 'LIVESTOCK_MARKET', 'SUPPLIER', 'FARM_ASSOCIATION', 'GOVERNMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "parent_type" AS ENUM('MOTHER', 'FATHER');--> statement-breakpoint
CREATE TYPE "pasture_type" AS ENUM('MOUNTAIN', 'VILLAGE');--> statement-breakpoint
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
CREATE TYPE "subject_role" AS ENUM('owner', 'keeper', 'veterinarian', 'trader', 'slaughterhouse_op', 'market_op', 'technician', 'guardian');--> statement-breakpoint
CREATE TYPE "sync_error_type" AS ENUM('PARSE_ERROR', 'VALIDATION_ERROR', 'NETWORK_ERROR', 'DUPLICATE', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "tag_category" AS ENUM('ELECTRONIC', 'VISUAL', 'BOTH');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN', 'TECHNICIAN', 'SLAUGHTERHOUSE_OP', 'SUPPLIER', 'MARKET_OP', 'FARMER');--> statement-breakpoint
CREATE TYPE "user_status" AS ENUM('active', 'inactive', 'blocked', 'pending_verification');--> statement-breakpoint
CREATE TYPE "verification_status" AS ENUM('draft', 'pending_vd_approval', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "weighing_type" AS ENUM('LIVE_WEIGHT', 'WARM_HALVES');--> statement-breakpoint
CREATE TYPE "write_roles" AS ENUM('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN', 'SUPPLIER');--> statement-breakpoint
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
	"valid_to" timestamp
);
--> statement-breakpoint
ALTER TABLE "animals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
CREATE TABLE "ear_tag_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"legacy_id" integer UNIQUE,
	"farm_id" uuid NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "pasture_declarations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "slaughter_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"animal_id" uuid,
	"from_farm_id" uuid,
	"slaughterhouse_id" uuid NOT NULL,
	"arrival_date" date,
	"slaughter_date" date NOT NULL,
	"slaughter_number" varchar(50),
	"mass_type" "weighing_type",
	"mass" integer,
	"import_country" varchar(3),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "slaughter_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	"note" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "sync_errors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	"password_hash" varchar(255) NOT NULL,
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
CREATE INDEX "idx_animal_parents_animal" ON "animal_parents" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_animal_parents_parent" ON "animal_parents" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_animals_ear_tag" ON "animals" ("state_code","ear_tag_number");--> statement-breakpoint
CREATE INDEX "idx_animals_farm" ON "animals" ("current_farm_id");--> statement-breakpoint
CREATE INDEX "idx_animals_status" ON "animals" ("status");--> statement-breakpoint
CREATE INDEX "idx_animals_mother" ON "animals" ("mother_id");--> statement-breakpoint
CREATE INDEX "idx_birth_notifications_farm" ON "birth_notifications" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_birth_notifications_status" ON "birth_notifications" ("status");--> statement-breakpoint
CREATE INDEX "idx_birth_notifications_deadline" ON "birth_notifications" ("tagging_deadline");--> statement-breakpoint
CREATE INDEX "idx_birth_notifications_assigned" ON "birth_notifications" ("assigned_to");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ear_tag_allocations_number" ON "ear_tag_allocations" ("allocation_number");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_allocations_farm" ON "ear_tag_allocations" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_allocations_date" ON "ear_tag_allocations" ("allocation_date");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_allocations_status" ON "ear_tag_allocations" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ear_tag_orders_number" ON "ear_tag_orders" ("order_number");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_orders_org" ON "ear_tag_orders" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_orders_supplier" ON "ear_tag_orders" ("supplier_organization_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_orders_date" ON "ear_tag_orders" ("order_date");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_orders_status" ON "ear_tag_orders" ("status");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_replacements_number" ON "ear_tag_replacements" ("replacement_number");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_replacements_animal" ON "ear_tag_replacements" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_replacements_farm" ON "ear_tag_replacements" ("farm_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_replacements_status" ON "ear_tag_replacements" ("status");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_replacements_date" ON "ear_tag_replacements" ("reported_date");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ear_tag_types_code" ON "ear_tag_types" ("code");--> statement-breakpoint
CREATE INDEX "idx_ear_tag_types_category" ON "ear_tag_types" ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ear_tags_tag" ON "ear_tags" ("state_code","tag_number");--> statement-breakpoint
CREATE INDEX "idx_ear_tags_status" ON "ear_tags" ("status");--> statement-breakpoint
CREATE INDEX "idx_ear_tags_type" ON "ear_tags" ("type_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tags_order" ON "ear_tags" ("order_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tags_allocation" ON "ear_tags" ("allocation_id");--> statement-breakpoint
CREATE INDEX "idx_ear_tags_animal" ON "ear_tags" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_movements_animal" ON "movements" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_movements_date" ON "movements" ("movement_date");--> statement-breakpoint
CREATE INDEX "idx_movements_type" ON "movements" ("type");--> statement-breakpoint
CREATE INDEX "idx_movements_from" ON "movements" ("from_farm_id");--> statement-breakpoint
CREATE INDEX "idx_movements_to" ON "movements" ("to_farm_id");--> statement-breakpoint
CREATE INDEX "idx_movements_parent" ON "movements" ("parent_movement_id");--> statement-breakpoint
CREATE INDEX "idx_pasture_from" ON "pasture_declarations" ("from_farm_id");--> statement-breakpoint
CREATE INDEX "idx_pasture_to" ON "pasture_declarations" ("to_farm_id");--> statement-breakpoint
CREATE INDEX "idx_pasture_type" ON "pasture_declarations" ("pasture_type");--> statement-breakpoint
CREATE INDEX "idx_slaughter_animal" ON "slaughter_records" ("animal_id");--> statement-breakpoint
CREATE INDEX "idx_slaughter_house" ON "slaughter_records" ("slaughterhouse_id");--> statement-breakpoint
CREATE INDEX "idx_slaughter_date" ON "slaughter_records" ("slaughter_date");--> statement-breakpoint
CREATE INDEX "idx_addresses_zip" ON "addresses" ("zip_code_id");--> statement-breakpoint
CREATE INDEX "idx_addresses_commune" ON "addresses" ("commune_id");--> statement-breakpoint
CREATE INDEX "idx_addresses_city" ON "addresses" ("city");--> statement-breakpoint
CREATE INDEX "idx_admin_units_auid" ON "admin_units" ("au_id");--> statement-breakpoint
CREATE INDEX "idx_communes_name" ON "communes" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_states_short_name" ON "states" ("short_name");--> statement-breakpoint
CREATE INDEX "idx_zip_codes_code" ON "zip_codes" ("zip_code");--> statement-breakpoint
CREATE INDEX "idx_zip_codes_state" ON "zip_codes" ("state_id");--> statement-breakpoint
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
CREATE INDEX "idx_audit_resource" ON "audit_log" ("resource","resource_id");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_log" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_action" ON "audit_log" ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_created" ON "audit_log" ("created_at");--> statement-breakpoint
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
ALTER TABLE "animal_parents" ADD CONSTRAINT "animal_parents_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "animal_parents" ADD CONSTRAINT "animal_parents_parent_id_animals_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "animals"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "animals" ADD CONSTRAINT "animals_current_farm_id_farms_id_fkey" FOREIGN KEY ("current_farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "birth_notifications" ADD CONSTRAINT "birth_notifications_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "ear_tag_allocations" ADD CONSTRAINT "ear_tag_allocations_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
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
ALTER TABLE "ear_tags" ADD CONSTRAINT "ear_tags_type_id_ear_tag_types_id_fkey" FOREIGN KEY ("type_id") REFERENCES "ear_tag_types"("id");--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_animal_id_animals_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id");--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_from_farm_id_farms_id_fkey" FOREIGN KEY ("from_farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_to_farm_id_farms_id_fkey" FOREIGN KEY ("to_farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_auth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_zip_code_id_zip_codes_id_fkey" FOREIGN KEY ("zip_code_id") REFERENCES "zip_codes"("id");--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_commune_id_communes_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id");--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_admin_unit_id_admin_units_id_fkey" FOREIGN KEY ("admin_unit_id") REFERENCES "admin_units"("id");--> statement-breakpoint
ALTER TABLE "zip_codes" ADD CONSTRAINT "zip_codes_state_id_states_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id");--> statement-breakpoint
ALTER TABLE "farm_subjects" ADD CONSTRAINT "farm_subjects_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "farm_subjects" ADD CONSTRAINT "farm_subjects_subject_id_subjects_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_address_id_addresses_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id");--> statement-breakpoint
ALTER TABLE "module_business_rules" ADD CONSTRAINT "module_business_rules_module_id_modules_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "module_business_rules" ADD CONSTRAINT "module_business_rules_business_rule_id_business_rules_id_fkey" FOREIGN KEY ("business_rule_id") REFERENCES "business_rules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "org_areas" ADD CONSTRAINT "org_areas_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id");--> statement-breakpoint
CREATE POLICY "animal_parent_access_policy" ON "animal_parents" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
    OR (current_setting('app.current_role', true) = ANY(('VETERINARIAN', 'TECHNICIAN')) AND "animal_parents"."animal_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
    OR (current_setting('app.current_role', true) = ANY(('FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP', 'SUPPLIER')) AND "animal_parents"."animal_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  ));--> statement-breakpoint
CREATE POLICY "animal_access_policy" ON "animals" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
    OR (current_setting('app.current_role', true) = ANY(('VETERINARIAN', 'TECHNICIAN')) AND "animals"."current_farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
    OR (current_setting('app.current_role', true) = ANY(('FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP', 'SUPPLIER')) AND "animals"."current_farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN', 'TECHNICIAN')));--> statement-breakpoint
CREATE POLICY "birth_notification_access_policy" ON "birth_notifications" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
        OR (current_setting('app.current_role', true) = ANY(('VETERINARIAN', 'TECHNICIAN'))
            AND ("birth_notifications"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  )
                 OR "birth_notifications"."assigned_to" = current_setting('app.current_user_id', true)::uuid))
        OR (current_setting('app.current_role', true) = 'FARMER'
            AND "birth_notifications"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN', 'TECHNICIAN')));--> statement-breakpoint
CREATE POLICY "ear_tag_allocation_access_policy" ON "ear_tag_allocations" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
    OR (current_setting('app.current_role', true) = ANY(('VETERINARIAN', 'TECHNICIAN')) AND "ear_tag_allocations"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
    OR (current_setting('app.current_role', true) = ANY(('FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP', 'SUPPLIER')) AND "ear_tag_allocations"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')));--> statement-breakpoint
CREATE POLICY "ear_tag_order_access_policy" ON "ear_tag_orders" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN'])
        OR "ear_tag_orders"."organizationId" = current_setting('app.current_org_id', true)::uuid
        OR "ear_tag_orders"."supplierOrganizationId" = current_setting('app.current_org_id', true)::uuid
      )) WITH CHECK ((
        current_setting('app.current_role', true) = ANY(ARRAY['SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'])
        OR "ear_tag_orders"."organizationId" = current_setting('app.current_org_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "ear_tag_replacement_access_policy" ON "ear_tag_replacements" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
    OR (current_setting('app.current_role', true) = ANY(('VETERINARIAN', 'TECHNICIAN')) AND "ear_tag_replacements"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
    OR (current_setting('app.current_role', true) = ANY(('FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP', 'SUPPLIER')) AND "ear_tag_replacements"."farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')));--> statement-breakpoint
CREATE POLICY "ear_tag_type_access_policy" ON "ear_tag_types" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')));--> statement-breakpoint
CREATE POLICY "ear_tag_access_policy" ON "ear_tags" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
        OR "ear_tags"."allocation_id" IN (
    SELECT eta.id FROM ear_tag_allocations eta
    JOIN farm_subjects fs ON eta.farm_id = fs.farm_id
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  )
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')));--> statement-breakpoint
CREATE POLICY "movement_access_policy" ON "movements" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
        OR (current_setting('app.current_role', true) = ANY(('VETERINARIAN', 'TECHNICIAN'))
            AND ("movements"."from_farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  )
                 OR "movements"."to_farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  )))
        OR (current_setting('app.current_role', true) = ANY(('FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP', 'SUPPLIER'))
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
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
        OR (current_setting('app.current_role', true) = 'VETERINARIAN'
            AND ("pasture_declarations"."from_farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  )
                 OR "pasture_declarations"."to_farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  )))
        OR (current_setting('app.current_role', true) = 'TECHNICIAN'
            AND ("pasture_declarations"."from_farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  )
                 OR "pasture_declarations"."to_farm_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  )))
      ));--> statement-breakpoint
CREATE POLICY "slaughter_access_policy" ON "slaughter_records" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
        OR (current_setting('app.current_role', true) = 'VETERINARIAN'
            AND "slaughter_records"."slaughterhouse_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
        OR (current_setting('app.current_role', true) = 'TECHNICIAN'
            AND "slaughter_records"."slaughterhouse_id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
      ));--> statement-breakpoint
CREATE POLICY "address_access_policy" ON "addresses" AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')));--> statement-breakpoint
CREATE POLICY "farm_subject_access_policy" ON "farm_subjects" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
        OR (current_setting('app.current_role', true) = ANY(('VETERINARIAN', 'TECHNICIAN')) AND "farm_subjects"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
        OR "farm_subjects"."subject_id" = current_setting('app.current_user_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "farm_access_policy" ON "farms" AS PERMISSIVE FOR ALL TO public USING ((
    current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
    OR (current_setting('app.current_role', true) = ANY(('VETERINARIAN', 'TECHNICIAN')) AND "farms"."id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
    OR (current_setting('app.current_role', true) = ANY(('FARMER', 'SLAUGHTERHOUSE_OP', 'MARKET_OP', 'SUPPLIER')) AND "farms"."id" IN (
    SELECT fs.farm_id FROM farm_subjects fs
    WHERE fs.subject_id = current_setting('app.current_user_id', true)::uuid
  ))
  )) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN', 'TECHNICIAN')));--> statement-breakpoint
CREATE POLICY "subject_access_policy" ON "subjects" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF', 'VETERINARIAN'))
        OR "subjects"."id" IN (
          SELECT fs.subject_id FROM farm_subjects fs
          WHERE fs.farm_id IN (
            SELECT fs2.farm_id FROM farm_subjects fs2
            WHERE fs2.subject_id = current_setting('app.current_user_id', true)::uuid
          )
        )
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')));--> statement-breakpoint
CREATE POLICY "sync_error_access_policy" ON "sync_errors" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
        OR (current_setting('app.current_role', true) = 'VETERINARIAN' AND "sync_errors"."farm_id" IN (
    SELECT f.id FROM farms f
    JOIN addresses a ON f.address_id = a.id
    JOIN org_areas oa ON a.commune_id = oa.commune_id
    WHERE oa.organization_id = current_setting('app.current_org_id', true)::uuid
  ))
      ));--> statement-breakpoint
CREATE POLICY "audit_log_access_policy" ON "audit_log" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN'))
        OR "audit_log"."user_id" = current_setting('app.current_user_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "notification_preference_access_policy" ON "notification_preferences" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
        OR "notification_preferences"."user_id" = current_setting('app.current_user_id', true)::uuid
      )) WITH CHECK ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
        OR "notification_preferences"."user_id" = current_setting('app.current_user_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "notification_template_access_policy" ON "notification_templates" AS PERMISSIVE FOR ALL TO public USING (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')));--> statement-breakpoint
CREATE POLICY "notification_access_policy" ON "notifications" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
        OR "notifications"."user_id" = current_setting('app.current_user_id', true)::uuid
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF')));--> statement-breakpoint
CREATE POLICY "org_area_access_policy" ON "org_areas" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN', 'VD_STAFF'))
        OR "org_areas"."organization_id" = current_setting('app.current_org_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "org_access_policy" ON "organizations" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN'))
        OR "organizations"."id" = current_setting('app.current_org_id', true)::uuid
        OR "organizations"."parent_id" = current_setting('app.current_org_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "user_role_access_policy" ON "user_roles" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN'))
        OR "user_roles"."user_id" = current_setting('app.current_user_id', true)::uuid
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN')));--> statement-breakpoint
CREATE POLICY "session_access_policy" ON "user_sessions" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN'))
        OR "user_sessions"."user_id" = current_setting('app.current_user_id', true)::uuid
      ));--> statement-breakpoint
CREATE POLICY "user_access_policy" ON "users" AS PERMISSIVE FOR ALL TO public USING ((
        current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN'))
        OR (current_setting('app.current_role', true) = 'VD_STAFF'
            AND "users"."organization_id" = current_setting('app.current_org_id', true)::uuid)
        OR "users"."id" = current_setting('app.current_user_id', true)::uuid
      )) WITH CHECK (current_setting('app.current_role', true) = ANY(('SUPER_ADMIN', 'VD_ADMIN')));