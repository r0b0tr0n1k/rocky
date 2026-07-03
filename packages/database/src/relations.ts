// ── Drizzle ORM Relational Queries v2 Configuration ──
// Centralized relations definition for all tables
// https://orm.drizzle.team/docs/relational-query-v2

import { defineRelations } from "drizzle-orm";
import * as sm from "./schema/sm/index.js";
import * as hk from "./schema/hk/index.js";
import * as an from "./schema/an/index.js";
import * as auth from "./schema/auth/index.js";
import * as demo from "./schema/demo/index.js";

export const relations = defineRelations({ ...sm, ...hk, ...an, ...auth, ...demo }, (r) => ({
  // ==================================================================
  // ANIMALS
  // ==================================================================

  animals: {
    currentFarm: r.one.farms({
      from: r.animals.currentFarmId,
      to: r.farms.id,
    }),
    mother: r.one.animals({
      from: r.animals.motherId,
      to: r.animals.id,
    }),
    movements: r.many.movements(),
  },

  // ==================================================================
  // MOVEMENTS
  // ==================================================================

  movements: {
    animal: r.one.animals({
      from: r.movements.animalId,
      to: r.animals.id,
    }),
    fromFarm: r.one.farms({
      from: r.movements.fromFarmId,
      to: r.farms.id,
    }),
    toFarm: r.one.farms({
      from: r.movements.toFarmId,
      to: r.farms.id,
    }),
    parentMovement: r.one.movements({
      from: r.movements.parentMovementId,
      to: r.movements.id,
    }),
    childMovements: r.many.movements(),
  },

  // ==================================================================
  // BIRTH NOTIFICATIONS
  // ==================================================================

  birthNotifications: {
    farm: r.one.farms({
      from: r.birthNotifications.farmId,
      to: r.farms.id,
    }),
    assignedTo: r.one.users({
      from: r.birthNotifications.assignedTo,
      to: r.users.id,
    }),
  },

  // ==================================================================
  // FARMS
  // ==================================================================

  farms: {
    address: r.one.addresses({
      from: r.farms.addressId,
      to: r.addresses.id,
    }),
    parentFarm: r.one.farms({
      from: r.farms.parentFarmId,
      to: r.farms.id,
    }),
    subjects: r.many.farmSubjects(),
    animals: r.many.animals(),
    movementsFromFarm: r.many.movements(),
    movementsToFarm: r.many.movements(),
    birthNotifications: r.many.birthNotifications(),
  },

  // ==================================================================
  // ADDRESSES
  // ==================================================================

  addresses: {
    zipCode: r.one.zipCodes({
      from: r.addresses.zipCodeId,
      to: r.zipCodes.id,
    }),
    commune: r.one.communes({
      from: r.addresses.communeId,
      to: r.communes.id,
    }),
    adminUnit: r.one.adminUnits({
      from: r.addresses.adminUnitId,
      to: r.adminUnits.id,
    }),
  },

  zipCodes: {
    state: r.one.states({
      from: r.zipCodes.stateId,
      to: r.states.id,
    }),
  },

  // ==================================================================
  // FARM SUBJECTS
  // ==================================================================

  farmSubjects: {
    farm: r.one.farms({
      from: r.farmSubjects.farmId,
      to: r.farms.id,
    }),
    subject: r.one.subjects({
      from: r.farmSubjects.subjectId,
      to: r.subjects.id,
    }),
  },

  // ==================================================================
  // ORGANIZATIONS
  // ==================================================================

  organizations: {
    parent: r.one.organizations({
      from: r.organizations.parentId,
      to: r.organizations.id,
    }),
    children: r.many.organizations(),
    users: r.many.users(),
  },

  // ==================================================================
  // RBAC
  // ==================================================================

  roles: {
    users: r.many.userRoles(),
    permissions: r.many.rolePermissions(),
  },

  userRoles: {
    user: r.one.users({
      from: r.userRoles.userId,
      to: r.users.id,
    }),
    role: r.one.roles({
      from: r.userRoles.roleId,
      to: r.roles.id,
    }),
  },

  permissions: {
    roles: r.many.rolePermissions(),
  },

  // ==================================================================
  // USERS
  // ==================================================================

  users: {
    organization: r.one.organizations({
      from: r.users.organizationId,
      to: r.organizations.id,
    }),
    roles: r.many.userRoles(),
    sessions: r.many.userSessions(),
    notifications: r.many.notifications(),
    notificationPreferences: r.many.notificationPreferences(),
  },

  userSessions: {
    user: r.one.users({
      from: r.userSessions.userId,
      to: r.users.id,
    }),
  },

  // ==================================================================
  // NOTIFICATIONS
  // ==================================================================

  notifications: {
    user: r.one.users({
      from: r.notifications.userId,
      to: r.users.id,
    }),
  },

  notificationPreferences: {
    user: r.one.users({
      from: r.notificationPreferences.userId,
      to: r.users.id,
    }),
  },

  // ==================================================================
  // EAR TAGS (valid relations only — columns that actually exist in pgTable)
  // ==================================================================

  earTagTypes: {
    tags: r.many.earTags(),
  },

  earTags: {
    type: r.one.earTagTypes({
      from: r.earTags.typeId,
      to: r.earTagTypes.id,
    }),
    order: r.one.earTagOrders({
      from: r.earTags.orderId,
      to: r.earTagOrders.id,
    }),
    allocation: r.one.earTagAllocations({
      from: r.earTags.allocationId,
      to: r.earTagAllocations.id,
    }),
    animal: r.one.animals({
      from: r.earTags.animalId,
      to: r.animals.id,
    }),
  },

  earTagOrders: {
    organization: r.one.organizations({
      from: r.earTagOrders.organizationId,
      to: r.organizations.id,
    }),
    requestedBy: r.one.users({
      from: r.earTagOrders.requestedBy,
      to: r.users.id,
    }),
    approvedBy: r.one.users({
      from: r.earTagOrders.approvedBy,
      to: r.users.id,
    }),
    tags: r.many.earTags(),
  },

  earTagAllocations: {
    farm: r.one.farms({
      from: r.earTagAllocations.farmId,
      to: r.farms.id,
    }),
    receivedBy: r.one.users({
      from: r.earTagAllocations.receivedBy,
      to: r.users.id,
    }),
    tags: r.many.earTags(),
  },

  earTagReplacements: {
    farm: r.one.farms({
      from: r.earTagReplacements.farmId,
      to: r.farms.id,
    }),
    reportedBy: r.one.users({
      from: r.earTagReplacements.reportedBy,
      to: r.users.id,
    }),
    approvedBy: r.one.users({
      from: r.earTagReplacements.approvedBy,
      to: r.users.id,
    }),
  },

  // ==================================================================
  // SUBJECTS
  // ==================================================================

  subjects: {
    farmSubjects: r.many.farmSubjects(),
  },

  // ==================================================================
  // ROLE PERMISSIONS
  // ==================================================================

  rolePermissions: {
    role: r.one.roles({
      from: r.rolePermissions.roleId,
      to: r.roles.id,
    }),
    permission: r.one.permissions({
      from: r.rolePermissions.permissionId,
      to: r.permissions.id,
    }),
  },

  // ==================================================================
  // AUTH (authentication system — better-auth .joins experimental)
  // ==================================================================

  user: {
    sessions: r.many.session(),
    accounts: r.many.account(),
  },

  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },

  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },

  verification: {},

  // ==================================================================
  // DEMO (demo tables)
  // ==================================================================

  // Add demo relations here if needed
  // Currently demo tables don't have relations defined
}));
