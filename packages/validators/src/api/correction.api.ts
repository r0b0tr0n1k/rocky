// ── Correction API Schemas - Diamond Seal ──

import { z } from "zod";
import { errorCorrectionSelectSchema } from "@rocky/database/zod";
import { correctionStatusSchema, correctionCaseTypeSchema, detectionSourceSchema } from "../enums/domain.js";
import type { detectionSourceType, correctionCaseTypeType, correctionStatusType } from "../enums/domain.js";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface CorrectionResponse {
  id: string;
  detectionSource: detectionSourceType;
  farmId: string | null;
  animalId: string | null;
  errorType: string;
  errorDescription: string;
  originalData: unknown;
  correctedData: unknown;
  status: correctionStatusType;
  caseType: correctionCaseTypeType | null;
  resolutionNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  archiveNumber: string | null;
  passportReprintRequired: boolean;
  passportId: string | null;
  escalatedTo: string | null;
  escalatedAt: Date | null;
  escalationReason: string | null;
  assignedToVs: string | null;
  assignedAt: Date | null;
  vsResolutionAttempted: boolean;
  techCode: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface CorrectionListResponse {
  data: CorrectionResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateCorrectionRequest {
  detectionSource: detectionSourceType;
  farmId?: string;
  animalId?: string;
  errorType: string;
  errorDescription: string;
  originalData?: unknown;
  correctedData?: unknown;
  caseType?: correctionCaseTypeType | undefined;
}

export interface ReviewCorrectionRequest {
  id: string;
}

export interface ResolveCorrectionRequest {
  id: string;
  resolutionNotes?: string;
}

export interface EscalateCorrectionRequest {
  id: string;
  escalatedTo: string;
  reason?: string;
}

export interface CorrectionListRequest {
  farmId?: string;
  animalId?: string;
  status?: correctionStatusType;
  detectionSource?: detectionSourceType;
  limit: number;
  offset: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const correctionResponseSchema = errorCorrectionSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    detectionSource: detectionSourceSchema,
    status: correctionStatusSchema,
    caseType: correctionCaseTypeSchema.nullable(),
    resolvedAt: z.coerce.date().nullable(),
    escalatedAt: z.coerce.date().nullable(),
    assignedAt: z.coerce.date().nullable(),
  })
  .strict() satisfies z.ZodType<CorrectionResponse>;

export const correctionListResponseSchema = z.strictObject({
  data: z.array(correctionResponseSchema),
  total: z.int().nonnegative(),
  limit: z.int(),
  offset: z.int(),
}) satisfies z.ZodType<CorrectionListResponse>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createCorrectionRequestSchema = z.strictObject({
  detectionSource: detectionSourceSchema,
  farmId: z.uuid().optional(),
  animalId: z.uuid().optional(),
  errorType: z.string().min(1).max(100),
  errorDescription: z.string().min(1).max(1000),
  originalData: z.unknown().optional(),
  correctedData: z.unknown().optional(),
  caseType: correctionCaseTypeSchema.optional(),
}) satisfies z.ZodType<CreateCorrectionRequest>;

export const reviewCorrectionRequestSchema = z.strictObject({
  id: z.uuid(),
}) satisfies z.ZodType<ReviewCorrectionRequest>;

export const resolveCorrectionRequestSchema = z.strictObject({
  id: z.uuid(),
  resolutionNotes: z.string().max(1000).optional(),
}) satisfies z.ZodType<ResolveCorrectionRequest>;

export const escalateCorrectionRequestSchema = z.strictObject({
  id: z.uuid(),
  escalatedTo: z.uuid(),
  reason: z.string().max(1000).optional(),
}) satisfies z.ZodType<EscalateCorrectionRequest>;

export const correctionListRequestSchema = z.strictObject({
  farmId: z.uuid().optional(),
  animalId: z.uuid().optional(),
  status: correctionStatusSchema.optional(),
  detectionSource: detectionSourceSchema.optional(),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
}) satisfies z.ZodType<CorrectionListRequest>;
