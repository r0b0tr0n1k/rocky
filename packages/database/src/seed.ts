// ── Seed: Permissions, Role→Permission Mappings & Master Data ──
// Run: pnpm -C packages/database seed
//
// Populates Layer 3 (authorization) of the 3-layer RBAC architecture:
//   Layer 1: pgPolicy (RLS) - row-level filtering
//   Layer 2: RLSMiddleware - SET LOCAL session vars
//   Layer 3: PermissionGuard - action-level checks
//
// Also seeds domain master data: diseases, vaccines.
//
// Based on: SM.PDF (Oracle AIMCS), FS-HK, FS-Eartags, FS-Registration, FS-Health

import "dotenv/config";
import { hashPassword } from "@better-auth/utils/password";
import { sql } from "drizzle-orm";
import { MODULE_TYPE } from "./constants/module-type.js";
import { ROLE_PRIORITY } from "./constants/role-priority.js";
import { VACCINE_TYPE } from "./constants/vaccine-type.js";
import { db } from "./index.js";
import { permissions, rolePermissions, roles } from "./schema/sm/rbac.js";
import { diseases } from "./schema/hd/diseases.js";
import { labTests } from "./schema/hd/lab-tests.js";
import { vaccines } from "./schema/hd/vaccines.js";
import { vaccineDiseases } from "./schema/hd/vaccine-diseases.js";
import { eventSubscriptions } from "./schema/events/event-subscriptions.js";
import { user as authUser, account as authAccount } from "./schema/auth/index.js";
import { users } from "./schema/sm/users.js";
import { userRoles } from "./schema/sm/rbac.js";
import { organizations } from "./schema/sm/organizations.js";
import { modules, systemParameters } from "./schema/sm/modules.js";
import { states, zipCodes, addresses } from "./schema/hk/addresses.js";
import { farms } from "./schema/hk/farms.js";
import { subjects } from "./schema/hk/subjects.js";
import { farmSubjects } from "./schema/hk/farm-subjects.js";
import { animals } from "./schema/an/animals.js";
import { movements } from "./schema/an/movements.js";
import { sanitaryInspections } from "./schema/an/sanitary-inspections.js";
import { outboxEvents } from "./schema/sm/outbox-events.js";
import { USER_STATUS } from "./constants/user-status.js";
import { LANGUAGE } from "./constants/language.js";
import { ORG_TYPE } from "./constants/org-type.js";
import { FARM_TYPE } from "./constants/farm-type.js";
import { DATA_SOURCE } from "./constants/data-source.js";
import { VERIFICATION_STATUS } from "./constants/verification-status.js";
import { PERMISSION_SCOPE } from "./constants/permission-scope.js";
import { ANIMAL_STATUS } from "./constants/animal-status.js";
import { DISEASE_CATEGORY } from "./constants/disease-category.js";
import { CONTROL_MEASURES } from "./constants/control-measures.js";
import { SEX } from "./constants/sex.js";
import { MOVEMENT_TYPE } from "./constants/movement-type.js";
import { SUBJECT_ROLE } from "./constants/subject-role.js";
import { TEST_TYPE } from "./constants/test-type.js";
import { TEST_RESULT } from "./constants/test-result.js";
import { SAMPLE_STATUS } from "./constants/sample-status.js";
import { SANITARY_DECISION } from "./constants/sanitary-decision.js";
import { OUTBOX_AGGREGATE_TYPE } from "./constants/outbox-aggregate-type.js";
import { OUTBOX_EVENT_STATUS } from "./constants/outbox-event-status.js";

// ── Permission Definitions ─────────────────────────────────────
// Each entry: { resource, action, description, scope }
//   scope: * = system-wide, org = org-scoped, farm = farm-scoped

const PERMISSION_DEFS = [
  // System Management
  { resource: "sm:users", action: "read", description: "View system users", scope: PERMISSION_SCOPE.ALL },
  { resource: "sm:users", action: "write", description: "Create/update/delete system users", scope: PERMISSION_SCOPE.ALL },
  { resource: "sm:roles", action: "read", description: "View roles and their permissions", scope: PERMISSION_SCOPE.ALL },
  { resource: "sm:roles", action: "write", description: "Create/update/delete roles", scope: PERMISSION_SCOPE.ALL },
  { resource: "sm:orgs", action: "read", description: "View organizations", scope: PERMISSION_SCOPE.ALL },
  { resource: "sm:orgs", action: "write", description: "Create/update/delete organizations", scope: PERMISSION_SCOPE.ALL },
  { resource: "sm:audit", action: "read", description: "View audit log", scope: PERMISSION_SCOPE.ALL },
  { resource: "sm:sysparams", action: "read", description: "View system parameters", scope: PERMISSION_SCOPE.ALL },
  { resource: "sm:sysparams", action: "write", description: "Modify system parameters", scope: PERMISSION_SCOPE.ALL },
  { resource: "sm:modules", action: "read", description: "View feature-flag modules", scope: PERMISSION_SCOPE.ALL },
  { resource: "sm:modules", action: "write", description: "Enable/disable feature-flag modules", scope: PERMISSION_SCOPE.ALL },

  // Holder/Keeper (HK) Module
  { resource: "hk:farm", action: "read", description: "View farm/holding data", scope: PERMISSION_SCOPE.ORG },
  { resource: "hk:farm", action: "write", description: "Create/update farms", scope: PERMISSION_SCOPE.ORG },
  { resource: "hk:subject", action: "read", description: "View holder/keeper data", scope: PERMISSION_SCOPE.ORG },
  { resource: "hk:subject", action: "write", description: "Create/update holder/keeper records", scope: PERMISSION_SCOPE.ORG },
  { resource: "hk:address", action: "read", description: "View addresses", scope: PERMISSION_SCOPE.ORG },
  { resource: "hk:address", action: "write", description: "Create/update addresses", scope: PERMISSION_SCOPE.ORG },
  { resource: "hk:binding", action: "read", description: "View holder-farm bindings", scope: PERMISSION_SCOPE.ORG },
  { resource: "hk:binding", action: "write", description: "Manage holder-farm bindings", scope: PERMISSION_SCOPE.ORG },
  { resource: "hk:import", action: "admin", description: "Import HK data from flat files/PDA", scope: PERMISSION_SCOPE.ALL },

  // Animal Module
  { resource: "animal", action: "read", description: "View animal records", scope: PERMISSION_SCOPE.FARM },
  { resource: "animal", action: "register", description: "Register new animals", scope: PERMISSION_SCOPE.FARM },
  { resource: "animal", action: "write", description: "Update animal data", scope: PERMISSION_SCOPE.FARM },
  { resource: "animal", action: "death", description: "Record animal death/stillborn", scope: PERMISSION_SCOPE.FARM },

  // Movement Module
  { resource: "movement", action: "read", description: "View movement records", scope: PERMISSION_SCOPE.FARM },
  { resource: "movement", action: "write", description: "Record animal movements", scope: PERMISSION_SCOPE.FARM },
  { resource: "movement", action: "import", description: "Import animals from other states", scope: PERMISSION_SCOPE.ORG },
  { resource: "movement", action: "export", description: "Export animals", scope: PERMISSION_SCOPE.ORG },
  { resource: "movement", action: "pasture", description: "Declare pasture movements", scope: PERMISSION_SCOPE.FARM },

  // Ear Tag Module
  { resource: "eartag", action: "read", description: "View ear tag data", scope: PERMISSION_SCOPE.ORG },
  { resource: "eartag", action: "generate", description: "Generate new ear tag numbers", scope: PERMISSION_SCOPE.ALL },
  { resource: "eartag", action: "order", description: "Place ear tag orders", scope: PERMISSION_SCOPE.FARM },
  { resource: "eartag", action: "order:cancel", description: "Cancel own ear tag orders", scope: PERMISSION_SCOPE.FARM },
  { resource: "eartag", action: "order:cancel:any", description: "Cancel any ear tag order", scope: PERMISSION_SCOPE.ALL },
  { resource: "eartag", action: "order:view_all", description: "View all orders system-wide", scope: PERMISSION_SCOPE.ALL },
  { resource: "eartag", action: "supply", description: "Manage supplier contingents", scope: PERMISSION_SCOPE.ALL },
  { resource: "eartag", action: "collect_orders", description: "Collect orders for printing", scope: PERMISSION_SCOPE.ORG },
  { resource: "eartag", action: "confirm_delivery", description: "Confirm ear tag delivery", scope: PERMISSION_SCOPE.ORG },
  { resource: "eartag", action: "allocate", description: "Allocate tags to vet stations", scope: PERMISSION_SCOPE.ALL },

  // Slaughter
  { resource: "slaughter", action: "read", description: "View slaughter records", scope: PERMISSION_SCOPE.FARM },
  { resource: "slaughter", action: "register", description: "Register slaughter", scope: PERMISSION_SCOPE.FARM },

  // Birth Notifications
  { resource: "birth_notification", action: "read", description: "View birth notifications", scope: PERMISSION_SCOPE.FARM },
  { resource: "birth_notification", action: "write", description: "Record birth notifications", scope: PERMISSION_SCOPE.FARM },

  // Pasture
  { resource: "pasture", action: "read", description: "View pasture declarations", scope: PERMISSION_SCOPE.FARM },
  { resource: "pasture", action: "declare", description: "Declare pasture movements", scope: PERMISSION_SCOPE.FARM },

  // Analysis & Reports
  { resource: "analysis", action: "read", description: "View risk analyses", scope: PERMISSION_SCOPE.ALL },
  { resource: "analysis", action: "run", description: "Execute risk analyses", scope: PERMISSION_SCOPE.ALL },
  { resource: "report", action: "read", description: "View system reports", scope: PERMISSION_SCOPE.ORG },
  { resource: "report", action: "generate", description: "Generate reports", scope: PERMISSION_SCOPE.ORG },

  // PDA / Mobile
  { resource: "pda", action: "sync", description: "Sync data with PDA subsystem", scope: PERMISSION_SCOPE.ORG },
  { resource: "pda", action: "import", description: "Import PDA field data", scope: PERMISSION_SCOPE.ALL },

  // Device Registry
  { resource: "device", action: "read", description: "View PDA device registry", scope: PERMISSION_SCOPE.ORG },
  { resource: "device", action: "write", description: "Register/update PDA devices", scope: PERMISSION_SCOPE.ORG },
  { resource: "device", action: "admin", description: "Administer PDA devices (block/unblock)", scope: PERMISSION_SCOPE.ALL },

  // Notifications
  { resource: "notification", action: "read", description: "View notifications", scope: PERMISSION_SCOPE.ORG },
  { resource: "notification", action: "write", description: "Send/manage notifications", scope: PERMISSION_SCOPE.ORG },
  { resource: "notification", action: "admin", description: "Configure notification templates", scope: PERMISSION_SCOPE.ALL },

  // Health Module
  { resource: "health", action: "read", description: "View health records (diseases, vaccines, treatments, lab tests)", scope: PERMISSION_SCOPE.FARM },
  { resource: "health", action: "write", description: "Record health events (vaccinations, treatments, lab tests)", scope: PERMISSION_SCOPE.FARM },
  { resource: "health", action: "admin", description: "Manage disease/vaccine master data", scope: PERMISSION_SCOPE.ALL },

  // Archive Module
  { resource: "archive", action: "read", description: "View archived documents", scope: PERMISSION_SCOPE.ORG },
  { resource: "archive", action: "write", description: "Archive documents", scope: PERMISSION_SCOPE.ORG },
  { resource: "archive", action: "destroy", description: "Mark documents as destroyed", scope: PERMISSION_SCOPE.ALL },

  // Correction Module
  { resource: "correction", action: "read", description: "View correction cases", scope: PERMISSION_SCOPE.ORG },
  { resource: "correction", action: "write", description: "Create correction cases", scope: PERMISSION_SCOPE.FARM },
  { resource: "correction", action: "resolve", description: "Review/resolve correction cases", scope: PERMISSION_SCOPE.ORG },

  // Passport Module
  { resource: "passport", action: "read", description: "View cattle passports", scope: PERMISSION_SCOPE.ORG },
  { resource: "passport", action: "create", description: "Issue new passports", scope: PERMISSION_SCOPE.ORG },
  { resource: "passport", action: "admin", description: "Seize/reprint/cancel passports", scope: PERMISSION_SCOPE.ALL },
] as const;

// ── Role→Permission Mapping ────────────────────────────────────
// Each entry: role -> permission keys to grant

const ROLE_PERM_MAP: Record<string, string[]> = {
  SUPER_ADMIN: [
    // Everything - all permissions
    "*",
  ],

  VD_ADMIN: [
    // Everything - all permissions
    "*",
  ],

  VD_STAFF: [
    // All reads
    "sm:users:read",
    "sm:roles:read",
    "sm:orgs:read",
    "sm:audit:read",
    "sm:sysparams:read",
    "hk:farm:read",
    "hk:subject:read",
    "hk:address:read",
    "hk:binding:read",
    "animal:read",
    "movement:read",
    "eartag:read",
    "slaughter:read",
    "birth_notification:read",
    "pasture:read",
    "analysis:read",
    "report:read",
    "report:generate",
    "notification:read",
    // HK writes (VD manages HK data)
    "hk:farm:write",
    "hk:subject:write",
    "hk:address:write",
    "hk:binding:write",
    "hk:import:admin",
    // Ear tag management
    "eartag:generate",
    "eartag:supply",
    "eartag:allocate",
    "eartag:order:view_all",
    // Admin writes
    "sm:roles:write",
    "sm:users:write",
    "sm:orgs:write",
    "notification:write",
    "notification:admin",
    // PDA
    "pda:sync",
    "pda:import",
    // Health
    "health:read",
    "health:admin",
    // Archive
    "archive:read",
    "archive:write",
    "archive:destroy",
    // Correction
    "correction:read",
    "correction:resolve",
    // Passport
    "passport:read",
    "passport:create",
    "passport:admin",
  ],

  VETERINARIAN: [
    "animal:read",
    "animal:register",
    "animal:write",
    "animal:death",
    "movement:read",
    "movement:write",
    "eartag:read",
    "eartag:order",
    "birth_notification:read",
    "birth_notification:write",
    "slaughter:read",
    "pasture:read",
    "pasture:declare",
    "report:read",
    "hk:farm:read",
    "hk:subject:read",
    "hk:address:read",
    // Health
    "health:read",
    "health:write",
  ],

  TECHNICIAN: [
    "animal:read",
    "animal:register",
    "movement:read",
    "eartag:read",
    "eartag:order",
    "hk:farm:read",
    "hk:subject:read",
    // Health
    "health:read",
  ],

  SUPPLIER: [
    "eartag:read",
    "eartag:order:view_all",
    "eartag:collect_orders",
    "eartag:confirm_delivery",
    "hk:farm:read",
    "report:read",
  ],

  SLAUGHTERHOUSE_OP: [
    "animal:read",
    "movement:read",
    "slaughter:read",
    "slaughter:register",
    "eartag:read",
    "hk:farm:read",
  ],

  MARKET_OP: ["animal:read", "movement:read", "movement:write", "eartag:read", "hk:farm:read"],

  FARMER: [
    "animal:read",
    "movement:read",
    "eartag:read",
    "eartag:order",
    "birth_notification:read",
    "birth_notification:write",
    "pasture:read",
    "pasture:declare",
    "hk:farm:read",
    // Health
    "health:read",
  ],
};

// ═══════════════════════════════════════════════════════════════
// SEED EXECUTION
// ═══════════════════════════════════════════════════════════════

async function seed() {
  console.log("🌱 Seeding permissions...");

  // 1. Upsert all permissions
  for (const def of PERMISSION_DEFS) {
    await db
      .insert(permissions)
      .values({
        resource: def.resource,
        action: def.action,
        description: def.description,
        scope: def.scope,
      })
      .onConflictDoNothing({
        target: [permissions.resource, permissions.action],
      });
  }

  const allPerms = await db.select().from(permissions);
  const permLookup = new Map(allPerms.map((p) => [`${p.resource}:${p.action}`, p.id]));
  console.log(`  ✓ ${allPerms.length} permissions registered`);

  // 1.5. Seed system roles
  const ROLE_DEFS = [
    { name: "SUPER_ADMIN", description: "System super administrator - full access", priority: ROLE_PRIORITY.CRITICAL },
    {
      name: "VD_ADMIN",
      description: "Veterinary Directorate administrator - full access",
      priority: ROLE_PRIORITY.CRITICAL,
    },
    {
      name: "VD_STAFF",
      description: "Veterinary Directorate staff - management operations",
      priority: ROLE_PRIORITY.HIGH,
    },
    { name: "VETERINARIAN", description: "Field veterinarian - animal operations", priority: ROLE_PRIORITY.NORMAL },
    { name: "TECHNICIAN", description: "Field technician - basic operations", priority: ROLE_PRIORITY.NORMAL },
    { name: "SUPPLIER", description: "Ear tag supplier - order management", priority: ROLE_PRIORITY.NORMAL },
    {
      name: "SLAUGHTERHOUSE_OP",
      description: "Slaughterhouse operator - slaughter records",
      priority: ROLE_PRIORITY.LOW,
    },
    { name: "MARKET_OP", description: "Livestock market operator - market movements", priority: ROLE_PRIORITY.LOW },
    { name: "FARMER", description: "Farmer/keeper - own farm operations", priority: ROLE_PRIORITY.LOW },
  ] as const;

  for (const def of ROLE_DEFS) {
    await db
      .insert(roles)
      .values({ name: def.name, description: def.description, priority: def.priority, isSystem: true })
      .onConflictDoNothing({ target: [roles.name] });
  }
  console.log(`  ✓ ${ROLE_DEFS.length} system roles registered`);

  // 2. Get all system roles
  const allRoles = await db.select().from(roles).where(sql`is_system = true`);
  const roleLookup = new Map(allRoles.map((r) => [r.name, r.id]));

  // 3. Assign permissions to roles
  let assignments = 0;
  for (const [roleName, permKeys] of Object.entries(ROLE_PERM_MAP)) {
    const roleId = roleLookup.get(roleName);
    if (!roleId) {
      console.warn(`  ⚠ Role "${roleName}" not found - skipping`);
      continue;
    }

    const isWildcard = permKeys.length === 1 && permKeys[0] === "*";
    const targets = isWildcard
      ? allPerms.map((p) => p.id)
      : (permKeys.map((k) => permLookup.get(k)).filter(Boolean) as string[]);

    for (const permId of targets) {
      const pid = permId;
      if (!pid) continue;
      await db
        .insert(rolePermissions)
        .values({ roleId, permissionId: pid })
        .onConflictDoNothing({
          target: [rolePermissions.roleId, rolePermissions.permissionId],
        });
      assignments++;
    }
  }

  console.log(`  ✓ ${assignments} role→permission assignments created`);

  // ═══════════════════════════════════════════════════════════════
  // 3.5 Seed Feature Flags (modules) & System Parameters
  // ═══════════════════════════════════════════════════════════════

  console.log("🌱 Seeding feature flags (modules)...");

  const MODULE_DEFS: Array<{
    name: string;
    title: string;
    type: (typeof MODULE_TYPE)[keyof typeof MODULE_TYPE];
    icon: string;
    route: string;
    orderSeq: number;
    isActive: boolean;
  }> = [
    { name: "ANIMALS", title: "Animal Registry", type: MODULE_TYPE.FEATURE, icon: "PawPrint", route: "/animals", orderSeq: 10, isActive: true },
    { name: "MOVEMENTS", title: "Movements", type: MODULE_TYPE.FEATURE, icon: "ArrowLeftRight", route: "/movements", orderSeq: 20, isActive: true },
    { name: "PASSPORTS", title: "Passports", type: MODULE_TYPE.FEATURE, icon: "BookUser", route: "/passports", orderSeq: 30, isActive: true },
    { name: "EARTAGS", title: "Ear Tags", type: MODULE_TYPE.FEATURE, icon: "Tags", route: "/ear-tags", orderSeq: 40, isActive: true },
    { name: "HEALTH", title: "Health", type: MODULE_TYPE.FEATURE, icon: "HeartPulse", route: "/health", orderSeq: 50, isActive: true },
    { name: "INSPECTIONS", title: "Inspections", type: MODULE_TYPE.FEATURE, icon: "ClipboardCheck", route: "/inspections", orderSeq: 60, isActive: true },
    { name: "CORRECTIONS", title: "Corrections", type: MODULE_TYPE.FEATURE, icon: "Wrench", route: "/corrections", orderSeq: 70, isActive: true },
    { name: "ARCHIVE", title: "Archive", type: MODULE_TYPE.FEATURE, icon: "Archive", route: "/archive", orderSeq: 80, isActive: true },
    { name: "NOTIFICATIONS", title: "Notifications", type: MODULE_TYPE.FEATURE, icon: "Bell", route: "/notifications", orderSeq: 90, isActive: true },
    { name: "IOT", title: "IoT", type: MODULE_TYPE.INTEGRATION, icon: "RadioTower", route: "/iot", orderSeq: 100, isActive: true },
    { name: "FARMS", title: "Farms", type: MODULE_TYPE.CORE, icon: "Building2", route: "/farms", orderSeq: 110, isActive: true },
    { name: "ORGANIZATIONS", title: "Organizations", type: MODULE_TYPE.ADMIN, icon: "Users", route: "/organizations", orderSeq: 120, isActive: true },
    { name: "USERS", title: "Users", type: MODULE_TYPE.ADMIN, icon: "UserCog", route: "/users", orderSeq: 130, isActive: true },
    { name: "ROLES", title: "Roles & Permissions", type: MODULE_TYPE.ADMIN, icon: "ShieldCheck", route: "/rbac", orderSeq: 140, isActive: true },
    { name: "AUDIT", title: "Audit", type: MODULE_TYPE.ADMIN, icon: "ScrollText", route: "/audit", orderSeq: 150, isActive: true },
    { name: "SYSTEM_PARAMS", title: "System Parameters", type: MODULE_TYPE.ADMIN, icon: "SlidersHorizontal", route: "/system-parameters", orderSeq: 160, isActive: true },
    { name: "FEATURE_FLAGS", title: "Feature Flags", type: MODULE_TYPE.ADMIN, icon: "ToggleLeft", route: "/feature-flags", orderSeq: 170, isActive: true },
  ];

  for (const def of MODULE_DEFS) {
    await db.insert(modules).values(def).onConflictDoNothing({ target: [modules.name] });
  }
  const moduleCount = await db.select({ count: sql<number>`count(*)::int` }).from(modules);
  console.log(`  ✓ ${moduleCount[0]?.count ?? 0} feature-flag modules registered`);

  console.log("🌱 Seeding system parameters...");

  const SYSTEM_PARAM_DEFS: Array<{
    code: string;
    value: string;
    dataType: string;
    group: string;
    description: string;
    isEditable: boolean;
    allowedValues?: string[];
    minValue?: string;
    maxValue?: string;
  }> = [
    { code: "DEFAULT_LANGUAGE", value: LANGUAGE.MK, dataType: "STRING", group: "general", description: "Default UI language", isEditable: true },
    { code: "UI_THEME", value: "system", dataType: "STRING", group: "general", description: "UI color theme", allowedValues: ["light", "dark", "system"], isEditable: true },
    { code: "DATE_FORMAT", value: "dd.MM.yyyy", dataType: "STRING", group: "general", description: "Default date format", isEditable: true },
    { code: "SESSION_TIMEOUT_MIN", value: "30", dataType: "INTEGER", group: "security", description: "Session idle timeout (minutes)", minValue: "5", maxValue: "240", isEditable: true },
    { code: "PASSWORD_MIN_LENGTH", value: "8", dataType: "INTEGER", group: "security", description: "Minimum password length", minValue: "6", maxValue: "64", isEditable: true },
    { code: "AUDIT_RETENTION_DAYS", value: "1095", dataType: "INTEGER", group: "retention", description: "Audit log retention period (days)", minValue: "90", maxValue: "3650", isEditable: true },
    { code: "NOTIFICATIONS_ENABLED", value: "true", dataType: "BOOLEAN", group: "notifications", description: "Enable system notifications", isEditable: true },
    { code: "MAINTENANCE_MODE", value: "false", dataType: "BOOLEAN", group: "system", description: "Enable maintenance mode", isEditable: true },


    // ── MK business-rule defaults (ADR-0030 RuleSet thresholds) ──
    // Seeded as the MK jurisdiction default. Domain services currently hardcode
    // these (the B2 gap, ADR-0023/0030); WO-012 will read them via the RuleSet
    // resolver instead of module-level constants. Idempotent via onConflictDoNothing.
    { code: "ORDER_INTERVAL_DAYS", value: "120", dataType: "INTEGER", group: "business", description: "Minimum days between ear-tag orders", minValue: "1", maxValue: "365", isEditable: true },
    { code: "MAX_ORDERS_PER_YEAR", value: "4", dataType: "INTEGER", group: "business", description: "Maximum ear-tag orders per year", minValue: "1", maxValue: "52", isEditable: true },
    { code: "MIN_VACCINATION_AGE_DAYS", value: "30", dataType: "INTEGER", group: "business", description: "Minimum animal age (days) for vaccination", minValue: "1", isEditable: true },
    { code: "SLAUGHTER_MIN_AGE_DAYS", value: "25", dataType: "INTEGER", group: "business", description: "Minimum age (days) for slaughter", minValue: "1", isEditable: true },
    { code: "STILLBORN_THRESHOLD_DAYS", value: "25", dataType: "INTEGER", group: "business", description: "Max age (days) still classified stillborn", minValue: "1", isEditable: true },
    { code: "ARRIVAL_CORRECTION_DAYS", value: "2", dataType: "INTEGER", group: "business", description: "Arrival correction window (days)", minValue: "0", maxValue: "30", isEditable: true },
    { code: "MIN_MOTHER_AGE_MONTHS", value: "17", dataType: "INTEGER", group: "business", description: "Minimum mother age (months) at birth", minValue: "1", isEditable: true },
    { code: "CALVING_PERIOD_DAYS", value: "365", dataType: "INTEGER", group: "business", description: "Minimum calving gap (days) since last calf", minValue: "1", isEditable: true },
    { code: "SELECTION_PERCENTAGE", value: "10", dataType: "INTEGER", group: "inspection", description: "Annual risk-analysis farm selection percentage", minValue: "1", maxValue: "100", isEditable: true },
    { code: "FARM_SIZE_WEIGHT", value: "0.3", dataType: "DECIMAL", group: "inspection", description: "Risk weight: farm size", isEditable: true },
    { code: "HISTORY_WEIGHT", value: "0.3", dataType: "DECIMAL", group: "inspection", description: "Risk weight: inspection history", isEditable: true },
    { code: "SPECIES_WEIGHT", value: "0.2", dataType: "DECIMAL", group: "inspection", description: "Risk weight: species diversity", isEditable: true },
    { code: "REGION_WEIGHT", value: "0.2", dataType: "DECIMAL", group: "inspection", description: "Risk weight: regional random factor", isEditable: true },
    { code: "FARMER_CAN_ADMINISTER", value: "true", dataType: "BOOLEAN", group: "business", description: "Farmer may administer (vaccinate/register) on own farm (ADR-0030)", isEditable: true },
    { code: "RETENTION_YEARS_CPC", value: "3", dataType: "INTEGER", group: "retention", description: "Archive retention years (CPC tier)", isEditable: true },
    { code: "RETENTION_YEARS_VS", value: "3", dataType: "INTEGER", group: "retention", description: "Archive retention years (VS tier)", isEditable: true },
    { code: "RETENTION_YEARS_VI", value: "3", dataType: "INTEGER", group: "retention", description: "Archive retention years (VI tier)", isEditable: true },
    { code: "RETENTION_YEARS_BIP", value: "3", dataType: "INTEGER", group: "retention", description: "Archive retention years (BIP tier)", isEditable: true },
    { code: "ROLE_VOCAB", value: "owner,keeper,veterinarian,trader,slaughterhouse_op,market_op,technician,guardian", dataType: "STRING", group: "vocab", description: "Subject-role vocabulary for the jurisdiction (ADR-0030 WO-014)", isEditable: true },
    { code: "ADMINISTER_ROLES", value: "veterinarian", dataType: "STRING", group: "business", description: "Roles permitted to administer; overridable per jurisdiction (B3 VI)", isEditable: true },
  ];

  for (const def of SYSTEM_PARAM_DEFS) {
    await db.insert(systemParameters).values(def).onConflictDoNothing({ target: [systemParameters.code] });
  }
  const paramCount = await db.select({ count: sql<number>`count(*)::int` }).from(systemParameters);
  console.log(`  ✓ ${paramCount[0]?.count ?? 0} system parameters registered`);


  // ═══════════════════════════════════════════════════════════════
  // 4. Seed Health Master Data
  // ═══════════════════════════════════════════════════════════════

  console.log("🌱 Seeding health master data...");

  const DISEASE_DEFS = [
    { name: "Anthrax", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_A, controlMeasures: CONTROL_MEASURES.STAMPING_OUT, description: "Bacillus anthracis — acute infectious disease in cattle" },
    { name: "Bovine Brucellosis", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_B, controlMeasures: CONTROL_MEASURES.CONTROL_PROGRAMME, description: "Brucella abortus — causes abortions, highly contagious" },
    { name: "Bovine Tuberculosis", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_B, controlMeasures: CONTROL_MEASURES.CONTROL_PROGRAMME, description: "Mycobacterium bovis — chronic respiratory disease, zoonotic" },
    { name: "Foot and Mouth Disease", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_A, controlMeasures: CONTROL_MEASURES.STAMPING_OUT, description: "Highly contagious viral vesicular disease (Aphtovirus)" },
    { name: "Rabies", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_A, controlMeasures: CONTROL_MEASURES.STAMPING_OUT, description: "Lyssavirus — fatal zoonotic neurological disease" },
    { name: "Bovine Spongiform Encephalopathy", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_A, controlMeasures: CONTROL_MEASURES.STAMPING_OUT, description: "Prion disease — fatal neurodegenerative (BSE)" },
    { name: "Lumpy Skin Disease", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_A, controlMeasures: CONTROL_MEASURES.STAMPING_OUT, description: "Capripoxvirus — nodular skin lesions, fever" },
    { name: "Bluetongue", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_B, controlMeasures: CONTROL_MEASURES.CONTROL_PROGRAMME, description: "Orbivirus — vector-borne disease in ruminants" },
    { name: "Bovine Viral Diarrhea", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_C, controlMeasures: CONTROL_MEASURES.CONTROL_PROGRAMME, description: "Pestivirus — BVD/MD, immunosuppressive" },
    { name: "Infectious Bovine Rhinotracheitis", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_C, controlMeasures: CONTROL_MEASURES.CONTROL_PROGRAMME, description: "BoHV-1 — IBR/IPV respiratory and reproductive disease" },
    { name: "Q Fever", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_B, controlMeasures: CONTROL_MEASURES.CONTROL_PROGRAMME, description: "Coxiella burnetii — zoonotic, causes abortions" },
    { name: "Salmonellosis", notifiable: true, diseaseCategory: DISEASE_CATEGORY.CATEGORY_B, controlMeasures: CONTROL_MEASURES.CONTROL_PROGRAMME, description: "Salmonella enterica — enteric infection, zoonotic" },
    { name: "Mastitis", notifiable: false, diseaseCategory: DISEASE_CATEGORY.CATEGORY_E, controlMeasures: CONTROL_MEASURES.SURVEILLANCE, description: "Bacterial udder infection — E. coli, Staph, Strep" },
    { name: "Bovine Respiratory Disease Complex", notifiable: false, diseaseCategory: DISEASE_CATEGORY.CATEGORY_E, controlMeasures: CONTROL_MEASURES.SURVEILLANCE, description: "Multifactorial BRDC — shipping fever complex" },
    { name: "Coccidiosis", notifiable: false, diseaseCategory: DISEASE_CATEGORY.CATEGORY_E, controlMeasures: CONTROL_MEASURES.SURVEILLANCE, description: "Eimeria spp. — protozoan enteritis in young calves" },
    { name: "Blackleg", notifiable: false, diseaseCategory: DISEASE_CATEGORY.CATEGORY_E, controlMeasures: CONTROL_MEASURES.SURVEILLANCE, description: "Clostridium chauvoei — gas gangrene in muscle" },
  ];

  for (const def of DISEASE_DEFS) {
    await db.insert(diseases).values(def).onConflictDoNothing({ target: [diseases.name] });
  }

  const allDiseases = await db.select().from(diseases);
  const diseaseLookup = new Map(allDiseases.map((d: { name: string; id: string }) => [d.name, d.id]));
  console.log(`  ✓ ${allDiseases.length} diseases registered`);

  const VACCINE_DEFS = [
    { name: "Bovilis BVD", manufacturer: "MSD Animal Health", type: VACCINE_TYPE.INACTIVATED },
    { name: "Bovilis IBR Marker", manufacturer: "MSD Animal Health", type: VACCINE_TYPE.INACTIVATED },
    { name: "Bovilis BTV8", manufacturer: "MSD Animal Health", type: VACCINE_TYPE.INACTIVATED },
    { name: "Lumpy Skin Disease Vaccine", manufacturer: "Onderstepoort Biological Products", type: VACCINE_TYPE.LIVE },
    { name: "Anthrax Spore Vaccine", manufacturer: "Colorado Serum Company", type: VACCINE_TYPE.LIVE },
    { name: "Foot and Mouth Disease Vaccine", manufacturer: "Boehringer Ingelheim", type: VACCINE_TYPE.INACTIVATED },
    { name: "Brucella Abortus S19", manufacturer: "Colorado Serum Company", type: VACCINE_TYPE.LIVE },
    { name: "Pneumosyn", manufacturer: "Boehringer Ingelheim", type: VACCINE_TYPE.INACTIVATED },
  ];

  for (const def of VACCINE_DEFS) {
    await db.insert(vaccines).values(def).onConflictDoNothing({ target: [vaccines.name] });
  }

  const allVaccines = await db.select().from(vaccines);
  const vaccineLookup = new Map(allVaccines.map((v: { name: string; id: string }) => [v.name, v.id]));
  console.log(`  ✓ ${allVaccines.length} vaccines registered`);

  const VACCINE_DISEASE_MAPPINGS = [
    { vaccineId: vaccineLookup.get("Bovilis BVD")!, diseaseId: diseaseLookup.get("Bovine Viral Diarrhea")! },
    { vaccineId: vaccineLookup.get("Bovilis IBR Marker")!, diseaseId: diseaseLookup.get("Infectious Bovine Rhinotracheitis")! },
    { vaccineId: vaccineLookup.get("Bovilis BTV8")!, diseaseId: diseaseLookup.get("Bluetongue")! },
    { vaccineId: vaccineLookup.get("Lumpy Skin Disease Vaccine")!, diseaseId: diseaseLookup.get("Lumpy Skin Disease")! },
    { vaccineId: vaccineLookup.get("Anthrax Spore Vaccine")!, diseaseId: diseaseLookup.get("Anthrax")! },
    { vaccineId: vaccineLookup.get("Foot and Mouth Disease Vaccine")!, diseaseId: diseaseLookup.get("Foot and Mouth Disease")! },
    { vaccineId: vaccineLookup.get("Brucella Abortus S19")!, diseaseId: diseaseLookup.get("Bovine Brucellosis")! },
    { vaccineId: vaccineLookup.get("Pneumosyn")!, diseaseId: diseaseLookup.get("Bovine Respiratory Disease Complex")! },
  ];

  for (const mapping of VACCINE_DISEASE_MAPPINGS) {
    await db.insert(vaccineDiseases).values(mapping).onConflictDoNothing({
      target: [vaccineDiseases.vaccineId, vaccineDiseases.diseaseId],
    });
  }
  console.log(`  ✓ ${VACCINE_DISEASE_MAPPINGS.length} vaccine→disease mappings created`);

  // ═══════════════════════════════════════════════════════════════
  // 5. Seed Default Event Subscriptions
  // ═══════════════════════════════════════════════════════════════

  console.log("🌱 Seeding default event subscriptions...");

  const SUBSCRIPTION_EVENT_TYPES = [
    "disease_detected",
    "animal_registered",
    "approval_requested",
    "movement_recorded",
    "inspection_scheduled",
    "foreign_passport_expiring",
  ] as const;

  const SUBSCRIPTION_ROLES = ["VD_ADMIN", "VETERINARIAN"] as const;

  let subscriptions = 0;
  try {
    for (const roleName of SUBSCRIPTION_ROLES) {
      const roleId = roleLookup.get(roleName);
      if (!roleId) {
        console.warn(`  ⚠ Role "${roleName}" not found - skipping subscription seeding`);
        continue;
      }

      for (const eventType of SUBSCRIPTION_EVENT_TYPES) {
        await db
          .insert(eventSubscriptions)
          .values({
            eventType,
            targetType: "role",
            targetId: roleId,
            conditions: [],
            channels: { inApp: true, email: false, push: false },
            delayMinutes: 0,
            reminderEnabled: false,
            reminderOffsetDays: 0,
            isActive: true,
          });
        subscriptions++;
      }
    }
  } catch (e: any) {
    const msg = e.message || e.cause?.message || '';
    if (msg.includes('does not exist') || e.cause?.code === '42P01') {
      console.warn(`  ⚠ event_subscriptions table not found - skipping subscription seeding`);
    } else {
      throw e;
    }
  }

  console.log(`  ✓ ${subscriptions} default event subscriptions created`);

  // ═══════════════════════════════════════════════════════════════
  // 6. Seed Test Accounts (auth + SM + HK)
  // ═══════════════════════════════════════════════════════════════

  console.log("🌱 Seeding test accounts...");

  const TEST_PASSWORD = "test123456";
  const passwordHash = await hashPassword(TEST_PASSWORD);

  await db.transaction(async (tx) => {
    // Bypass RLS — SUPER_ADMIN can write everywhere
    await tx.execute(sql`SET LOCAL "app.current_role" = 'SUPER_ADMIN'`);

    // 6a. State + ZipCode + Address (required FK chain)
    const [state] = await tx
      .insert(states)
      .values({ name: "Test State", shortName: "TS" })
      .returning();

    const [zip] = await tx
      .insert(zipCodes)
      .values({ name: "Test City", zipCode: "1000", stateId: state!.id })
      .returning();

    await tx
      .insert(addresses)
      .values({ city: "Test City", street: "Test Street", houseNumber: "1", zipCodeId: zip!.id })
      .returning();

    // 6b. Organization (VD)
    const [org] = await tx
      .insert(organizations)
      .values({
        name1: "Test Veterinary Directorate",
        orgType: ORG_TYPE.VD,
        address: { street: "Test Street", city: "Test City", zipCode: "1000" },
        isActive: true,
      })
      .returning();

    // 6c. Test accounts — auth_user + auth_account + sm.users + user_roles
    const TEST_ACCOUNTS = [
      { email: "admin@test.com", name: "Admin User", roleName: "SUPER_ADMIN" as const },
      { email: "vet@test.com", name: "Dr. Vet", roleName: "VETERINARIAN" as const },
      { email: "farmer@test.com", name: "Test Farmer", roleName: "FARMER" as const },
      { email: "staff@test.com", name: "VD Staff", roleName: "VD_STAFF" as const },
    ];

    for (const acct of TEST_ACCOUNTS) {
      const authId = crypto.randomUUID();

      await tx.insert(authUser).values({
        id: authId,
        name: acct.name,
        email: acct.email,
        emailVerified: true,
      });

      await tx.insert(authAccount).values({
        id: crypto.randomUUID(),
        accountId: acct.email,
        providerId: "credential",
        userId: authId,
        password: passwordHash,
      });

      const [smUser] = await tx
        .insert(users)
        .values({
          authUserId: authId,
          username: acct.email.split("@")[0],
          email: acct.email,
          firstName: acct.name.split(" ")[0],
          lastName: acct.name.split(" ").slice(1).join(" ") || acct.name,
          organizationId: org!.id,
          status: USER_STATUS.ACTIVE,
          language: LANGUAGE.MK,
        } as any)
        .returning();

      const roleRow = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(sql`${roles.name} = ${acct.roleName}`)
        .limit(1);

      if (roleRow[0]) {
        await tx.insert(userRoles).values({
          userId: smUser!.id,
          roleId: roleRow[0].id,
        });
      }
    }

    console.log(`  ✓ ${TEST_ACCOUNTS.length} test accounts created (auth + SM + roles)`);
  });

  // 6d. Test farm (separate transaction — table may not exist yet)
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL "app.current_role" = 'SUPER_ADMIN'`);

      const addrRow = await tx.select().from(addresses).limit(1);

      const [farm] = await tx
        .insert(farms)
        .values({
          farmId: "100000001",
          addressId: addrRow[0]!.id,
          name: "Test Farm",
          type: FARM_TYPE.FARM,
          verificationStatus: VERIFICATION_STATUS.APPROVED,
          dataSource: DATA_SOURCE.MOBILE,
          isActive: true,
        })
        .returning();

      if (farm) {
        console.log(`  ✓ Test farm created (id: ${farm.id}, farmId: ${farm.farmId})`);
      }
    });
  } catch (e: any) {
    if (e.cause?.code === '42P01') {
      console.warn(`  ⚠ farms table not found - skipping test farm`);
    } else {
      throw e;
    }
  }

  console.log("  ℹ Test accounts: admin@test.com, vet@test.com, farmer@test.com, staff@test.com");
  console.log("  ℹ Password for all: test123456");

  // ═══════════════════════════════════════════════════════════════
  // 7. Seed Veterinary & Sanitary test data (ADR-0089/0090/0091/0092)
  //    Fake data so the new disease-category, lab-test and sanitary
  //    inspection features can be exercised end-to-end, including the
  //    ADR-0092 Category-A zone-of-alienation trigger.
  // ═══════════════════════════════════════════════════════════════
  console.log("🌱 Seeding veterinary & sanitary test data...");

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL "app.current_role" = 'SUPER_ADMIN'`);

      const [addr] = await tx.select().from(addresses).limit(1);
      if (!addr) throw new Error("No address available for farm seeding");

      // 7a. Establishments: a slaughterhouse + two neighbouring origin farms.
      //     Origin farm #1 carries GPS so the ADR-0092 zone can be drawn.
      const [slaughterhouse] = await tx
        .insert(farms)
        .values({
          farmId: "200000001",
          addressId: addr.id,
          name: "Skopje Slaughterhouse",
          type: FARM_TYPE.SLAUGHTERHOUSE,
          verificationStatus: VERIFICATION_STATUS.APPROVED,
          dataSource: DATA_SOURCE.MOBILE,
          isActive: true,
        })
        .returning();

      const [originFarm1] = await tx
        .insert(farms)
        .values({
          farmId: "200000002",
          addressId: addr.id,
          name: "Green Valley Farm",
          type: FARM_TYPE.FARM,
          verificationStatus: VERIFICATION_STATUS.APPROVED,
          dataSource: DATA_SOURCE.MOBILE,
          isActive: true,
          location: sql`ST_SetSRID(ST_MakePoint(21.4254, 41.9952), 4326)`,
        })
        .returning();

      const [originFarm2] = await tx
        .insert(farms)
        .values({
          farmId: "200000003",
          addressId: addr.id,
          name: "Blue Hills Farm",
          type: FARM_TYPE.FARM,
          verificationStatus: VERIFICATION_STATUS.APPROVED,
          dataSource: DATA_SOURCE.MOBILE,
          isActive: true,
          location: sql`ST_SetSRID(ST_MakePoint(21.4310, 41.9990), 4326)`,
        })
        .returning();

      // 7b. Subjects: a sanitary inspector + a keeper (bound to origin farm #1).
      const [inspector] = await tx
        .insert(subjects)
        .values({ shortName: "Sanitary Inspector", isActive: true })
        .returning();

      const [keeper] = await tx
        .insert(subjects)
        .values({ shortName: "Green Valley Keeper", isActive: true })
        .returning();

      await tx.insert(farmSubjects).values({
        farmId: originFarm1!.id,
        subjectId: keeper!.id,
        role: SUBJECT_ROLE.KEEPER,
      });

      // 7c. Animals on the origin farms.
      const [animal1] = await tx
        .insert(animals)
        .values({
          earTagNumber: "10000001",
          birthDate: "2024-03-15",
          sex: SEX.FEMALE,
          currentFarmId: originFarm1!.id,
          status: ANIMAL_STATUS.ALIVE,
        })
        .returning();
      const [animal2] = await tx
        .insert(animals)
        .values({
          earTagNumber: "10000002",
          birthDate: "2024-03-15",
          sex: SEX.MALE,
          currentFarmId: originFarm1!.id,
          status: ANIMAL_STATUS.ALIVE,
        })
        .returning();
      const [animal3] = await tx
        .insert(animals)
        .values({
          earTagNumber: "10000003",
          birthDate: "2024-03-15",
          sex: SEX.FEMALE,
          currentFarmId: originFarm2!.id,
          status: ANIMAL_STATUS.ALIVE,
        })
        .returning();
      const a1 = animal1!.id;
      const a2 = animal2!.id;
      const a3 = animal3!.id;

      // 7d. Movements: one to the slaughterhouse (gates a sanitary inspection)
      //     + one regular transfer that the ADR-0092 zone will block.
      const [slaughterMovement] = await tx
        .insert(movements)
        .values({
          animalId: a1,
          fromFarmId: originFarm1!.id,
          toFarmId: slaughterhouse!.id,
          type: MOVEMENT_TYPE.SLAUGHTERHOUSE,
          movementDate: "2026-07-10",
        })
        .returning();

      await tx.insert(movements).values({
        animalId: a3,
        fromFarmId: originFarm2!.id,
        toFarmId: originFarm1!.id,
        type: MOVEMENT_TYPE.TRANSFER,
        movementDate: "2026-07-12",
      });

      // 7e. Lab tests — incl. a POSITIVE Category A (Anthrax) on an origin-farm
      //     animal, which fires the ADR-0092 zone-of-alienation automation.
      const anthraxId = diseaseLookup.get("Anthrax")!;
      const fmdId = diseaseLookup.get("Foot and Mouth Disease")!;
      const mastitisId = diseaseLookup.get("Mastitis")!;

      const [anthraxTest] = await tx
        .insert(labTests)
        .values({
          animalId: a1,
          farmId: originFarm1!.id,
          diseaseId: anthraxId,
          testType: TEST_TYPE.PCR,
          testMethod: "qPCR",
          result: TEST_RESULT.POSITIVE,
          interpretation: "CATEGORY A positive — triggers zone lockdown",
          labName: "State Veterinary Lab",
          labSampleId: "SMP-001",
          sampleStatus: SAMPLE_STATUS.COMPLETED,
          sampleDate: "2026-07-09",
          resultDate: "2026-07-11",
        })
        .returning();

      await tx.insert(labTests).values([
        {
          animalId: a2,
          farmId: originFarm1!.id,
          diseaseId: fmdId,
          testType: TEST_TYPE.ELISA,
          result: TEST_RESULT.NEGATIVE,
          sampleStatus: SAMPLE_STATUS.COMPLETED,
          sampleDate: "2026-07-09",
          resultDate: "2026-07-11",
        },
        {
          animalId: a3,
          farmId: originFarm2!.id,
          diseaseId: mastitisId,
          testType: TEST_TYPE.CULTURE,
          result: TEST_RESULT.POSITIVE,
          sampleStatus: SAMPLE_STATUS.COMPLETED,
          sampleDate: "2026-07-10",
          resultDate: "2026-07-12",
        },
      ]);

      // 7e2. Outbox event so the ADR-0092 Zone-of-Alienation handler fires on the
      //      next OutboxProcessorJob run (declares the 3km/10km disease zone).
      await tx.insert(outboxEvents).values({
        type: "lab_test.completed",
        aggregateType: OUTBOX_AGGREGATE_TYPE.LAB_TEST,
        aggregateId: anthraxTest!.id,
        payload: {
          labTestId: anthraxTest!.id,
          animalId: a1,
          farmId: originFarm1!.id,
          diseaseId: anthraxId,
          testType: TEST_TYPE.PCR,
          result: TEST_RESULT.POSITIVE,
          resultNumeric: null,
          resultUnit: null,
          interpretation: "CATEGORY A positive — triggers zone lockdown",
          certificateRef: null,
        },
        status: OUTBOX_EVENT_STATUS.PENDING,
      });

      // 7f. Sanitary inspections (ante-/post-mortem) at the slaughterhouse.
      await tx.insert(sanitaryInspections).values({
        movementId: slaughterMovement!.id,
        farmId: slaughterhouse!.id,
        inspectorSubjectId: inspector!.id,
        anteMortemDecision: SANITARY_DECISION.PASSED,
        anteMortemAt: new Date("2026-07-10T08:00:00Z"),
        postMortemDecision: SANITARY_DECISION.PASSED,
        postMortemAt: new Date("2026-07-10T09:30:00Z"),
      });

      console.log(
        `  ✓ Vet/Sanitary test data: 3 farms (1 slaughterhouse), 2 subjects, 3 animals, 2 movements, 3 lab tests (1 Category-A positive), 1 sanitary inspection, 1 outbox event`,
      );
    });
  } catch (e: any) {
    if (e.cause?.code === "42P01") {
      console.warn(`  ⚠ veterinary/sanitary tables not found - skipping test data`);
    } else {
      throw e;
    }
  }

  console.log("✅ Seed complete.");
}

try {
  await seed();
} catch (e) {
  console.error("❌ Seed failed:", e);
  throw e;
}
