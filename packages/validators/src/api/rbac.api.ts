// ── RBAC API Schemas — Diamond Seal ──
//
// Roles and permissions are the Symbolic order of the system, Comrade.
// They determine what each user may see and do.
//
// Based on: SM.PDF

import { z } from "zod";
import { roleSelectSchema, permissionSelectSchema } from "@rocky/database/zod";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const roleResponseSchema = roleSelectSchema
  .omit({ createdBy: true, validTo: true })
  .strict();

export type RoleResponse = z.infer<typeof roleResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const assignRoleToUserRequestSchema = z.object({
  userId: z.uuid(),
  roleId: z.uuid(),
  scopeOrgId: z.uuid().optional(),
  scopeFarmId: z.uuid().optional(),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
});

export type AssignRoleToUserRequest = z.infer<typeof assignRoleToUserRequestSchema>;

export const revokeRoleFromUserRequestSchema = z.object({
  userId: z.uuid(),
  roleId: z.uuid(),
});

export type RevokeRoleFromUserRequest = z.infer<typeof revokeRoleFromUserRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

