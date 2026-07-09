// ── Users API Schemas - Diamond Seal ──
//
// The user is the agent of the System Management domain.
// With mobilePhone and deviceId for 2FA and device-change detection.
//
// Based on: SM.PDF

import { usersInsertSchema, usersSelectSchema } from "@rocky/database/zod";
import { z } from "zod";
import { languageSchema, sortByUserSchema, sortOrderSchema, userStatusSchema } from "../enums/index.js";
import type { NoDrift, NoDriftSimple, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const userResponseSchema = usersSelectSchema
  // @deprecated: passwordHash, mfaSecret, role columns are legacy
  .omit({
    passwordHash: true,
    mfaSecret: true,
    createdBy: true,
    validTo: true,
    role: true,
  })
  .extend({ status: userStatusSchema })
  .strict();

export type UserResponse = z.infer<typeof userResponseSchema>;

export const userSummarySchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  organizationId: z.uuid().nullable(),
  status: userStatusSchema,
  lastLoginAt: z.coerce.date<string>().nullable(),
});

export type UserSummary = z.infer<typeof userSummarySchema>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createUserRequestSchema = usersInsertSchema
  .omit({
    id: true,
    passwordHash: true,
    mfaSecret: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    validTo: true,
  })
  .extend({
    username: z.string().min(3).max(50),
    email: z.email().optional(),
    mobilePhone: z.string().max(30).optional(),
    language: languageSchema.nullable().optional().transform((v) => (v ?? "MK") as z.infer<typeof languageSchema>),
    status: userStatusSchema.optional(),
    password: z.string().min(8).max(100),
  }).strict();

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export const updateUserRequestSchema = z.strictObject({
  email: z.email().optional(),
  mobilePhone: z.string().max(30).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  language: languageSchema.optional(),
  geoUnlimited: z.boolean().optional(),
  status: userStatusSchema.optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export const userListRequestSchema = z.strictObject({
  organizationId: z.uuid().optional(),
  status: userStatusSchema.optional(),
  search: z.string().optional(),
  sortBy: sortByUserSchema.default("createdAt"),
  sortOrder: sortOrderSchema.default("desc"),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

export type UserListRequest = z.infer<typeof userListRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_userResponse = NoDrift<z.infer<typeof userResponseSchema>, UserResponse>;
type _drift_userSummary = NoDrift<z.infer<typeof userSummarySchema>, UserSummary>;
type _drift_createUser = NoDriftSimple<z.infer<typeof createUserRequestSchema>, CreateUserRequest>;
type _drift_updateUser = NoDrift<z.infer<typeof updateUserRequestSchema>, UpdateUserRequest>;
type _drift_userList = NoDriftSimple<z.infer<typeof userListRequestSchema>, UserListRequest>;

export type _UserGuillotines = ActivateGuillotines<
  [_drift_userResponse, _drift_userSummary, _drift_createUser,
   _drift_updateUser, _drift_userList]
>;
