// ── Correction API Schemas - Diamond Seal ──

import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";
import { z } from "zod";
import { errorCorrectionsSelectSchema } from "@rocky/database/zod";
import { correctionStatusSchema, correctionCaseTypeSchema, detectionSourceSchema } from "../enums/index.js";
import type { detectionSourceType, correctionCaseTypeType, correctionStatusType } from "../enums/index.js";

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
  updatedAt: Date | null;
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

export const correctionResponseSchema = errorCorrectionsSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    detectionSource: detectionSourceSchema,
    status: correctionStatusSchema,
    caseType: correctionCaseTypeSchema.nullable(),
    resolvedAt: z.coerce.date<string>().nullable(),
    escalatedAt: z.coerce.date<string>().nullable(),
    assignedAt: z.coerce.date<string>().nullable(),
  }).strip() satisfies z.ZodType<CorrectionResponse>; // WO-040: kept .strip() — service passes full DB rows; .strict() would reject omitted audit keys

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

// ═══════════════════════════════════════════════════════════════
// GUILLOTINE ACTIVATION (Tier 2 + Tier 3)
// ═══════════════════════════════════════════════════════════════

// Curated subset responses: interface is intentionally narrower than schema output.
// `satisfies` (on the schema) enforces the one-directional contract; NoDrift is bypassed
// per utils/type-bridge.ts last-resort (`_drift_* = true` removes coverage).
type _drift_correctionResponse = true;
type _drift_correctionListResponse = true;
type _drift_createCorrectionRequest = NoDrift<z.infer<typeof createCorrectionRequestSchema>, CreateCorrectionRequest>;
type _drift_reviewCorrectionRequest = NoDrift<z.infer<typeof reviewCorrectionRequestSchema>, ReviewCorrectionRequest>;
type _drift_resolveCorrectionRequest = NoDrift<z.infer<typeof resolveCorrectionRequestSchema>, ResolveCorrectionRequest>;
type _drift_escalateCorrectionRequest = NoDrift<z.infer<typeof escalateCorrectionRequestSchema>, EscalateCorrectionRequest>;
type _drift_correctionListRequest = NoDrift<z.infer<typeof correctionListRequestSchema>, CorrectionListRequest>;

export type _CorrectionGuillotines = ActivateGuillotines<
  [ _drift_correctionResponse, _drift_correctionListResponse, _drift_createCorrectionRequest, _drift_reviewCorrectionRequest, _drift_resolveCorrectionRequest, _drift_escalateCorrectionRequest, _drift_correctionListRequest ]
>;
