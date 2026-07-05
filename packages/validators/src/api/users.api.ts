// ── Users API Schemas - Diamond Seal ──
//
// The user is the agent of the System Management domain.
// With mobilePhone and deviceId for 2FA and device-change detection.
//
// Based on: SM.PDF

import { z } from "zod";
import { userSelectSchema, userInsertSchema } from "@rocky/database/zod";
import { userStatusSchema } from "../enums/domain.js";
import { sortByUserSchema, sortOrderSchema } from "../enums/domain.js";
import { STATE_CODE } from "@rocky/database/constants";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const userResponseSchema = userSelectSchema
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

export const userSummarySchema = z.strictObject({
    id: z.uuid(),
    username: z.string(),
    email: z.string().nullable(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    organizationId: z.uuid().nullable(),
    status: userStatusSchema,
    lastLoginAt: z.date().nullable(),
  });

export type UserSummary = z.infer<typeof userSummarySchema>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createUserRequestSchema = userInsertSchema
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
    language: z.string().length(2).default(STATE_CODE.MK),
    status: userStatusSchema.optional(),
    password: z.string().min(8).max(100),
  });

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export const updateUserRequestSchema = z.object({
  email: z.email().optional(),
  mobilePhone: z.string().max(30).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  language: z.string().length(2).optional(),
  geoUnlimited: z.boolean().optional(),
  status: userStatusSchema.optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export const userListRequestSchema = z.object({
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
