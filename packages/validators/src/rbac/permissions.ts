// ═══════════════════════════════════════════════════════════════════════════
// Typed Permission Catalog — Diamond Seal (ISOMORPHIC SINGLE SOURCE)
//
// This is the ONE client-safe definition of the `Permission` type. It is
// isomorphic (no server-only deps) so both the mobile PDA app and the web
// admin import it:
//   import { Permissions, type Permission } from "@rocky/validators/rbac";
//
// `@rocky/authorization` RE-EXPORTS these exact symbols (see
// `packages/authorization/src/permissions.ts`), so the server-side `@Policy`
// system and the client `clientCan`/`useCan` gates share a single definition.
// ADR-0050 (D1) mandates that single source; the isomorphic boundary (RN
// cannot bundle `@rocky/authorization`'s server deps) is why it lives here.
//
// ULTIMATE SOURCE OF TRUTH: `PERMISSION_DEFS` in
// `packages/database/src/seed.ts`. The seed's `ROLE_PERM_MAP` keys confirm the
// canonical code format `${resource}:${action}` (e.g. "animal:register").
// WO-101's drift test fails on any mismatch between the seed and this catalog
// (via the authorization re-export).
//
// Adding a permission: add it to `PERMISSION_DEFS` in seed.ts AND here, grant
// it via `ROLE_PERM_MAP`, then reference it from `@Policy`/nav/mobile.
// ═══════════════════════════════════════════════════════════════════════════

export const Permissions = {
  // analysis
  AnalysisRead: "analysis:read",
  AnalysisRun: "analysis:run",
  // animal
  AnimalDeath: "animal:death",
  AnimalRead: "animal:read",
  AnimalRegister: "animal:register",
  AnimalWrite: "animal:write",
  // archive
  ArchiveDestroy: "archive:destroy",
  ArchiveRead: "archive:read",
  ArchiveWrite: "archive:write",
  // birth_notification
  BirthNotificationRead: "birth_notification:read",
  BirthNotificationWrite: "birth_notification:write",
  // correction
  CorrectionRead: "correction:read",
  CorrectionResolve: "correction:resolve",
  CorrectionWrite: "correction:write",
  // device
  DeviceAdmin: "device:admin",
  DeviceRead: "device:read",
  DeviceWrite: "device:write",
  // eartag
  EartagAllocate: "eartag:allocate",
  EartagCollectOrders: "eartag:collect_orders",
  EartagConfirmDelivery: "eartag:confirm_delivery",
  EartagGenerate: "eartag:generate",
  EartagOrder: "eartag:order",
  EartagOrderCancel: "eartag:order:cancel",
  EartagOrderCancelAny: "eartag:order:cancel:any",
  EartagOrderViewAll: "eartag:order:view_all",
  EartagRead: "eartag:read",
  EartagSupply: "eartag:supply",
  // health
  HealthAdmin: "health:admin",
  HealthRead: "health:read",
  HealthWrite: "health:write",
  // hk:address
  HkAddressRead: "hk:address:read",
  HkAddressWrite: "hk:address:write",
  // hk:binding
  HkBindingRead: "hk:binding:read",
  HkBindingWrite: "hk:binding:write",
  // hk:farm
  HkFarmRead: "hk:farm:read",
  HkFarmWrite: "hk:farm:write",
  // hk:import
  HkImportAdmin: "hk:import:admin",
  // hk:subject
  HkSubjectRead: "hk:subject:read",
  HkSubjectWrite: "hk:subject:write",
  // movement
  MovementExport: "movement:export",
  MovementImport: "movement:import",
  MovementPasture: "movement:pasture",
  MovementRead: "movement:read",
  MovementWrite: "movement:write",
  // notification
  NotificationAdmin: "notification:admin",
  NotificationRead: "notification:read",
  NotificationWrite: "notification:write",
  // passport
  PassportAdmin: "passport:admin",
  PassportCreate: "passport:create",
  PassportRead: "passport:read",
  // pasture
  PastureDeclare: "pasture:declare",
  PastureRead: "pasture:read",
  // pda
  PdaImport: "pda:import",
  PdaSync: "pda:sync",
  // report
  ReportGenerate: "report:generate",
  ReportRead: "report:read",
  // slaughter
  SlaughterRead: "slaughter:read",
  SlaughterRegister: "slaughter:register",
  // sm:audit
  SmAuditRead: "sm:audit:read",
  // sm:modules
  SmModulesRead: "sm:modules:read",
  SmModulesWrite: "sm:modules:write",
  // sm:orgs
  SmOrgsRead: "sm:orgs:read",
  SmOrgsWrite: "sm:orgs:write",
  // sm:roles
  SmRolesRead: "sm:roles:read",
  SmRolesWrite: "sm:roles:write",
  // sm:sysparams
  SmSysparamsRead: "sm:sysparams:read",
  SmSysparamsWrite: "sm:sysparams:write",
  // sm:users
  SmUsersRead: "sm:users:read",
  SmUsersWrite: "sm:users:write",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const ALL_PERMISSIONS = Object.values(Permissions) as Permission[];

export function isPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as readonly string[]).includes(value);
}

export function formatPermission(resource: string, action: string): string {
  return `${resource}:${action}`;
}
