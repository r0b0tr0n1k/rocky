// SPDX-License-Identifier: UNLICENSED
//
// Rocky permission catalog - SINGLE SOURCE OF TRUTH for permission identifiers.
//
// Every permission is a flat colon-string `${resource}:${action}` that matches a
// `PERMISSION_DEFS` entry in `packages/database/src/seed.ts` (upserted into the
// `permissions` table as `{ resource, action }`). The `@Policy({ action })`, web nav
// `permission:`, mobile `can(...)`, and seed `ROLE_PERM_MAP` strings MUST all be
// members of this catalog - enforced by `permissions.drift.test.ts` (WO-101).
//
// Adding a permission: add it to `PERMISSION_DEFS` in seed.ts AND here, grant it via
// `ROLE_PERM_MAP`, then reference it from `@Policy`/nav/mobile. The drift test fails
// on any mismatch (including a `ROLE_PERM_MAP` string with no matching def).

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
