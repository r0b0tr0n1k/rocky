// ── RBAC API Schemas - Diamond Seal ──
//
// Roles and permissions are the Symbolic order of the system, Comrade.
// They determine what each user may see and do.
//
// Based on: SM.PDF

import { z } from "zod";
import { rolesSelectSchema, permissionsSelectSchema } from "@rocky/database/zod";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const roleResponseSchema = rolesSelectSchema.omit({ createdBy: true, validTo: true })  .strip();

export type RoleResponse = z.infer<typeof roleResponseSchema>;

export const permissionResponseSchema = permissionsSelectSchema.strict();

export type PermissionResponse = z.infer<typeof permissionResponseSchema>;

export const roleWithPermissionsResponseSchema = roleResponseSchema
  .extend({
    permissions: z.array(permissionResponseSchema),
  })
  .strip();

export type RoleWithPermissionsResponse = z.infer<typeof roleWithPermissionsResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const assignRoleToUserRequestSchema = z.strictObject({
  userId: z.uuid(),
  roleId: z.uuid(),
  scopeOrgId: z.uuid().optional(),
  scopeFarmId: z.uuid().optional(),
  validFrom: z.coerce.date<string>().optional(),
  validTo: z.coerce.date<string>().optional(),
});

export type AssignRoleToUserRequest = z.infer<typeof assignRoleToUserRequestSchema>;

export const revokeRoleFromUserRequestSchema = z.strictObject({
  userId: z.uuid(),
  roleId: z.uuid(),
});

export type RevokeRoleFromUserRequest = z.infer<typeof revokeRoleFromUserRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_roleResponse = NoDrift<z.infer<typeof roleResponseSchema>, RoleResponse>;
type _drift_permissionResponse = NoDrift<z.infer<typeof permissionResponseSchema>, PermissionResponse>;
type _drift_roleWithPermissionsResponse = NoDrift<z.infer<typeof roleWithPermissionsResponseSchema>, RoleWithPermissionsResponse>;
type _drift_assignRoleToUser = NoDrift<z.infer<typeof assignRoleToUserRequestSchema>, AssignRoleToUserRequest>;
type _drift_revokeRoleFromUser = NoDrift<z.infer<typeof revokeRoleFromUserRequestSchema>, RevokeRoleFromUserRequest>;

export type _RbacGuillotines = ActivateGuillotines<
  [_drift_roleResponse, _drift_permissionResponse, _drift_roleWithPermissionsResponse,
   _drift_assignRoleToUser, _drift_revokeRoleFromUser]
>;
