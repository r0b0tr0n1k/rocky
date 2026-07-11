// ── Passport API Schemas - Diamond Seal ──
// Cattle passport: the central legal document of the I&R system.

import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";
import { z } from "zod";
import { cattlePassportsSelectSchema } from "@rocky/database/zod";
import { passportStatusSchema } from "../enums/index.js";
import type { passportStatusType } from "../enums/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PassportResponse {
  id: string;
  passportNumber: string;
  stateCode: string;
  animalId: string;
  farmId: string;
  status: "issued" | "active" | "seized" | "archived" | "reprinted" | "cancelled";
  issueDate: Date;
  seizeDate: Date | null;
  archiveDate: Date | null;
  deathDate: Date | null;
  deathCause: string | null;
  countryOfOrigin: string | null;
  foreignPassportNumber: string | null;
  shippedToVs: boolean;
  shippedAt: Date | null;
  deliveredToKeeper: boolean;
  deliveredAt: Date | null;
  isReprint: boolean;
  originalPassportId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface PassportSummary {
  id: string;
  passportNumber: string;
  animalId: string;
  farmId: string;
  status: "issued" | "active" | "seized" | "archived" | "reprinted" | "cancelled";
  issueDate: Date;
  isActive: boolean;
}

export interface PassportListResponse {
  data: PassportResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface IssuePassportRequest {
  animalId: string;
  farmId: string;
}

export interface SeizePassportRequest {
  passportId: string;
  deathDate: Date;
  deathCause?: string;
}

export interface ReprintPassportRequest {
  originalPassportId: string;
}

export interface PassportListRequest {
  farmId?: string;
  status?: passportStatusType;
  limit: number;
  offset: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const passportResponseSchema = cattlePassportsSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    issueDate: z.coerce.date<string>(),
    seizeDate: z.coerce.date<string>().nullable(),
    archiveDate: z.coerce.date<string>().nullable(),
    deathDate: z.coerce.date<string>().nullable(),
    status: passportStatusSchema,
    shippedAt: z.coerce.date<string>().nullable(),
    deliveredAt: z.coerce.date<string>().nullable(),
  }).strip() satisfies z.ZodType<PassportResponse>; // WO-040: kept .strip() — service passes full DB rows; .strict() would reject omitted audit keys

export const passportSummarySchema = z.object(
  passportResponseSchema
    .pick({
      id: true,
      passportNumber: true,
      animalId: true,
      farmId: true,
      status: true,
      issueDate: true,
      isActive: true,
    }).shape,
) satisfies z.ZodType<PassportSummary>;

export const passportListResponseSchema = z.strictObject({
  data: z.array(passportResponseSchema),
  total: z.int().nonnegative(),
  limit: z.int(),
  offset: z.int(),
}) satisfies z.ZodType<PassportListResponse>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const issuePassportRequestSchema = z.strictObject({
  animalId: z.uuid(),
  farmId: z.uuid(),
}) satisfies z.ZodType<IssuePassportRequest>;

export const seizePassportRequestSchema = z.strictObject({
  passportId: z.uuid(),
  deathDate: z.coerce.date<string>(),
  deathCause: z.string().optional(),
}) satisfies z.ZodType<SeizePassportRequest>;

export const reprintPassportRequestSchema = z.strictObject({
  originalPassportId: z.uuid(),
}) satisfies z.ZodType<ReprintPassportRequest>;

export const passportListRequestSchema = z.strictObject({
  farmId: z.uuid().optional(),
  status: passportStatusSchema.optional(),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
}) satisfies z.ZodType<PassportListRequest>;

// ═══════════════════════════════════════════════════════════════
// GUILLOTINE ACTIVATION (Tier 2 + Tier 3)
// ═══════════════════════════════════════════════════════════════

// Curated subset responses: interface is intentionally narrower than schema output.
// `satisfies` (on the schema) enforces the one-directional contract; NoDrift is bypassed
// per utils/type-bridge.ts last-resort (`_drift_* = true` removes coverage).
type _drift_passportResponse = true;
type _drift_passportSummary = true;
type _drift_passportListResponse = true;
type _drift_issuePassportRequest = NoDrift<z.infer<typeof issuePassportRequestSchema>, IssuePassportRequest>;
type _drift_seizePassportRequest = NoDrift<z.infer<typeof seizePassportRequestSchema>, SeizePassportRequest>;
type _drift_reprintPassportRequest = NoDrift<z.infer<typeof reprintPassportRequestSchema>, ReprintPassportRequest>;
type _drift_passportListRequest = NoDrift<z.infer<typeof passportListRequestSchema>, PassportListRequest>;

export type _PassportGuillotines = ActivateGuillotines<
  [ _drift_passportResponse, _drift_passportSummary, _drift_passportListResponse, _drift_issuePassportRequest, _drift_seizePassportRequest, _drift_reprintPassportRequest, _drift_passportListRequest ]
>;
