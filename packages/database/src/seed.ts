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
import { sql } from "drizzle-orm";
import { ROLE_PRIORITY } from "./constants/role-priority.js";
import { VACCINE_TYPE } from "./constants/vaccine-type.js";
import { db } from "./index.js";
import { permissions, rolePermissions, roles } from "./schema/sm/rbac.js";
import { diseases } from "./schema/hd/diseases.js";
import { vaccines } from "./schema/hd/vaccines.js";
import { vaccineDiseases } from "./schema/hd/vaccine-diseases.js";

// ── Permission Definitions ─────────────────────────────────────
// Each entry: { resource, action, description, scope }
//   scope: * = system-wide, org = org-scoped, farm = farm-scoped

const PERMISSION_DEFS = [
  // System Management
  { resource: "sm:users", action: "read", description: "View system users", scope: "*" },
  { resource: "sm:users", action: "write", description: "Create/update/delete system users", scope: "*" },
  { resource: "sm:roles", action: "read", description: "View roles and their permissions", scope: "*" },
  { resource: "sm:roles", action: "write", description: "Create/update/delete roles", scope: "*" },
  { resource: "sm:orgs", action: "read", description: "View organizations", scope: "*" },
  { resource: "sm:orgs", action: "write", description: "Create/update/delete organizations", scope: "*" },
  { resource: "sm:audit", action: "read", description: "View audit log", scope: "*" },
  { resource: "sm:sysparams", action: "read", description: "View system parameters", scope: "*" },
  { resource: "sm:sysparams", action: "write", description: "Modify system parameters", scope: "*" },

  // Holder/Keeper (HK) Module
  { resource: "hk:farm", action: "read", description: "View farm/holding data", scope: "org" },
  { resource: "hk:farm", action: "write", description: "Create/update farms", scope: "org" },
  { resource: "hk:subject", action: "read", description: "View holder/keeper data", scope: "org" },
  { resource: "hk:subject", action: "write", description: "Create/update holder/keeper records", scope: "org" },
  { resource: "hk:address", action: "read", description: "View addresses", scope: "org" },
  { resource: "hk:address", action: "write", description: "Create/update addresses", scope: "org" },
  { resource: "hk:binding", action: "read", description: "View holder-farm bindings", scope: "org" },
  { resource: "hk:binding", action: "write", description: "Manage holder-farm bindings", scope: "org" },
  { resource: "hk:import", action: "admin", description: "Import HK data from flat files/PDA", scope: "*" },

  // Animal Module
  { resource: "animal", action: "read", description: "View animal records", scope: "farm" },
  { resource: "animal", action: "register", description: "Register new animals", scope: "farm" },
  { resource: "animal", action: "write", description: "Update animal data", scope: "farm" },
  { resource: "animal", action: "death", description: "Record animal death/stillborn", scope: "farm" },

  // Movement Module
  { resource: "movement", action: "read", description: "View movement records", scope: "farm" },
  { resource: "movement", action: "write", description: "Record animal movements", scope: "farm" },
  { resource: "movement", action: "import", description: "Import animals from other states", scope: "org" },
  { resource: "movement", action: "export", description: "Export animals", scope: "org" },
  { resource: "movement", action: "pasture", description: "Declare pasture movements", scope: "farm" },

  // Ear Tag Module
  { resource: "eartag", action: "read", description: "View ear tag data", scope: "org" },
  { resource: "eartag", action: "generate", description: "Generate new ear tag numbers", scope: "*" },
  { resource: "eartag", action: "order", description: "Place ear tag orders", scope: "farm" },
  { resource: "eartag", action: "order:cancel", description: "Cancel own ear tag orders", scope: "farm" },
  { resource: "eartag", action: "order:cancel:any", description: "Cancel any ear tag order", scope: "*" },
  { resource: "eartag", action: "order:view_all", description: "View all orders system-wide", scope: "*" },
  { resource: "eartag", action: "supply", description: "Manage supplier contingents", scope: "*" },
  { resource: "eartag", action: "collect_orders", description: "Collect orders for printing", scope: "org" },
  { resource: "eartag", action: "confirm_delivery", description: "Confirm ear tag delivery", scope: "org" },
  { resource: "eartag", action: "allocate", description: "Allocate tags to vet stations", scope: "*" },

  // Slaughter
  { resource: "slaughter", action: "read", description: "View slaughter records", scope: "farm" },
  { resource: "slaughter", action: "register", description: "Register slaughter", scope: "farm" },

  // Birth Notifications
  { resource: "birth_notification", action: "read", description: "View birth notifications", scope: "farm" },
  { resource: "birth_notification", action: "write", description: "Record birth notifications", scope: "farm" },

  // Pasture
  { resource: "pasture", action: "read", description: "View pasture declarations", scope: "farm" },
  { resource: "pasture", action: "declare", description: "Declare pasture movements", scope: "farm" },

  // Analysis & Reports
  { resource: "analysis", action: "read", description: "View risk analyses", scope: "*" },
  { resource: "analysis", action: "run", description: "Execute risk analyses", scope: "*" },
  { resource: "report", action: "read", description: "View system reports", scope: "org" },
  { resource: "report", action: "generate", description: "Generate reports", scope: "org" },

  // PDA / Mobile
  { resource: "pda", action: "sync", description: "Sync data with PDA subsystem", scope: "org" },
  { resource: "pda", action: "import", description: "Import PDA field data", scope: "*" },

  // Device Registry
  { resource: "device", action: "read", description: "View PDA device registry", scope: "org" },
  { resource: "device", action: "write", description: "Register/update PDA devices", scope: "org" },
  { resource: "device", action: "admin", description: "Administer PDA devices (block/unblock)", scope: "*" },

  // Notifications
  { resource: "notification", action: "read", description: "View notifications", scope: "org" },
  { resource: "notification", action: "write", description: "Send/manage notifications", scope: "org" },
  { resource: "notification", action: "admin", description: "Configure notification templates", scope: "*" },

  // Health Module
  { resource: "health", action: "read", description: "View health records (diseases, vaccines, treatments, lab tests)", scope: "farm" },
  { resource: "health", action: "write", description: "Record health events (vaccinations, treatments, lab tests)", scope: "farm" },
  { resource: "health", action: "admin", description: "Manage disease/vaccine master data", scope: "*" },

  // Archive Module
  { resource: "archive", action: "read", description: "View archived documents", scope: "org" },
  { resource: "archive", action: "write", description: "Archive documents", scope: "org" },
  { resource: "archive", action: "destroy", description: "Mark documents as destroyed", scope: "*" },

  // Correction Module
  { resource: "correction", action: "read", description: "View correction cases", scope: "org" },
  { resource: "correction", action: "write", description: "Create correction cases", scope: "farm" },
  { resource: "correction", action: "resolve", description: "Review/resolve correction cases", scope: "org" },

  // Passport Module
  { resource: "passport", action: "read", description: "View cattle passports", scope: "org" },
  { resource: "passport", action: "create", description: "Issue new passports", scope: "org" },
  { resource: "passport", action: "admin", description: "Seize/reprint/cancel passports", scope: "*" },
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
    "hk:import",
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
  // 4. Seed Health Master Data
  // ═══════════════════════════════════════════════════════════════

  console.log("🌱 Seeding health master data...");

  const DISEASE_DEFS = [
    { name: "Anthrax", notifiable: true, description: "Bacillus anthracis — acute infectious disease in cattle" },
    { name: "Bovine Brucellosis", notifiable: true, description: "Brucella abortus — causes abortions, highly contagious" },
    { name: "Bovine Tuberculosis", notifiable: true, description: "Mycobacterium bovis — chronic respiratory disease, zoonotic" },
    { name: "Foot and Mouth Disease", notifiable: true, description: "Highly contagious viral vesicular disease (Aphtovirus)" },
    { name: "Rabies", notifiable: true, description: "Lyssavirus — fatal zoonotic neurological disease" },
    { name: "Bovine Spongiform Encephalopathy", notifiable: true, description: "Prion disease — fatal neurodegenerative (BSE)" },
    { name: "Lumpy Skin Disease", notifiable: true, description: "Capripoxvirus — nodular skin lesions, fever" },
    { name: "Bluetongue", notifiable: true, description: "Orbivirus — vector-borne disease in ruminants" },
    { name: "Bovine Viral Diarrhea", notifiable: true, description: "Pestivirus — BVD/MD, immunosuppressive" },
    { name: "Infectious Bovine Rhinotracheitis", notifiable: true, description: "BoHV-1 — IBR/IPV respiratory and reproductive disease" },
    { name: "Q Fever", notifiable: true, description: "Coxiella burnetii — zoonotic, causes abortions" },
    { name: "Salmonellosis", notifiable: true, description: "Salmonella enterica — enteric infection, zoonotic" },
    { name: "Mastitis", notifiable: false, description: "Bacterial udder infection — E. coli, Staph, Strep" },
    { name: "Bovine Respiratory Disease Complex", notifiable: false, description: "Multifactorial BRDC — shipping fever complex" },
    { name: "Coccidiosis", notifiable: false, description: "Eimeria spp. — protozoan enteritis in young calves" },
    { name: "Blackleg", notifiable: false, description: "Clostridium chauvoei — gas gangrene in muscle" },
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

  console.log("✅ Seed complete.");
}

try {
  await seed();
} catch (e) {
  console.error("❌ Seed failed:", e);
  throw e;
}
