// ── Passport API Schemas - Diamond Seal ──
// Cattle passport: the central legal document of the I&R system.

import { z } from "zod";
import { cattlePassportSelectSchema } from "@rocky/database/zod";
import { passportStatusSchema } from "../enums/domain.js";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PassportResponse {
  id: string;
  passportNumber: string;
  stateCode: string;
  animalId: string;
  farmId: string;
  status: "issued" | "active" | "seized" | "archived";
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
}

export interface PassportSummary {
  id: string;
  passportNumber: string;
  animalId: string;
  farmId: string;
  status: "issued" | "active" | "seized" | "archived";
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
  status?: string;
  limit: number;
  offset: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const passportResponseSchema = cattlePassportSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    issueDate: z.coerce.date(),
    seizeDate: z.coerce.date().nullable(),
    archiveDate: z.coerce.date().nullable(),
    deathDate: z.coerce.date().nullable(),
    status: passportStatusSchema,
    shippedAt: z.coerce.date().nullable(),
    deliveredAt: z.coerce.date().nullable(),
  })
  .strict() satisfies z.ZodType<PassportResponse>;

export const passportSummarySchema = z.strictObject(
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
  deathDate: z.coerce.date(),
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
