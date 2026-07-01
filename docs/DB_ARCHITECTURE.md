# Drizzle ORM PostgreSQL — Modern AIMCS Database Architecture

## Overview

Complete database architecture for the modern AIMCS using:

- **Drizzle ORM** — Type-safe PostgreSQL query builder (replaces Oracle PL/SQL)
- **PostgreSQL 16+** — SSOT with PostGIS, pgcrypto, pg_stat_statements
- **Zod 4** — Runtime validation with inferable types (replaces legacy business rules engine)
- **tRPC** — End-to-end type-safe API (replaces Oracle Forms + IAS file exchange)

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                   tRPC API Layer                                │
│                                                                  │
│  ┌───────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │ Public tRPC        │  │ Admin tRPC       │  │ Internal tRPC │ │
│  │ (Expo mobile)      │  │ (Next.js Admin)  │  │ (Server-only) │ │
│  └────────┬──────────┘  └────────┬────────┘  └───────┬───────┘ │
└───────────┼──────────────────────┼────────────────────┼─────────┘
            │                      │                    │
┌───────────┼──────────────────────┼────────────────────┼─────────┐
│           ▼                      ▼                    ▼         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           Zod 4 Validation Layer (@prasici/validators)    │  │
│  │                                                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │ Holdings │ │ Keepers  │ │ Animals  │ │ Movements    │ │  │
│  │  │ Valid    │ │ Valid    │ │ Valid    │ │ Valid        │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │  │
│  │  │Eartags   │ │ Birth    │ │Slaughter │ │ Business     │ │  │
│  │  │Valid     │ │ Valid    │ │ Valid    │ │ Rules (Zod)  │ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────┐
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Drizzle ORM — PostgreSQL Schema               │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  sm/  — System Management (18 tables)               │  │  │
│  │  │  hk/  — Holder Keeper (10 tables)                   │  │  │
│  │  │  an/  — Animals & Movements (5 tables)              │  │  │
│  │  │  et/  — Ear Tags (5 tables)                         │  │  │
│  │  │  gn/  — Risk Analysis (5 tables)                    │  │  │
│  │  │  in/  — Inspections (2 tables)                      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────┐
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL 16 with Extensions                 │  │
│  │                                                           │  │
│  │  • PostGIS (geometry) for coordinates                     │  │
│  │  • pgcrypto for UUID gen + hashing                        │  │
│  │  • pg_stat_statements for monitoring                      │  │
│  │  • pg_partman for partitioning (movements, audit)         │  │
│  │  • pg_cron for scheduled analysis jobs                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Complete Enum Definitions

### 1.1 All PostgreSQL Enums (24 enums)

```sql
-- ============================================================
-- SYSTEM MANAGEMENT ENUMS
-- ============================================================

CREATE TYPE user_status AS ENUM (
    'ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING_VERIFICATION'
);

CREATE TYPE role_name AS ENUM (
    'SUPER_ADMIN',        -- Full system access
    'VD_ADMIN',           -- Veterinary Department admin
    'VD_STAFF',           -- VD data reviewers
    'VS_MANAGER',         -- Veterinary Station manager
    'VETERINARIAN',       -- Field vet (PDA user)
    'TECHNICIAN',         -- Tagging technician
    'SUPPLIER',           -- Ear tag supplier
    'FARMER',             -- End user / keeper
    'INSPECTOR',          -- On-spot inspector
    'SLAUGHTERHOUSE_OP',  -- Slaughterhouse operator
    'MARKET_OP',          -- Livestock market operator
    'REPORT_VIEWER'       -- Read-only reports
);

CREATE TYPE permission_action AS ENUM (
    'CREATE', 'READ', 'UPDATE', 'DELETE',
    'APPROVE', 'REJECT', 'CONFIRM', 'CANCEL'
);

CREATE TYPE resource_type AS ENUM (
    'FARM', 'SUBJECT', 'ANIMAL', 'MOVEMENT',
    'EARTAG', 'BIRTH', 'SLAUGHTER', 'INSPECTION',
    'RISK_ANALYSIS', 'USER', 'ROLE', 'ORGANIZATION',
    'CODE_TABLE', 'SYSTEM_PARAM', 'REPORT', 'AUDIT_LOG'
);

CREATE TYPE organization_type AS ENUM (
    'VD',               -- Veterinary Department
    'VS',               -- Veterinary Station
    'SLAUGHTERHOUSE',   -- Abattoir
    'LIVESTOCK_MARKET', -- Market/Fair
    'BIP',              -- Border Inspection Post
    'PASTURE',          -- Alpine/village pasture
    'TRADER',           -- Livestock trader
    'SUPPLIER',         -- Ear tag manufacturer/supplier
    'FARM'              -- Individual farm
);

CREATE TYPE module_name AS ENUM (
    'HOLDINGS', 'KEEPERS', 'ANIMALS', 'MOVEMENTS',
    'EARTAGS', 'BIRTHS', 'SLAUGHTER', 'PASTURE',
    'INSPECTIONS', 'RISK_ANALYSIS', 'REPORTS',
    'SYSTEM', 'SYNC', 'AUDIT'
);

CREATE TYPE language_code AS ENUM (
    'MK', 'EN', 'SQ', 'SR'
);

CREATE TYPE code_table_scope AS ENUM (
    'GLOBAL', 'ORGANIZATION', 'REGION', 'USER'
);

-- ============================================================
-- HOLDER KEEPER ENUMS
-- ============================================================

CREATE TYPE verification_status AS ENUM (
    'DRAFT',                    -- Being filled on mobile
    'PENDING_VD_APPROVAL',      -- Submitted, awaiting VD review (replaces temp tables)
    'APPROVED',                 -- VD confirmed
    'REJECTED',                 -- VD rejected with reason
    'ARCHIVED'                  -- Soft-deleted / superseded
);

CREATE TYPE farm_type AS ENUM (
    'FARM',                -- Ordinary livestock farm
    'SLAUGHTERHOUSE',      -- Registered slaughterhouse
    'LIVESTOCK_MARKET',    -- Market/fair
    'PASTURE_MOUNTAIN',    -- Alpine summer pasture
    'PASTURE_VILLAGE',     -- Village communal pasture
    'BIP',                 -- Border inspection post
    'TRADER_YARD',         -- Trader's holding
    'QUARANTINE',          -- Quarantine facility
    'OTHER'                -- Other registered holding
);

CREATE TYPE subject_role AS ENUM (
    'OWNER',               -- Farm owner
    'KEEPER',              -- Animal keeper (may differ from owner)
    'VETERINARIAN',        -- Assigned vet
    'TRADER',              -- Livestock trader role
    'SLAUGHTERHOUSE_OP',   -- Slaughterhouse operator
    'MARKET_OP',           -- Market operator
    'TECHNICIAN',          -- Tagging technician
    'GUARDIAN'             -- Temporary caretaker
);

CREATE TYPE data_source AS ENUM (
    'AIMCS',   -- Direct system entry
    'HK_IMP',  -- Imported from flat file (legacy)
    'HK_PDA',  -- From PDA synced data (legacy)
    'MOBILE',  -- From Expo mobile app
    'API',     -- External API integration
    'BATCH'    -- Batch import
);

CREATE TYPE audit_action AS ENUM (
    'CREATED', 'UPDATED', 'DELETED', 'VERIFIED',
    'APPROVED', 'REJECTED', 'ARCHIVED', 'RESTORED',
    'IMPORTED', 'EXPORTED', 'SYNCED'
);

-- ============================================================
-- ANIMALS & MOVEMENTS ENUMS
-- ============================================================

CREATE TYPE sex AS ENUM ('MALE', 'FEMALE');

CREATE TYPE animal_status AS ENUM (
    'ALIVE',                  -- Currently alive on holding
    'DEAD',                   -- Died (natural/home slaughter)
    'SLAUGHTERED',            -- Slaughtered at registered abattoir
    'SOLD',                   -- Sold (movement completed)
    'EXPORTED',               -- Exported from country
    'IMPORTED',               -- Imported into country
    'MISSING',                -- Lost / unaccounted
    'STILLBORN'               -- Born dead
);

CREATE TYPE movement_type AS ENUM (
    'SALE',                   -- Farm-to-farm sale
    'PURCHASE',               -- Farm-to-farm purchase
    'MARKET_SALE',            -- Sold at market (off-holding)
    'MARKET_PURCHASE',        -- Bought at market (on-holding)
    'TRANSFER',               -- Transfer between own holdings
    'BIRTH_REGISTRATION',     -- Birth → registration
    'DEATH',                  -- Natural death
    'HOME_SLAUGHTER',         -- Slaughter on farm for consumption
    'SLAUGHTERHOUSE',         -- Slaughter at registered abattoir
    'PASTURE_DEPARTURE',      -- Going to seasonal pasture
    'PASTURE_RETURN',         -- Returning from seasonal pasture
    'IMPORT',                 -- Import from another country
    'EXPORT',                 -- Export to another country
    'ALPINE_DEPARTURE',       -- Going to alpine grazing
    'ALPINE_RETURN',          -- Returning from alpine grazing
    'CORRECTION'              -- Data correction movement
);

CREATE TYPE birth_type AS ENUM (
    'SINGLE', 'TWIN', 'TRIPLET', 'STILLBORN'
);

-- ============================================================
-- EAR TAG ENUMS
-- ============================================================

CREATE TYPE ear_tag_status AS ENUM (
    'NEW',          -- Generated by VD, not yet assigned
    'AVAILABLE',    -- Allocated to supplier contingent
    'ORDERED',      -- On an order
    'COLLECTED',    -- Supplier collected order for printing
    'DELIVERED',    -- Shipped to VS/farm
    'APPLIED',      -- Applied to animal
    'CANCELLED',    -- Order/tag cancelled
    'WITHDRAWN',    -- Withdrawn from system
    'LOST',         -- Reported lost/damaged
    'DESTROYED'     -- Destroyed (slaughter)
);

CREATE TYPE order_type AS ENUM (
    'NEW_TAGS',         -- New ear tag numbers
    'DUPLICATE_TAGS'    -- Replacement for lost/damaged
);

CREATE TYPE contingent_type AS ENUM (
    'SUPPLIER',         -- Allocated to supplier
    'VD',               -- Held by VD reserve
    'VS'                -- Held at veterinary station
);

CREATE TYPE order_status AS ENUM (
    'PENDING',        -- Placed, awaiting collection
    'COLLECTED',      -- Supplier collected for printing
    'DELIVERED',      -- Shipped to recipient
    'PARTIALLY_DELIVERED', -- Some tags delivered
    'CANCELLED',      -- Order cancelled
    'COMPLETED'       -- All tags applied
);

CREATE TYPE duplicate_type AS ENUM ('SINGLE', 'PAIR');

-- ============================================================
-- RISK ANALYSIS ENUMS
-- ============================================================

CREATE TYPE risk_score AS ENUM (
    'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
);

CREATE TYPE analysis_schedule AS ENUM (
    'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ON_DEMAND'
);

-- ============================================================
-- INSPECTION ENUMS
-- ============================================================

CREATE TYPE inspection_result AS ENUM (
    'PASS', 'PASS_WITH_CONDITIONS', 'FAIL', 'PENDING_REVIEW'
);

CREATE TYPE inspection_type AS ENUM (
    'ROUTINE',          -- Regular scheduled inspection
    'TARGETED',         -- Risk-based targeting
    'FOLLOW_UP',        -- Re-inspection after failure
    'COMPLAINT',        -- Triggered by complaint
    'IMPORT_CHECK',     -- Import verification
    'EXPORT_CHECK'      -- Export certification
);
```

### 1.2 Zod Mirror Enums (for runtime validation)

```typescript
// packages/@prasici/validators/src/enums.ts
import { z } from "zod";

// ── System Management ──
export const UserStatus = z.enum([
  "ACTIVE", "INACTIVE", "BLOCKED", "PENDING_VERIFICATION"
]);
export type UserStatus = z.infer<typeof UserStatus>;

export const RoleName = z.enum([
  "SUPER_ADMIN", "VD_ADMIN", "VD_STAFF", "VS_MANAGER",
  "VETERINARIAN", "TECHNICIAN", "SUPPLIER", "FARMER",
  "INSPECTOR", "SLAUGHTERHOUSE_OP", "MARKET_OP", "REPORT_VIEWER"
]);
export type RoleName = z.infer<typeof RoleName>;

export const PermissionAction = z.enum([
  "CREATE", "READ", "UPDATE", "DELETE",
  "APPROVE", "REJECT", "CONFIRM", "CANCEL"
]);
export type PermissionAction = z.infer<typeof PermissionAction>;

export const ResourceType = z.enum([
  "FARM", "SUBJECT", "ANIMAL", "MOVEMENT", "EARTAG",
  "BIRTH", "SLAUGHTER", "INSPECTION", "RISK_ANALYSIS",
  "USER", "ROLE", "ORGANIZATION", "CODE_TABLE",
  "SYSTEM_PARAM", "REPORT", "AUDIT_LOG"
]);
export type ResourceType = z.infer<typeof ResourceType>;

export const OrganizationType = z.enum([
  "VD", "VS", "SLAUGHTERHOUSE", "LIVESTOCK_MARKET",
  "BIP", "PASTURE", "TRADER", "SUPPLIER", "FARM"
]);

export const ModuleName = z.enum([
  "HOLDINGS", "KEEPERS", "ANIMALS", "MOVEMENTS",
  "EARTAGS", "BIRTHS", "SLAUGHTER", "PASTURE",
  "INSPECTIONS", "RISK_ANALYSIS", "REPORTS",
  "SYSTEM", "SYNC", "AUDIT"
]);

export const LanguageCode = z.enum(["MK", "EN", "SQ", "SR"]);

// ── Holder Keeper ──
export const VerificationStatus = z.enum([
  "DRAFT", "PENDING_VD_APPROVAL", "APPROVED", "REJECTED", "ARCHIVED"
]);

export const FarmType = z.enum([
  "FARM", "SLAUGHTERHOUSE", "LIVESTOCK_MARKET",
  "PASTURE_MOUNTAIN", "PASTURE_VILLAGE", "BIP",
  "TRADER_YARD", "QUARANTINE", "OTHER"
]);

export const SubjectRole = z.enum([
  "OWNER", "KEEPER", "VETERINARIAN", "TRADER",
  "SLAUGHTERHOUSE_OP", "MARKET_OP", "TECHNICIAN", "GUARDIAN"
]);

export const DataSource = z.enum([
  "AIMCS", "HK_IMP", "HK_PDA", "MOBILE", "API", "BATCH"
]);

// ── Animals & Movements ──
export const Sex = z.enum(["MALE", "FEMALE"]);

export const AnimalStatus = z.enum([
  "ALIVE", "DEAD", "SLAUGHTERED", "SOLD",
  "EXPORTED", "IMPORTED", "MISSING", "STILLBORN"
]);

export const MovementType = z.enum([
  "SALE", "PURCHASE", "MARKET_SALE", "MARKET_PURCHASE",
  "TRANSFER", "BIRTH_REGISTRATION", "DEATH",
  "HOME_SLAUGHTER", "SLAUGHTERHOUSE",
  "PASTURE_DEPARTURE", "PASTURE_RETURN",
  "IMPORT", "EXPORT", "ALPINE_DEPARTURE",
  "ALPINE_RETURN", "CORRECTION"
]);

// ── Ear Tags ──
export const EarTagStatus = z.enum([
  "NEW", "AVAILABLE", "ORDERED", "COLLECTED",
  "DELIVERED", "APPLIED", "CANCELLED", "WITHDRAWN",
  "LOST", "DESTROYED"
]);

export const OrderType = z.enum(["NEW_TAGS", "DUPLICATE_TAGS"]);
export const OrderStatus = z.enum([
  "PENDING", "COLLECTED", "DELIVERED",
  "PARTIALLY_DELIVERED", "CANCELLED", "COMPLETED"
]);
export const DuplicateType = z.enum(["SINGLE", "PAIR"]);

// ── Risk Analysis ──
export const RiskScore = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const AnalysisSchedule = z.enum([
  "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "ON_DEMAND"
]);

// ── Inspections ──
export const InspectionResult = z.enum([
  "PASS", "PASS_WITH_CONDITIONS", "FAIL", "PENDING_REVIEW"
]);
export const InspectionType = z.enum([
  "ROUTINE", "TARGETED", "FOLLOW_UP", "COMPLAINT",
  "IMPORT_CHECK", "EXPORT_CHECK"
]);
```

---

## 2. Complete Drizzle Schema

### 2.1 Database Connection & Setup

```typescript
// packages/@prasici/db/src/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as sm from "./schema/sm";
import * as hk from "./schema/hk";
import * as an from "./schema/an";
import * as et from "./schema/et";
import * as gn from "./schema/gn";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, {
  schema: { ...sm, ...hk, ...an, ...et, ...gn },
  logger: process.env.NODE_ENV === "development",
});

export type DB = typeof db;
```

### 2.2 System Management Schema (14 tables)

```typescript
// packages/@prasici/db/src/schema/sm/index.ts
export { users, userSessions } from "./users";
export { roles, userRoles, rolePermissions, permissions } from "./rbac";
export { modules, moduleBusinessRules, businessRules } from "./modules";
export { codeTables } from "./code-tables";
export { systemParameters } from "./system-parameters";
export { organizations, orgAreas } from "./organizations";
export { auditLog } from "./audit-log";
```

```typescript
// packages/@prasici/db/src/schema/sm/users.ts
import {
  pgTable, uuid, varchar, timestamp, boolean, text, jsonb
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { userRoles } from "./rbac";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  
  // Personal info
  firstName: varchar("first_name", { length: 50 }),
  firstNameAlt: varchar("first_name_alt", { length: 50 }), // Cyrillic
  lastName: varchar("last_name", { length: 50 }),
  lastNameAlt: varchar("last_name_alt", { length: 50 }),
  
  // Organization
  organizationId: uuid("organization_id").references(() => organizations.id),
  
  // Auth
  language: varchar("language", { length: 2 }).notNull().default("MK"),
  geoUnlimited: boolean("geo_unlimited").notNull().default(false),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  
  // Status
  status: varchar("status", { length: 30 }).notNull().default("ACTIVE"),
  
  // Standard audit (replaces legacy ID_INSERTER pattern)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by").references((): typeof users => users.id),
  updatedAt: timestamp("updated_at"),
  validTo: timestamp("valid_to"),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  roles: many(userRoles),
}));

// ── User Sessions ──
export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 500 }).notNull(),
  refreshToken: varchar("refresh_token", { length: 500 }),
  
  deviceInfo: jsonb("device_info"),
  ipAddress: varchar("ip_address", { length: 45 }),
  
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at").notNull(),
  
  // Audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActivityAt: timestamp("last_activity_at"),
});
```

```typescript
// packages/@prasici/db/src/schema/sm/rbac.ts
import { pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

// ── Roles ──
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  description: varchar("description", { length: 250 }),
  priority: varchar("priority", { length: 10 }).notNull().default("NORMAL"),
  // NORMAL, HIGH (for override), SYSTEM (cannot be modified)
  
  isSystem: boolean("is_system").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at"),
  validTo: timestamp("valid_to"),
});

// ── Permissions ──
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  resource: varchar("resource", { length: 50 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  description: varchar("description", { length: 250 }),
  
  // Fine-grained: scope = farm_id, org_id, region, or '*' (all)
  scope: varchar("scope", { length: 100 }).notNull().default("*"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Role-Permission Mapping ──
export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "CASCADE" }),
  permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "CASCADE" }),
  
  // Condition: optional WHERE clause for dynamic permission
  condition: varchar("condition", { length: 500 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// ── User-Role Mapping (M2M) ──
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "CASCADE" }),
  roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "CASCADE" }),
  
  // Scope: limit this role assignment to specific org/farm
  scopeOrgId: uuid("scope_org_id"),
  scopeFarmId: uuid("scope_farm_id"),
  
  // Temporal: role can be time-limited
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
});

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));
```

```typescript
// packages/@prasici/db/src/schema/sm/modules.ts
import { pgTable, uuid, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";

// ── Application Modules — replaces SM_MODULES ──
export const modules = pgTable("modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(), // PAGE, API, WIDGET
  
  orderSeq: integer("order_seq").notNull().default(0),
  parentId: uuid("parent_id"), // For nested modules
  defaultSchema: varchar("default_schema", { length: 50 }),
  
  icon: varchar("icon", { length: 50 }),
  route: varchar("route", { length: 200 }),
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Business Rules — replaces SM_BUSINESS_RULES ──
export const businessRules = pgTable("business_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  description: varchar("description", { length: 500 }),
  
  // Zod schema reference (stored as code path)
  validatorPath: varchar("validator_path", { length: 200 }),
  
  // Severity: ERROR rejects, WARNING allows with flag
  severity: varchar("severity", { length: 10 }).notNull().default("ERROR"),
  
  // Execution flags (replaces SM_MODULE_BR.EXECUTE_IF)
  executeIf: varchar("execute_if", { length: 500 }),
  isActive: boolean("is_active").notNull().default(true),
  runOnServer: boolean("run_on_server").notNull().default(true),
  runOnMobile: boolean("run_on_mobile").notNull().default(false),
  
  // Error message template (supports {field} substitution)
  messageTemplate: varchar("message_template", { length: 500 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at"),
});

// ── Module-Business Rule Binding — replaces SM_MODULE_BR ──
export const moduleBusinessRules = pgTable("module_business_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").notNull().references(() => modules.id),
  businessRuleId: uuid("business_rule_id").notNull().references(() => businessRules.id),
  
  // Condition: JSON expression for conditional execution
  condition: varchar("condition", { length: 500 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

```typescript
// packages/@prasici/db/src/schema/sm/code-tables.ts
// Replaces SM_LOG_CODES — generic key-value with multi-language support
import { pgTable, uuid, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const codeTables = pgTable("code_tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  group: varchar("group", { length: 50 }).notNull(), // e.g., 'BREED', 'SPECIES', 'COUNTRY'
  code: varchar("code", { length: 50 }).notNull(),
  
  // Multi-language labels
  label: jsonb("label").notNull().$type<Record<string, string>>(),
  // Example: { "MK": "Холштајн", "EN": "Holstein", "SQ": "Holstein", "SR": "Holštajn" }
  
  description: varchar("description", { length: 500 }),
  displayOrder: integer("display_order").notNull().default(0),
  
  // For hierarchical codes
  parentId: uuid("parent_id"),
  
  scope: varchar("scope", { length: 30 }).notNull().default("GLOBAL"),
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  validTo: timestamp("valid_to"),
});

// Unique constraint: group + code must be unique
```

```typescript
// packages/@prasici/db/src/schema/sm/system-parameters.ts
// Replaces SM_SYS_PARAMS
import { pgTable, uuid, varchar, timestamp, text, boolean, jsonb } from "drizzle-orm/pg-core";

export const systemParameters = pgTable("system_parameters", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  value: text("value").notNull(),
  
  // Type info for validation
  dataType: varchar("data_type", { length: 20 }).notNull().default("STRING"),
  // STRING, NUMBER, BOOLEAN, DATE, JSON
  
  description: varchar("description", { length: 500 }),
  group: varchar("group", { length: 50 }), // e.g., 'CALVING', 'TAGGING', 'MOVEMENT'
  
  // Validation
  minValue: varchar("min_value", { length: 100 }),
  maxValue: varchar("max_value", { length: 100 }),
  allowedValues: jsonb("allowed_values"), // Array of allowed values
  
  isActive: boolean("is_active").notNull().default(true),
  isEditable: boolean("is_editable").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at"),
});
```

```typescript
// packages/@prasici/db/src/schema/sm/organizations.ts
import { pgTable, uuid, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name1: varchar("name1", { length: 100 }).notNull(),
  name2: varchar("name2", { length: 100 }),
  name3: varchar("name3", { length: 100 }),
  
  address: jsonb("address").$type<{
    street?: string;
    city?: string;
    zipCode?: string;
    coordinates?: [number, number]; // [lat, lng]
  }>(),
  
  phone: varchar("phone", { length: 30 }),
  fax: varchar("fax", { length: 30 }),
  email: varchar("email", { length: 255 }),
  homepage: varchar("homepage", { length: 255 }),
  
  orgType: varchar("org_type", { length: 30 }).notNull(),
  parentId: uuid("parent_id"), // Org hierarchy
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  validTo: timestamp("valid_to"),
});

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  parent: one(organizations, {
    fields: [organizations.parentId],
    references: [organizations.id],
  }),
  children: many(organizations),
}));

// ── Org coverage areas (replaces SM_ORG_AREA) ──
export const orgAreas = pgTable("org_areas", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  communeId: uuid("commune_id"), // FK to communes
  region: varchar("region", { length: 100 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

```typescript
// packages/@prasici/db/src/schema/sm/audit-log.ts
// Replaces the generic ID_SESSION audit trail pattern
import { pgTable, uuid, varchar, timestamp, jsonb, text } from "drizzle-orm/pg-core";

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  userId: uuid("user_id"),
  sessionId: uuid("session_id"),
  
  action: varchar("action", { length: 30 }).notNull(),
  resource: varchar("resource", { length: 50 }).notNull(),
  resourceId: varchar("resource_id", { length: 50 }),
  
  // Before/after snapshots
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  changes: jsonb("changes"), // { field: { old, new }, ... }
  
  // Context
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  source: varchar("source", { length: 20 }).notNull(), // WEB, MOBILE, API
  
  // Error tracking
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Partition by month for performance
// ALTER TABLE audit_log PARTITION BY RANGE (created_at);
```

### 2.3 Holder Keeper Schema (10 tables)

```typescript
// packages/@prasici/db/src/schema/hk/addresses.ts
import {
  pgTable, uuid, varchar, timestamp, boolean, geometry,
  integer, uniqueIndex, index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { states } from "./states";
import { communes } from "./communes";
import { farms } from "./farms";

// ── States ──
export const states = pgTable("states", {
  id: uuid("id").primaryKey().defaultRandom(),
  legacyId: integer("legacy_id").unique(), // For migration from HK_STATES
  name: varchar("name", { length: 50 }).notNull(),
  shortName: varchar("short_name", { length: 3 }).notNull().unique(),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  validTo: timestamp("valid_to"),
});

// ── Zip Codes ──
export const zipCodes = pgTable("zip_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  legacyId: integer("legacy_id").unique(),
  name: varchar("name", { length: 50 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  stateId: uuid("state_id").notNull().references(() => states.id),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  validTo: timestamp("valid_to"),
});

export const zipCodesRelations = relations(zipCodes, ({ one }) => ({
  state: one(states, {
    fields: [zipCodes.stateId],
    references: [states.id],
  }),
}));

// ── Communes ──
export const communes = pgTable("communes", {
  id: uuid("id").primaryKey().defaultRandom(),
  legacyId: integer("legacy_id").unique(),
  name: varchar("name", { length: 50 }).notNull(),
  
  // Optional reverse-geocoded polygon
  boundary: geometry("boundary", { type: "polygon", srid: 4326 }),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  validTo: timestamp("valid_to"),
});

// ── Admin Units ──
export const adminUnits = pgTable("admin_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  legacyId: integer("legacy_id").unique(),
  name: varchar("name", { length: 50 }).notNull(),
  auId: varchar("au_id", { length: 20 }).notNull(),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  validTo: timestamp("valid_to"),
});

// ── Addresses (with PostGIS) ──
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  legacyId: integer("legacy_id").unique(), // HS_MID
  legacyKmgMid: integer("legacy_kmg_mid"), // For migration link
  
  city: varchar("city", { length: 30 }).notNull(),
  street: varchar("street", { length: 50 }),
  houseNumber: varchar("house_number", { length: 10 }).notNull(),
  houseNumberAdd: varchar("house_number_add", { length: 5 }),
  
  zipCodeId: uuid("zip_code_id").notNull().references(() => zipCodes.id),
  communeId: uuid("commune_id").references(() => communes.id),
  adminUnitId: uuid("admin_unit_id").references(() => adminUnits.id),
  
  // PostGIS point (replaces X/Y/Z coordinates)
  location: geometry("location", { type: "point", srid: 4326 }),
  
  // Reverse-geocoding cache
  geocodedAddress: varchar("geocoded_address", { length: 500 }),
  geocodedAt: timestamp("geocoded_at"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  validTo: timestamp("valid_to"),
});

export const addressesRelations = relations(addresses, ({ one }) => ({
  zipCode: one(zipCodes, {
    fields: [addresses.zipCodeId],
    references: [zipCodes.id],
  }),
  commune: one(communes, {
    fields: [addresses.communeId],
    references: [communes.id],
  }),
  adminUnit: one(adminUnits, {
    fields: [addresses.adminUnitId],
    references: [adminUnits.id],
  }),
}));

// Spatial index for location
// CREATE INDEX idx_addresses_location ON addresses USING GIST (location);
```

```typescript
// packages/@prasici/db/src/schema/hk/farms.ts
// Replaces HK_KMG — with verification_status replacing temp tables
import {
  pgTable, uuid, varchar, timestamp, boolean, geometry,
  integer, text
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { addresses } from "./addresses";
import { farmSubjects } from "./farm-subjects";

export const farms = pgTable("farms", {
  id: uuid("id").primaryKey().defaultRandom(),
  legacyId: integer("legacy_id").unique(), // KMG_MID
  
  // 9-digit farm ID with check digit (legacy format preserved)
  farmId: varchar("farm_id", { length: 9 }).unique().notNull(),
  
  // Address
  addressId: uuid("address_id").notNull().references(() => addresses.id),
  
  // Farm identification
  name: varchar("name", { length: 50 }), // HOME_NAME
  type: varchar("type", { length: 30 }).notNull().default("FARM"),
  
  // Hierarchy (for parent-child farm relationships)
  parentFarmId: uuid("parent_farm_id"),
  
  // ★ VERIFICATION STATUS — replaces legacy temp tables ★
  verificationStatus: varchar("verification_status", { length: 30 })
    .notNull().default("PENDING_VD_APPROVAL"),
  verificationNote: text("verification_note"), // VD rejection reason
  verifiedAt: timestamp("verified_at"),
  verifiedBy: uuid("verified_by"),
  
  // Data source (replaces OWNER column)
  dataSource: varchar("data_source", { length: 20 }).notNull().default("MOBILE"),
  
  // Geocoded location (redundant with address, but useful for field capture)
  location: geometry("location", { type: "point", srid: 4326 }),
  
  // Digital signature (stored as base64 or reference)
  digitalSignature: text("digital_signature"),
  signatureCapturedAt: timestamp("signature_captured_at"),
  
  // Photo of location (reference to file storage)
  photoUrl: varchar("photo_url", { length: 500 }),
  
  // Active status
  isActive: boolean("is_active").notNull().default(true),
  
  // Standard audit (replaces legacy D_INSERT, ID_INSERTER, ID_SESSION)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at"),
  updatedBy: uuid("updated_by"),
  validTo: timestamp("valid_to"),
});

export const farmsRelations = relations(farms, ({ one, many }) => ({
  address: one(addresses, {
    fields: [farms.addressId],
    references: [addresses.id],
  }),
  parentFarm: one(farms, {
    fields: [farms.parentFarmId],
    references: [farms.id],
  }),
  subjects: many(farmSubjects),
}));

// Spatial index
// CREATE INDEX idx_farms_location ON farms USING GIST (location);
```

```typescript
// packages/@prasici/db/src/schema/hk/subjects.ts
// Replaces HK_SUBJ — persons/organizations
import { pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  legacyId: integer("legacy_id").unique(),
  
  shortName: varchar("short_name", { length: 50 }).notNull(),
  shortNameAlt: varchar("short_name_alt", { length: 50 }), // Cyrillic
  
  firstName: varchar("first_name", { length: 50 }),
  firstNameAlt: varchar("first_name_alt", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  lastNameAlt: varchar("last_name_alt", { length: 50 }),
  
  // For companies/organizations
  companyName: varchar("company_name", { length: 100 }),
  
  // Identification
  personalId: varchar("personal_id", { length: 20 }), // EMBG / ID
  vatNumber: varchar("vat_number", { length: 20 }),
  phoneNumber: varchar("phone_number", { length: 30 }),
  email: varchar("email", { length: 255 }),
  
  // Primary address
  addressId: uuid("address_id"),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  validTo: timestamp("valid_to"),
});
```

```typescript
// packages/@prasici/db/src/schema/hk/farm-subjects.ts
// Replaces HK_KMG_SUBJ — links subjects to farms with roles
import { pgTable, uuid, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { farms } from "./farms";
import { subjects } from "./subjects";

export const farmSubjects = pgTable("farm_subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  legacyId: integer("legacy_id").unique(),
  
  farmId: uuid("farm_id").notNull().references(() => farms.id, { onDelete: "CASCADE" }),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "CASCADE" }),
  
  role: varchar("role", { length: 30 }).notNull(),
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  validTo: timestamp("valid_to"),
});

export const farmSubjectsRelations = relations(farmSubjects, ({ one }) => ({
  farm: one(farms, {
    fields: [farmSubjects.farmId],
    references: [farms.id],
  }),
  subject: one(subjects, {
    fields: [farmSubjects.subjectId],
    references: [subjects.id],
  }),
}));

// Unique constraint: one subject-farm-role combination
// CREATE UNIQUE INDEX idx_farm_subjects_unique ON farm_subjects (farm_id, subject_id, role) WHERE is_active = true;
```

```typescript
// packages/@prasici/db/src/schema/hk/sync-errors.ts
// Replaces HK_SYNC_ERRORS
import { pgTable, uuid, varchar, timestamp, text, integer } from "drizzle-orm/pg-core";

export const syncErrors = pgTable("sync_errors", {
  id: uuid("id").primaryKey().defaultRandom(),
  legacyId: integer("legacy_id"),
  
  farmId: uuid("farm_id"),
  addressId: uuid("address_id"),
  subjectId: uuid("subject_id"),
  
  errorType: varchar("error_type", { length: 30 }).notNull(),
  note: text("note"),
  
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
});
```

### 2.4 Animals & Movements Schema (5 tables)

```typescript
// packages/@prasici/db/src/schema/an/index.ts
export { animals, animalParents } from "./animals";
export { movements } from "./movements";
export { birthNotifications } from "./birth-notifications";
export { slaughterRecords } from "./slaughter";
export { pastureDeclarations } from "./pasture";
```

```typescript
// packages/@prasici/db/src/schema/an/animals.ts
import {
  pgTable, uuid, varchar, timestamp, date, boolean, integer
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { farms } from "../hk/farms";
import { movements } from "./movements";

export const animals = pgTable("animals", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Ear tag identification
  stateCode: varchar("state_code", { length: 3 }).notNull().default("MK"),
  earTagNumber: varchar("ear_tag_number", { length: 8 }).notNull().unique(),
  // 8 digits with check digit (legacy formula preserved)
  
  // Birth info
  birthDate: date("birth_date").notNull(),
  sex: varchar("sex", { length: 10 }).notNull(),
  breed: varchar("breed", { length: 50 }),
  birthType: varchar("birth_type", { length: 20 }),
  birthWeight: integer("birth_weight"),
  
  // Mother & Father
  motherId: uuid("mother_id").references((): typeof animals.id => animals.id),
  fatherId: uuid("father_id").references((): typeof animals.id => animals.id),
  
  // Current holding
  currentFarmId: uuid("current_farm_id").notNull().references(() => farms.id),
  
  // Status
  status: varchar("status", { length: 20 }).notNull().default("ALIVE"),
  
  // 1st tagging flag (legacy compatibility)
  isFirstTagging: boolean("is_first_tagging").notNull().default(false),
  taggingDate: date("tagging_date"),
  
  // Import/Export tracking
  imported: boolean("imported").notNull().default(false),
  importCountry: varchar("import_country", { length: 3 }),
  importDate: date("import_date"),
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at"),
  validTo: timestamp("valid_to"),
});

export const animalsRelations = relations(animals, ({ one, many }) => ({
  currentFarm: one(farms, {
    fields: [animals.currentFarmId],
    references: [farms.id],
  }),
  mother: one(animals, {
    fields: [animals.motherId],
    references: [animals.id],
  }),
  movements: many(movements),
}));

// ── Animal Parent History (for complex lineage) ──
export const animalParents = pgTable("animal_parents", {
  id: uuid("id").primaryKey().defaultRandom(),
  animalId: uuid("animal_id").notNull().references(() => animals.id, { onDelete: "CASCADE" }),
  parentId: uuid("parent_id").notNull().references(() => animals.id, { onDelete: "CASCADE" }),
  parentType: varchar("parent_type", { length: 10 }).notNull(), // MOTHER, FATHER
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

```typescript
// packages/@prasici/db/src/schema/an/movements.ts
// UNIFIED movement table — replaces two-phase departure + arrival
import {
  pgTable, uuid, varchar, timestamp, date, text, boolean, integer
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { animals } from "./animals";
import { farms } from "../hk/farms";

export const movements = pgTable("movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Animal
  animalId: uuid("animal_id").notNull().references(() => animals.id),
  
  // Movement endpoints
  fromFarmId: uuid("from_farm_id").references(() => farms.id),
  toFarmId: uuid("to_farm_id").notNull().references(() => farms.id),
  
  // Type
  type: varchar("type", { length: 30 }).notNull(),
  
  // Dates
  movementDate: date("movement_date").notNull(),
  arrivalDate: date("arrival_date"),
  
  // Multi-leg support (for livestock markets)
  parentMovementId: uuid("parent_movement_id"),
  legOrder: integer("leg_order").default(0),
  // Example: Market sale = 4 legs:
  // Leg 1: off-seller → on-market (type: MARKET_SALE)
  // Leg 2: off-market → on-buyer (type: MARKET_PURCHASE)
  
  // Movement-specific data
  reason: varchar("reason", { length: 100 }),
  documentRef: varchar("document_ref", { length: 50 }),
  
  // Death/slaughter specific
  deathDate: date("death_date"),
  deathCause: varchar("death_cause", { length: 100 }),
  
  // Import/Export
  importCountry: varchar("import_country", { length: 3 }),
  exportCountry: varchar("export_country", { length: 3 }),
  breedingState: varchar("breeding_state", { length: 3 }),
  breedingPlaceId: varchar("breeding_place_id", { length: 50 }),
  
  // Status
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: uuid("verified_by"),
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at"),
  validTo: timestamp("valid_to"),
  
  // For performance: partition by movement_date
});

export const movementsRelations = relations(movements, ({ one }) => ({
  animal: one(animals, {
    fields: [movements.animalId],
    references: [animals.id],
  }),
  fromFarm: one(farms, {
    fields: [movements.fromFarmId],
    references: [farms.id],
  }),
  toFarm: one(farms, {
    fields: [movements.toFarmId],
    references: [farms.id],
  }),
  parentMovement: one(movements, {
    fields: [movements.parentMovementId],
    references: [movements.id],
  }),
}));

// Indexes for common queries
// CREATE INDEX idx_movements_animal ON movements (animal_id);
// CREATE INDEX idx_movements_date ON movements (movement_date);
// CREATE INDEX idx_movements_type ON movements (type);
```

```typescript
// packages/@prasici/db/src/schema/an/birth-notifications.ts
import {
  pgTable, uuid, varchar, timestamp, date, text, boolean
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { farms } from "../hk/farms";

export const birthNotifications = pgTable("birth_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Farm where birth occurred
  farmId: uuid("farm_id").notNull().references(() => farms.id),
  
  // Notification details
  notificationDate: date("notification_date").notNull(),
  expectedBirthDate: date("expected_birth_date"),
  actualBirthDate: date("actual_birth_date"),
  
  // Birth details
  numberOfCalves: integer("number_of_calves").notNull().default(1),
  motherAnimalId: uuid("mother_animal_id"),
  notes: text("notes"),
  
  // Notification method
  source: varchar("source", { length: 20 }).notNull().default("MOBILE"),
  // MOBILE, PHONE, WEB
  
  // Status workflow
  status: varchar("status", { length: 30 }).notNull().default("PENDING"),
  // PENDING, VISITED, TAGGED, COMPLETED, CANCELLED
  
  // Assignment
  assignedTo: uuid("assigned_to"), // Vet responsible for tagging
  assignedAt: timestamp("assigned_at"),
  
  // 20-day tagging deadline (legacy rule)
  taggingDeadline: date("tagging_deadline").notNull(),
  taggedAt: date("tagged_at"),
  taggingExceeded: boolean("tagging_exceeded").notNull().default(false),
  
  // Resulting animal registration
  animalIds: uuid("animal_ids").array(), // Array of animal IDs created
  
  // Audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at"),
  validTo: timestamp("valid_to"),
});

export const birthNotificationsRelations = relations(birthNotifications, ({ one }) => ({
  farm: one(farms, {
    fields: [birthNotifications.farmId],
    references: [farms.id],
  }),
}));
```

---

## 3. Zod 4 Validation Layer

```typescript
// packages/@prasici/validators/src/registration.ts
// Complete business rules for animal registration
import { z } from "zod";
import { Sex, AnimalStatus, BirthType } from "./enums";

// ── System Parameters (retrieved from DB at runtime) ──
export interface RegistrationParams {
  minMotherAgeMonths: number;    // default: 17
  calvingPeriodDays: number;     // default: 365
  birthNotificationDays: number; // default: 7
  taggingDeadlineDays: number;   // default: 20
}

// ── Ear Tag Validation (Legacy formula preserved) ──
export const earTagSchema = z.string()
  .regex(/^\d{8}$/, "Ear tag must be 8 digits")
  .refine(
    (tag) => {
      const weights = [3, 5, 7, 11, 13, 17, 19];
      const digits = tag.split("").map(Number);
      const sum = digits.slice(0, 7).reduce((acc, d, i) => acc + weights[i] * d, 0);
      return digits[7] === sum % 10;
    },
    { message: "Ear tag check digit is invalid" }
  );

// ── Farm ID Validation (9-digit with check digit) ──
export const farmIdSchema = z.string()
  .regex(/^\d{9}$/, "Farm ID must be 9 digits")
  .refine(
    (id) => {
      const weights = [7, 3, 1, 9, 5, 11, 13, 17];
      const digits = id.split("").map(Number);
      const sum = digits.slice(0, 8).reduce((acc, d, i) => acc + weights[i] * d, 0);
      return digits[8] === sum % 10;
    },
    { message: "Farm ID check digit is invalid" }
  );

// ── Normal Registration Schema ──
export const normalRegistrationSchema = z.object({
  farmId: farmIdSchema,
  earTag: earTagSchema,
  birthDate: z.date().refine(d => d <= new Date(), "Birth date cannot be in the future"),
  sex: Sex,
  breed: z.string().min(1).max(50),
  
  // Mother (optional but validated if present)
  motherEarTag: earTagSchema.optional(),
  fatherEarTag: earTagSchema.optional(),
  
  // Insemination
  inseminationDocNumber: z.string().max(50).optional(),
  inseminationDate: z.date().optional(),
  
  // Tagging
  markerId: z.string().max(50).optional(),
  markingDate: z.date().optional(),
  
  // Import (optional)
  importCountry: z.string().length(3).optional(),
  importDate: z.date().optional(),
});

// ── Registration with Business Rules ──
export function createRegistrationValidator(params: RegistrationParams) {
  return normalRegistrationSchema
    .refine(
      (data) => !data.motherEarTag || data.motherEarTag !== data.earTag,
      { message: "Mother cannot be the same animal", path: ["motherEarTag"] }
    )
    .refine(
      async (data) => {
        // Runtime DB check: mother must be alive at birth
        // This would be called from the tRPC router
        return true; // Placeholder — actual DB call happens in tRPC
      },
      { message: "Mother must be alive at time of birth", path: ["motherEarTag"] }
    );
}

// ── Slaughter Registration ──
export const slaughterSchema = z.object({
  animalEarTag: earTagSchema.optional(), // Optional for imported unregistered
  fromFarmId: farmIdSchema.optional(),
  toFarmId: farmIdSchema.notNull(),
  arrivalDate: z.date(),
  slaughterDate: z.date(),
  slaughterNumber: z.string().max(50),
  massType: z.enum(["LIVE_WEIGHT", "WARM_HALVES"]),
  mass: z.number().positive(),
  importCountry: z.string().length(3).optional(),
  importDate: z.date().optional(),
}).refine(
  (data) => data.slaughterDate >= data.arrivalDate,
  { message: "Slaughter date must be after arrival date" }
);

// ── Birth Notification Schema ──
export const birthNotificationSchema = z.object({
  farmId: farmIdSchema,
  notificationDate: z.date().refine(d => d <= new Date(), "Cannot be in the future"),
  expectedBirthDate: z.date().optional(),
  actualBirthDate: z.date().optional(),
  motherEarTag: earTagSchema.optional(),
  numberOfCalves: z.number().int().min(1).max(5).default(1),
  notes: z.string().max(500).optional(),
});

// ── Pasture Declaration Schema ──
export const pastureDeclarationSchema = z.object({
  fromFarmId: farmIdSchema,
  toFarmId: farmIdSchema,
  departureDate: z.date(),
  expectedReturnDate: z.date(),
  pastureType: z.enum(["MOUNTAIN", "VILLAGE"]),
  animalEarTags: z.array(earTagSchema).min(1).max(500),
}).refine(
  (data) => data.expectedReturnDate > data.departureDate,
  { message: "Return date must be after departure date" }
);

// ── Movement Schema (Unified) ──
export const unifiedMovementSchema = z.object({
  animalEarTag: earTagSchema,
  fromFarmId: farmIdSchema.nullable(), // null = unknown origin
  toFarmId: farmIdSchema,
  movementType: z.enum([
    "SALE", "PURCHASE", "MARKET_SALE", "MARKET_PURCHASE",
    "TRANSFER", "DEATH", "HOME_SLAUGHTER", "SLAUGHTERHOUSE",
    "IMPORT", "EXPORT", "CORRECTION"
  ]),
  movementDate: z.date(),
  arrivalDate: z.date().optional(),
  reason: z.string().max(100).optional(),
  documentRef: z.string().max(50).optional(),
  
  // Import/Export fields
  importCountry: z.string().length(3).optional(),
  exportCountry: z.string().length(3).optional(),
  breedingState: z.string().length(3).optional(),
  breedingPlaceId: z.string().max(50).optional(),
  
  // Death
  deathDate: z.date().optional(),
  deathCause: z.string().max(100).optional(),
}).refine(
  (data) => {
    if (data.movementDate && data.arrivalDate) {
      return data.arrivalDate >= data.movementDate;
    }
    return true;
  },
  { message: "Arrival date must be after movement date" }
);

// ── Market Movement Schema (Multi-leg) ──
export const marketMovementSchema = z.object({
  sellerFarmId: farmIdSchema,
  buyerFarmId: farmIdSchema,
  marketFarmId: farmIdSchema,
  animalEarTags: z.array(earTagSchema).min(1),
  marketDate: z.date(),
  saleDate: z.date(),
  purchaseDate: z.date().optional(),
  
  // Creates 4 movement records automatically
  // 1. Off-holding (seller → market)
  // 2. On-holding (market arrival)
  // 3. Off-holding (market departure)
  // 4. On-holding (market → buyer)
}).refine(
  (data) => data.sellerFarmId !== data.buyerFarmId,
  { message: "Seller and buyer must be different farms" }
);
```

```typescript
// packages/@prasici/validators/src/holdings.ts
import { z } from "zod";
import { VerificationStatus, FarmType, DataSource, SubjectRole } from "./enums";

// ── Address Input (with GPS auto-fill) ──
export const addressInputSchema = z.object({
  city: z.string().min(1).max(30),
  street: z.string().max(50).optional(),
  houseNumber: z.string().max(10),
  houseNumberAdd: z.string().max(5).optional(),
  
  zipCodeId: z.string().uuid().optional(),
  zipCodeName: z.string().max(50).optional(), // Auto-resolve if ID not provided
  communeId: z.string().uuid().optional(),
  adminUnitId: z.string().uuid().optional(),
  
  // GPS Coordinates
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive().optional(), // GPS accuracy in meters
});

// ── Farm Input Schema ──
export const farmInputSchema = z.object({
  farmId: z.string().length(9).optional(), // Auto-generated if not provided
  name: z.string().max(50).optional(),
  type: FarmType.default("FARM"),
  parentFarmId: z.string().uuid().optional(),
  
  // Address (auto-filled via GPS)
  address: addressInputSchema,
  
  // Digital signature
  digitalSignature: z.string().optional(), // base64
  photoUrl: z.string().url().optional(),
  
  // Data source
  dataSource: DataSource.default("MOBILE"),
});

// ── Subject Input ──
export const subjectInputSchema = z.object({
  shortName: z.string().min(1).max(50),
  shortNameAlt: z.string().max(50).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  companyName: z.string().max(100).optional(),
  
  personalId: z.string().max(20).optional(),
  vatNumber: z.string().max(20).optional(),
  phoneNumber: z.string().max(30),
  email: z.string().email().optional(),
});

// ── Combined HK + Farm Registration Wizard ──
export const hkFarmRegistrationSchema = z.object({
  // Step 1: Subject (Keeper/Holder)
  subject: subjectInputSchema,
  
  // Step 2: Farm
  farm: farmInputSchema,
  
  // Step 3: Role binding
  role: SubjectRole.default("OWNER"),
  
  // Step 4: Declaration
  declarationConfirmed: z.boolean().refine(v => v === true, {
    message: "You must confirm the data is correct"
  }),
  
  // Metadata
  createdAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
});
```

```typescript
// packages/@prasici/validators/src/eartags.ts
import { z } from "zod";

// ── Ear Tag Number Generation ──
export const generateTagsSchema = z.object({
  count: z.number().int().min(1).max(10000),
  description: z.string().max(200).optional(),
});

// ── Supplier Contingent ──
export const supplierContingentSchema = z.object({
  supplierId: z.string().uuid(),
  tagCount: z.number().int().min(100).max(100000),
  description: z.string().max(200).optional(),
});

// ── New Tags Order ──
export const newTagsOrderSchema = z.object({
  supplierId: z.string().uuid(),
  quantity: z.number().int().min(1).max(500),
  farmId: z.string().length(9).optional(), // For direct farm delivery
  farmIdOptional: z.boolean().default(false),
}).refine(
  (data) => data.quantity <= 500,
  { message: "Maximum 500 tags per order" }
);

// ── Duplicate Tags Order ──
export const duplicateTagsOrderSchema = z.object({
  supplierId: z.string().uuid(),
  earTags: z.array(z.object({
    earTagNumber: z.string().regex(/^\d{8}$/),
    state: z.string().length(2).default("MK"),
    duplicateType: z.enum(["SINGLE", "PAIR"]),
    description: z.string().max(200).optional(),
  })).min(1).max(50),
  farmId: z.string().length(9).optional(),
  addressOverride: z.string().max(200).optional(),
});
```

---

## 4. tRPC Router Layer with Zod Validation

```typescript
// packages/@prasici/trpc/src/context.ts
import { inferAsyncReturnType } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { db, pool } from "@prasici/db";

export async function createContext(opts: CreateNextContextOptions) {
  const { req, res } = opts;
  
  // Extract auth token
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  // Resolve user & permissions
  const user = token ? await authenticateToken(token) : null;
  const permissions = user ? await resolvePermissions(user.id) : [];
  
  return {
    db,
    pool,
    user,
    permissions,
    req,
    res,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

```typescript
// packages/@prasici/trpc/src/routers/holdings.ts
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { db } from "@prasici/db";
import { farms, addresses } from "@prasici/db/schema/hk";
import { farmInputSchema, addressInputSchema } from "@prasici/validators";
import { TRPCError } from "@trpc/server";

export const holdingsRouter = router({
  // ── Create Farm (Mobile-friendly) ──
  create: protectedProcedure
    .input(farmInputSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Validate GPS coordinates
      const point = `POINT(${input.address.longitude} ${input.address.latitude})`;
      
      // 2. Reverse-geocode address
      const resolvedAddress = await reverseGeocode(
        input.address.latitude,
        input.address.longitude
      );
      
      // 3. Resolve zip code, commune, admin unit
      const zipCode = await resolveZipCode(
        resolvedAddress.zipCode,
        input.address.zipCodeId
      );
      
      // 4. Create address
      const [address] = await db.insert(addresses).values({
        city: resolvedAddress.city || input.address.city,
        street: resolvedAddress.street || input.address.street,
        houseNumber: input.address.houseNumber,
        houseNumberAdd: input.address.houseNumberAdd,
        zipCodeId: zipCode.id,
        communeId: resolvedAddress.communeId,
        adminUnitId: resolvedAddress.adminUnitId,
        location: () => point, // PostGIS raw SQL
        geocodedAddress: resolvedAddress.formatted,
        geocodedAt: new Date(),
        createdBy: ctx.user.id,
      }).returning();
      
      // 5. Generate farm ID with check digit
      const farmId = generateFarmId();
      
      // 6. Create farm with PENDING_VD_APPROVAL
      const [farm] = await db.insert(farms).values({
        farmId,
        name: input.name,
        type: input.type,
        addressId: address.id,
        parentFarmId: input.parentFarmId,
        verificationStatus: "PENDING_VD_APPROVAL",
        dataSource: input.dataSource,
        location: () => point,
        photoUrl: input.photoUrl,
        digitalSignature: input.digitalSignature,
        createdBy: ctx.user.id,
      }).returning();
      
      return { farm, address };
    }),
  
  // ── Approve Farm (VD Admin only) ──
  approve: protectedProcedure
    .input(z.object({
      farmId: z.string().uuid(),
      note: z.string().max(500).optional(),
    }))
    .use(isVDAdmin) // Middleware for RBAC
    .mutation(async ({ ctx, input }) => {
      const [farm] = await db.update(farms)
        .set({
          verificationStatus: "APPROVED",
          verifiedAt: new Date(),
          verifiedBy: ctx.user.id,
          verificationNote: input.note,
          updatedAt: new Date(),
        })
        .where(eq(farms.id, input.farmId))
        .returning();
      
      if (!farm) throw new TRPCError({ code: "NOT_FOUND" });
      
      // Log audit
      await ctx.db.insert(auditLog).values({
        userId: ctx.user.id,
        action: "APPROVED",
        resource: "FARM",
        resourceId: farm.id,
        newValue: { verificationStatus: "APPROVED" },
      });
      
      return farm;
    }),
  
  // ── Reject Farm ──
  reject: protectedProcedure
    .input(z.object({
      farmId: z.string().uuid(),
      reason: z.string().min(1).max(500),
    }))
    .use(isVDAdmin)
    .mutation(async ({ ctx, input }) => {
      return db.update(farms)
        .set({
          verificationStatus: "REJECTED",
          verificationNote: input.reason,
          verifiedAt: new Date(),
          verifiedBy: ctx.user.id,
        })
        .where(eq(farms.id, input.farmId))
        .returning();
    }),
  
  // ── List Pending Farms ──
  listPending: protectedProcedure
    .use(isVDAdmin)
    .query(async ({ ctx }) => {
      return db.select()
        .from(farms)
        .where(eq(farms.verificationStatus, "PENDING_VD_APPROVAL"))
        .limit(50);
    }),
  
  // ── Get Farm by ID ──
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const farm = await db.query.farms.findFirst({
        where: eq(farms.id, input.id),
        with: {
          address: {
            with: {
              zipCode: true,
              commune: true,
              adminUnit: true,
            },
          },
          subjects: {
            with: {
              subject: true,
            },
          },
        },
      });
      
      if (!farm) throw new TRPCError({ code: "NOT_FOUND" });
      return farm;
    }),
});
```

```typescript
// packages/@prasici/trpc/src/routers/animals.ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@prasici/db";
import { animals, movements, birthNotifications } from "@prasici/db/schema/an";
import { TRPCError } from "@trpc/server";
import { eq, and, lt, gte } from "drizzle-orm";

export const animalsRouter = router({
  // ── Register Animal (with full business rules) ──
  register: protectedProcedure
    .input(animalRegistrationSchema)
    .use(checkFarmAccess) // Middleware: user must have access to farm
    .mutation(async ({ ctx, input }) => {
      // Business Rule 1: Mother must be alive at time of birth
      if (input.motherEarTag) {
        const mother = await db.query.animals.findFirst({
          where: and(
            eq(animals.earTagNumber, input.motherEarTag),
            eq(animals.status, "ALIVE"),
          ),
        });
        if (!mother) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Mother must be alive and exist on a farm at time of birth",
          });
        }
      }
      
      // Business Rule 2: Ear tag must be unused
      const existingTag = await db.query.animals.findFirst({
        where: eq(animals.earTagNumber, input.earTag),
      });
      if (existingTag) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Ear tag ${input.earTag} is already registered to animal ${existingTag.id}`,
        });
      }
      
      // Business Rule 3: Validate ear tag check digit
      const isValidTag = validateEarTagCheckDigit(input.earTag);
      if (!isValidTag) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid ear tag check digit",
        });
      }
      
      // Create the animal
      const [animal] = await db.insert(animals).values({
        earTagNumber: input.earTag,
        birthDate: input.birthDate,
        sex: input.sex,
        breed: input.breed,
        motherId: mother?.id,
        currentFarmId: input.farmId,
        status: "ALIVE",
        createdAt: new Date(),
        createdBy: ctx.user.id,
      }).returning();
      
      // Create birth movement automatically
      await db.insert(movements).values({
        animalId: animal.id,
        toFarmId: input.farmId,
        type: "BIRTH_REGISTRATION",
        movementDate: input.birthDate,
        createdAt: new Date(),
        createdBy: ctx.user.id,
      });
      
      return animal;
    }),
  
  // ── Create Movement (Unified) ──
  createMovement: protectedProcedure
    .input(unifiedMovementSchema)
    .use(checkFarmAccess)
    .mutation(async ({ ctx, input }) => {
      // Get animal
      const animal = await db.query.animals.findFirst({
        where: eq(animals.earTagNumber, input.animalEarTag),
      });
      if (!animal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Animal not found" });
      }
      
      // Business Rule: Animal must be on fromFarm
      if (input.fromFarmId && animal.currentFarmId !== input.fromFarmId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Animal is not currently on the specified origin farm",
        });
      }
      
      // Create movement
      const [movement] = await db.insert(movements).values({
        animalId: animal.id,
        fromFarmId: input.fromFarmId,
        toFarmId: input.toFarmId,
        type: input.movementType,
        movementDate: input.movementDate,
        arrivalDate: input.arrivalDate,
        reason: input.reason,
        documentRef: input.documentRef,
        createdAt: new Date(),
        createdBy: ctx.user.id,
      }).returning();
      
      // Update animal's current farm
      await db.update(animals)
        .set({ currentFarmId: input.toFarmId })
        .where(eq(animals.id, animal.id));
      
      return movement;
    }),
  
  // ── Market Movement (4-leg automatic) ──
  marketMovement: protectedProcedure
    .input(marketMovementSchema)
    .use(checkFarmAccess)
    .mutation(async ({ ctx, input }) => {
      const movements = [];
      const date = new Date();
      
      for (const earTag of input.animalEarTags) {
        const animal = await db.query.animals.findFirst({
          where: eq(animals.earTagNumber, earTag),
        });
        if (!animal) continue;
        
        // Leg 1: Off-holding (seller → market)
        const [m1] = await db.insert(movements).values({
          animalId: animal.id,
          fromFarmId: input.sellerFarmId,
          toFarmId: input.marketFarmId,
          type: "MARKET_SALE",
          movementDate: input.marketDate,
          legOrder: 1,
          createdAt: date,
          createdBy: ctx.user.id,
        }).returning();
        movements.push(m1);
        
        // Leg 2: On-holding market arrival
        const [m2] = await db.insert(movements).values({
          animalId: animal.id,
          fromFarmId: input.sellerFarmId,
          toFarmId: input.marketFarmId,
          type: "MARKET_PURCHASE",
          movementDate: input.marketDate,
          parentMovementId: m1.id,
          legOrder: 2,
          createdAt: date,
          createdBy: ctx.user.id,
        }).returning();
        movements.push(m2);
        
        // Leg 3: Off-holding market departure
        const [m3] = await db.insert(movements).values({
          animalId: animal.id,
          fromFarmId: input.marketFarmId,
          toFarmId: input.buyerFarmId,
          type: "MARKET_SALE",
          movementDate: input.purchaseDate || input.marketDate,
          parentMovementId: m1.id,
          legOrder: 3,
          createdAt: date,
          createdBy: ctx.user.id,
        }).returning();
        movements.push(m3);
        
        // Leg 4: On-holding (buyer arrival)
        const [m4] = await db.insert(movements).values({
          animalId: animal.id,
          fromFarmId: input.marketFarmId,
          toFarmId: input.buyerFarmId,
          type: "MARKET_PURCHASE",
          movementDate: input.purchaseDate || input.marketDate,
          parentMovementId: m1.id,
          legOrder: 4,
          createdAt: date,
          createdBy: ctx.user.id,
        }).returning();
        movements.push(m4);
      }
      
      return { movements, count: input.animalEarTags.length };
    }),
  
  // ── Birth Notification ──
  notifyBirth: protectedProcedure
    .input(birthNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      // Calculate tagging deadline (20 days from birth - legacy rule)
      const birthDate = input.actualBirthDate || new Date();
      const deadline = new Date(birthDate);
      deadline.setDate(deadline.getDate() + 20);
      
      const [notification] = await db.insert(birthNotifications).values({
        farmId: input.farmId,
        notificationDate: input.notificationDate,
        expectedBirthDate: input.expectedBirthDate,
        actualBirthDate: input.actualBirthDate,
        taggingDeadline: deadline,
        numberOfCalves: input.numberOfCalves,
        status: "PENDING",
        createdAt: new Date(),
        createdBy: ctx.user.id,
      }).returning();
      
      // Trigger WebSocket notification to assigned Vet
      await notifyVetAssignment(notification);
      
      return notification;
    }),
});
```

```typescript
// packages/@prasici/trpc/src/routers/admin.ts
import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { db } from "@prasici/db";
import { users, roles, userRoles, permissions, rolePermissions } from "@prasici/db/schema/sm";
import { businessRules, systemParameters } from "@prasici/db/schema/sm";
import { farms } from "@prasici/db/schema/hk";
import { TRPCError } from "@trpc/server";
import { eq, like } from "drizzle-orm";
import bcrypt from "bcrypt";

// ── Admin-specific validation schemas ──
const adminCreateUserSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  organizationId: z.string().uuid(),
  language: z.enum(["MK", "EN", "SQ", "SR"]).default("MK"),
  roles: z.array(z.string().uuid()).min(1),
  geoUnlimited: z.boolean().default(false),
});

const adminUpdateParamsSchema = z.object({
  code: z.string().min(1).max(50),
  value: z.string(),
}).refine(
  async (data) => {
    // Check parameter exists and is editable
    const param = await db.query.systemParameters.findFirst({
      where: eq(systemParameters.code, data.code),
    });
    return param?.isEditable ?? false;
  },
  { message: "Parameter not found or not editable" }
);

const adminBulkOperationSchema = z.object({
  operation: z.enum(["APPROVE", "REJECT", "ARCHIVE", "ASSIGN"]),
  recordIds: z.array(z.string().uuid()).min(1).max(1000),
  reason: z.string().max(500).optional(),
  assignTo: z.string().uuid().optional(),
});

export const adminRouter = router({
  // ── System Health ──
  health: adminProcedure.query(async ({ ctx }) => {
    const poolStatus = await ctx.db.pool.query("SELECT 1 as health");
    return {
      status: "healthy",
      database: poolStatus.rows[0],
      uptime: process.uptime(),
    };
  }),
  
  // ── User Management ──
  users: {
    list: adminProcedure
      .input(z.object({
        page: z.number().default(1),
        limit: z.number().max(100).default(20),
        search: z.string().optional(),
        status: z.string().optional(),
        orgId: z.string().uuid().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const conditions = [];
        if (input.search) {
          conditions.push(
            or(
              like(users.username, `%${input.search}%`),
              like(users.firstName, `%${input.search}%`),
              like(users.lastName, `%${input.search}%`),
            )
          );
        }
        if (input.status) conditions.push(eq(users.status, input.status));
        if (input.orgId) conditions.push(eq(users.organizationId, input.orgId));
        
        return db.query.users.findMany({
          where: and(...conditions),
          with: {
            roles: { with: { role: true } },
            organization: true,
          },
          limit: input.limit,
          offset: (input.page - 1) * input.limit,
        });
      }),
    
    create: adminProcedure
      .input(adminCreateUserSchema)
      .mutation(async ({ ctx, input }) => {
        // Hash password
        const passwordHash = await bcrypt.hash(input.password, 12);
        
        // Create user
        const [user] = await db.insert(users).values({
          username: input.username,
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          organizationId: input.organizationId,
          language: input.language,
          geoUnlimited: input.geoUnlimited,
          createdBy: ctx.user.id,
        }).returning();
        
        // Assign roles
        for (const roleId of input.roles) {
          await db.insert(userRoles).values({
            userId: user.id,
            roleId,
            createdBy: ctx.user.id,
          });
        }
        
        return user;
      }),
    
    updateStatus: adminProcedure
      .input(z.object({
        userId: z.string().uuid(),
        status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.update(users)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(users.id, input.userId))
          .returning();
      }),
  },
  
  // ── Business Rules Management ──
  businessRules: {
    list: adminProcedure.query(async () => {
      return db.query.businessRules.findMany({
        with: { modules: true },
        orderBy: (rules, { asc }) => [asc(rules.name)],
      });
    }),
    
    toggle: adminProcedure
      .input(z.object({
        ruleId: z.string().uuid(),
        isActive: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.update(businessRules)
          .set({ isActive: input.isActive })
          .where(eq(businessRules.id, input.ruleId))
          .returning();
      }),
    
    updateParams: adminProcedure
      .input(adminUpdateParamsSchema)
      .mutation(async ({ ctx, input }) => {
        return db.update(systemParameters)
          .set({ value: input.value, updatedAt: new Date() })
          .where(eq(systemParameters.code, input.code))
          .returning();
      }),
  },
  
  // ── Bulk Operations ──
  bulkApprove: adminProcedure
    .input(adminBulkOperationSchema)
    .mutation(async ({ ctx, input }) => {
      const results = [];
      
      for (const id of input.recordIds) {
        switch (input.operation) {
          case "APPROVE":
            const [farm] = await db.update(farms)
              .set({
                verificationStatus: "APPROVED",
                verifiedAt: new Date(),
                verifiedBy: ctx.user.id,
                verificationNote: input.reason,
              })
              .where(eq(farms.id, id))
              .returning();
            results.push(farm);
            break;
          case "REJECT":
            // similar...
            break;
        }
      }
      
      return { processed: results.length, results };
    }),
  
  // ── Audit Log ──
  auditLog: adminProcedure
    .input(z.object({
      from: z.date().optional(),
      to: z.date().optional(),
      userId: z.string().uuid().optional(),
      action: z.string().optional(),
      resource: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().max(200).default(50),
    }))
    .query(async ({ ctx, input }) => {
      return db.query.auditLog.findMany({
        where: and(
          input.from ? gte(auditLog.createdAt, input.from) : undefined,
          input.to ? lt(auditLog.createdAt, input.to) : undefined,
          input.userId ? eq(auditLog.userId, input.userId) : undefined,
          input.action ? eq(auditLog.action, input.action) : undefined,
          input.resource ? eq(auditLog.resource, input.resource) : undefined,
        ),
        orderBy: (log, { desc }) => [desc(log.createdAt)],
        limit: input.limit,
        offset: (input.page - 1) * input.limit,
      });
    }),
  
  // ── Code Table Management ──
  codeTables: {
    list: adminProcedure
      .input(z.object({
        group: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (input.group) {
          return db.query.codeTables.findMany({
            where: eq(codeTables.group, input.group),
            orderBy: (ct, { asc }) => [asc(ct.displayOrder)],
          });
        }
        return db.query.codeTables.findMany({
          orderBy: (ct, { asc }) => [asc(ct.group), asc(ct.displayOrder)],
        });
      }),
    
    upsert: adminProcedure
      .input(z.object({
        id: z.string().uuid().optional(),
        group: z.string().min(1).max(50),
        code: z.string().min(1).max(50),
        labels: z.record(z.string(), z.string()),
        displayOrder: z.number().default(0),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.id) {
          return db.update(codeTables)
            .set({
              group: input.group,
              code: input.code,
              label: input.labels,
              displayOrder: input.displayOrder,
              isActive: input.isActive,
            })
            .where(eq(codeTables.id, input.id))
            .returning();
        }
        return db.insert(codeTables).values({
          group: input.group,
          code: input.code,
          label: input.labels,
          displayOrder: input.displayOrder,
          isActive: input.isActive,
          createdBy: ctx.user.id,
        }).returning();
      }),
  },
  
  // ── Dashboard Stats ──
  dashboard: adminProcedure.query(async ({ ctx }) => {
    const [pendingFarms, totalAnimals, todayMovements, pendingBirths] = await Promise.all([
      db.select({ count: count() }).from(farms)
        .where(eq(farms.verificationStatus, "PENDING_VD_APPROVAL")),
      db.select({ count: count() }).from(animals)
        .where(eq(animals.status, "ALIVE")),
      db.select({ count: count() }).from(movements)
        .where(gte(movements.createdAt, new Date(new Date().setHours(0,0,0,0)))),
      db.select({ count: count() }).from(birthNotifications)
        .where(eq(birthNotifications.status, "PENDING")),
    ]);
    
    return {
      pendingFarms: pendingFarms[0].count,
      totalAnimals: totalAnimals[0].count,
      todayMovements: todayMovements[0].count,
      pendingBirths: pendingBirths[0].count,
    };
  }),
});
```

---

## 5. Database Setup & Migration

### 5.1 Docker Compose for Local Development

```yaml
# docker-compose.yml
version: "3.9"
services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: aimcs
      POSTGRES_USER: aimcs
      POSTGRES_PASSWORD: aimcs_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d
    command:
      - -c shared_preload_libraries=pg_stat_statements
      - -c pg_stat_statements.track=all

volumes:
  pgdata:
```

### 5.2 PostgreSQL Initialization Script

```sql
-- db/init/001-extensions.sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- db/init/002-enums.sql
-- (All the enums from Section 1.1 above)

-- db/init/003-seed-data.sql
-- Seed roles
INSERT INTO roles (name, description, is_system) VALUES
  ('SUPER_ADMIN', 'Full system access', true),
  ('VD_ADMIN', 'Veterinary Department Administrator', true),
  ('VD_STAFF', 'VD data reviewers', true),
  ('VETERINARIAN', 'Field veterinarian', true),
  ('FARMER', 'Livestock keeper', true);

-- Seed system parameters
INSERT INTO system_parameters (code, value, data_type, description, "group") VALUES
  ('CALVING_PERIOD_DAYS', '365', 'NUMBER', 'Minimum interval between calving', 'CALVING'),
  ('MIN_MOTHER_AGE_MONTHS', '17', 'NUMBER', 'Minimum mother age for breeding', 'CALVING'),
  ('BIRTH_NOTIFICATION_DAYS', '7', 'NUMBER', 'Days to notify after birth', 'TAGGING'),
  ('TAGGING_DEADLINE_DAYS', '20', 'NUMBER', 'Days to tag after birth', 'TAGGING'),
  ('SLAUGHTER_MIN_AGE_DAYS', '25', 'NUMBER', 'Minimum age for slaughter', 'MOVEMENT'),
  ('ORDER_MIN_INTERVAL_DAYS', '120', 'NUMBER', 'Minimum days between ear tag orders', 'EARTAGS'),
  ('MAX_ORDERS_PER_YEAR', '4', 'NUMBER', 'Maximum ear tag orders per year', 'EARTAGS');

-- Seed initial admin user (password: admin123)
INSERT INTO users (username, password_hash, first_name, last_name, status) VALUES
  ('admin', crypt('admin123', gen_salt('bf', 12)), 'System', 'Administrator', 'ACTIVE');
INSERT INTO user_roles (user_id, role_id)
  SELECT u.id, r.id FROM users u, roles r
  WHERE u.username = 'admin' AND r.name = 'SUPER_ADMIN';
```

### 5.3 Drizzle Configuration

```typescript
// packages/@prasici/db/drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema/**/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### 5.4 Migration Commands

```json
// packages/@prasici/db/package.json
{
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "push": "drizzle-kit push",
    "seed": "tsx src/seed.ts",
    "studio": "drizzle-kit studio"
  }
}
```

---

## 6. Key Design Decisions Summary

| Decision | Legacy | Modern | Reason |
|---|---|---|---|
| **ID System** | Integer sequences (ID_NUM_DOM) | UUID v4 | Distributed-friendly, no central sequence needed |
| **Audit Trail** | Generic ID_SESSION on every table | Centralized audit_log table | Single source of truth, queryable, partitionable |
| **Coordinates** | X/Y/Z NUMBER(10,3) | PostGIS geometry(Point, 4326) | Spatial queries, reverse-geocoding, native indexing |
| **Ownership** | OWNER varchar(5) + D_INSERT/ID_INSERTER | createdBy/updatedBy UUID | Consistent, type-safe, foreign-keyed |
| **Temporary Tables** | Separate HK_TEMP tables | verification_status column | Same schema, simpler queries, no sync needed |
| **Business Rules** | PL/SQL in Oracle | Zod 4 schemas in TypeScript | Type-safe, shareable frontend/backend, testable |
| **Movement** | Two-phase (departure + arrival) | Single record with parentMovementId | Atomic transactions, simpler API |
| **Code Tables** | SM_LOG_CODES with DISP_CODE | code_tables with JSONB labels | Multi-language in one column, flexible |
| **Sessions** | SM_SESSIONS table | JWT + user_sessions table | Stateless by default, refresh token support |
| **Roles** | SM_GROUPS + SM_GRP_PRIVS | roles + permissions + role_permissions | Fine-grained, scope-limited RBAC |
| **Farm ID** | PDA_DEVICE_ID * 100000 + counter | Shared utility function with check digit | Consistent, no offline collision risk |
| **Sync** | ActiveSync text files | tRPC incremental sync | Type-safe, real-time capable, offline queue |
