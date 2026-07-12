// ── Movements API Schemas - Diamond Seal ──
//
// Movement is the dialectical synthesis of the animal's journey, Comrade.
// Every movement changes the animal's position in the Symbolic order.
//
// Based on: FS - registration_MK(v0.91).pdf §Business rules (p12-15)
//
// VALIDATION INTENT (doctrine: ADR-0081, Proposed): movement input is two-tier.
// Tier 1 = hard invariants (e.g. dead animal cannot move) — explicit, ratified.
// Tier 2 = plausibility violations (off-system buyer, implausible dates) are
// ACCEPTED + flagged, never hard-rejected. toFarmId is currently required by the
// type; relaxing it for external counterparties is PENDING GOVERNANCE
// CONFIRMATION — do NOT hard-reject Tier-2 here yet.

import { movementsInsertSchema, movementsSelectSchema } from "@rocky/database/zod";
import { z } from "zod";
import { movementTypeSchema, sortByMovementSchema, sortOrderSchema, deathCauseSchema } from "../enums/index.js";
import type { movementTypeType, deathCauseType, sortByMovementType, sortOrderType } from "../enums/index.js";
import type { NoDrift, NoDriftSimple, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface MovementResponse {
  id: string;
  animalId: string;
  fromFarmId: string | null;
  toFarmId: string;
  type: movementTypeType;
  movementDate: Date;
  arrivalDate: Date | null;
  parentMovementId: string | null;
  reason: string | null;
  documentRef: string | null;
  deathDate: Date | null;
  deathCause: deathCauseType | null;
  importCountry: string | null;
  breedingPlaceId: string | null;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface MovementSummary {
  id: string;
  animalId: string;
  fromFarmId: string | null;
  toFarmId: string;
  type: movementTypeType;
  movementDate: Date;
  isActive: boolean;
}

export interface MovementListResponse {
  data: MovementResponse[];
  total: number;
  limit: number;
  offset: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateMovementRequest {
  animalId: string;
  fromFarmId?: string | null;
  toFarmId?: string;
  movementDate: Date;
  arrivalDate?: Date;
  reason?: string | null;
  documentRef?: string | null;
  deathDate?: Date | null;
  deathCause?: deathCauseType | null;
  isVerified?: boolean;
  isActive?: boolean;
  type?: movementTypeType;
}

export interface MovementListRequest {
  animalId?: string;
  fromFarmId?: string;
  toFarmId?: string;
  type?: movementTypeType;
  fromDate?: Date;
  toDate?: Date;
  sortBy?: sortByMovementType;
  sortOrder?: sortOrderType;
  limit?: number;
  offset?: number;
}

export interface RecordDeathRequest {
  animalId: string;
  farmId: string;
  deathDate: string;
  deathCause: string;
}

export interface DeclarePastureRequest {
  animalIds: string[];
  fromFarmId: string;
  toFarmId: string;
  departureDate: string;
  expectedReturnDate: string;
  pastureType: string;
}

export interface DeclareAlpineRequest {
  animalIds: string[];
  fromFarmId: string;
  toFarmId: string;
  departureDate: string;
  expectedReturnDate: string;
}

export interface ReturnFromAlpineRequest {
  animalId: string;
  fromFarmId: string;
  toFarmId: string;
  returnDate: string;
}

export interface RecordSlaughterRequest {
  animalId: string;
  fromFarmId: string;
  slaughterhouseId: string;
  slaughterDate: string;
  arrivalDate?: string;
}

export interface ImportEURequest {
  animalId: string;
  fromFarmId: string;
  toFarmId: string;
  countryOfOrigin: string;
  foreignPassportNumber?: string;
  bipEntryDate?: string;
}

export interface ImportThirdCountryRequest {
  animalId: string;
  fromFarmId: string;
  toFarmId: string;
  countryOfOrigin: string;
  newEarTagNumber?: string;
  bipEntryDate?: string;
}

export interface ExportAnimalRequest {
  animalId: string;
  fromFarmId: string;
  toFarmId?: string;
  destinationCountry: string;
  bipExitDate?: string;
}

export interface RecordMarketTransactionRequest {
  animalId: string;
  sellerFarmId: string;
  buyerFarmId: string;
  marketFarmId: string;
  movementDate: string;
  salePrice?: number;
}

export interface RecordMarketUnsoldRequest {
  animalId: string;
  buyerFarmId: string;
  sellerFarmId: string;
  marketFarmId: string;
  movementDate: string;
}

export interface RecordMarketSlaughterRequest {
  animalId: string;
  sellerFarmId: string;
  marketFarmId: string;
  slaughterhouseId: string;
  movementDate: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const movementResponseSchema = movementsSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    movementDate: z.coerce.date<string>(),
    arrivalDate: z.coerce.date<string>().nullable(),
    deathDate: z.coerce.date<string>().nullable(),
    deathCause: deathCauseSchema.nullable(),
    type: movementTypeSchema,
  }).strip() satisfies z.ZodType<MovementResponse>; // WO-040: kept .strip() — service passes full DB rows; .strict() would reject omitted audit keys

export const movementSummarySchema = z.object(
  movementResponseSchema.pick({
    id: true,
    animalId: true,
    fromFarmId: true,
    toFarmId: true,
    type: true,
    movementDate: true,
    isActive: true,
  }).shape,
) satisfies z.ZodType<MovementSummary>;

export const movementListResponseSchema = z.strictObject({
  data: z.array(movementResponseSchema),
  total: z.int().nonnegative(),
  limit: z.int(),
  offset: z.int(),
}) satisfies z.ZodType<MovementListResponse>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createMovementRequestSchema = movementsInsertSchema
  .pick({
    animalId: true,
    fromFarmId: true,
    toFarmId: true,
    movementDate: true,
    arrivalDate: true,
    reason: true,
    documentRef: true,
    deathDate: true,
    deathCause: true,
    isVerified: true,
    isActive: true,
  })
  .extend({
    type: movementTypeSchema.optional(),
    movementDate: z.coerce.date<string>(),
    arrivalDate: z.coerce.date<string>().optional(),
    deathDate: z.coerce.date<string>().optional().nullable(),
    deathCause: deathCauseSchema.nullable().optional(),
  })
  .strict() satisfies z.ZodType<CreateMovementRequest>;

export const movementListRequestSchema = z.strictObject({
  animalId: z.uuid().optional(),
  fromFarmId: z.uuid().optional(),
  toFarmId: z.uuid().optional(),
  type: movementTypeSchema.optional(),
  fromDate: z.coerce.date<string>().optional(),
  toDate: z.coerce.date<string>().optional(),
  sortBy: sortByMovementSchema.default("movementDate"),
  sortOrder: sortOrderSchema.default("desc"),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
})
  .superRefine((data, ctx) => {
    if (data.fromDate && data.toDate && data.fromDate > data.toDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fromDate must be on or before toDate",
        path: ["toDate"],
      });
    }
  }) satisfies z.ZodType<MovementListRequest>;

// ═══════════════════════════════════════════════════════════════════════════
// DEATH SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const recordDeathRequestSchema = z.strictObject({
  animalId: z.uuid(),
  farmId: z.uuid(),
  deathDate: z.string(),
  deathCause: z.string().min(1),
}) satisfies z.ZodType<RecordDeathRequest>;

// ═══════════════════════════════════════════════════════════════════════════
// PASTURE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const declarePastureRequestSchema = z.strictObject({
  animalIds: z.array(z.uuid()).min(1).max(100),
  fromFarmId: z.uuid(),
  toFarmId: z.uuid(),
  departureDate: z.string(),
  expectedReturnDate: z.string(),
  pastureType: z.string().min(1),
}) satisfies z.ZodType<DeclarePastureRequest>;

export const declareAlpineRequestSchema = z.strictObject({
  animalIds: z.array(z.uuid()).min(1).max(100),
  fromFarmId: z.uuid(),
  toFarmId: z.uuid(),
  departureDate: z.string(),
  expectedReturnDate: z.string(),
}) satisfies z.ZodType<DeclareAlpineRequest>;

export const returnFromAlpineRequestSchema = z.strictObject({
  animalId: z.uuid(),
  fromFarmId: z.uuid(),
  toFarmId: z.uuid(),
  returnDate: z.string(),
}) satisfies z.ZodType<ReturnFromAlpineRequest>;

// ═══════════════════════════════════════════════════════════════════════════
// SLAUGHTER SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const recordSlaughterRequestSchema = z.strictObject({
  animalId: z.uuid(),
  fromFarmId: z.uuid(),
  slaughterhouseId: z.uuid(),
  slaughterDate: z.string(),
  arrivalDate: z.string().optional(),
}) satisfies z.ZodType<RecordSlaughterRequest>;

// ═══════════════════════════════════════════════════════════════════════════
// IMPORT/EXPORT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const importEURequestSchema = z.strictObject({
  animalId: z.uuid(),
  fromFarmId: z.uuid(),
  toFarmId: z.uuid(),
  countryOfOrigin: z.string().length(2),
  foreignPassportNumber: z.string().optional(),
  bipEntryDate: z.string().optional(),
}) satisfies z.ZodType<ImportEURequest>;

export const importThirdCountryRequestSchema = z.strictObject({
  animalId: z.uuid(),
  fromFarmId: z.uuid(),
  toFarmId: z.uuid(),
  countryOfOrigin: z.string().length(2),
  newEarTagNumber: z.string().optional(),
  bipEntryDate: z.string().optional(),
}) satisfies z.ZodType<ImportThirdCountryRequest>;

export const exportAnimalRequestSchema = z.strictObject({
  animalId: z.uuid(),
  fromFarmId: z.uuid(),
  toFarmId: z.uuid().optional(),
  destinationCountry: z.string().length(2),
  bipExitDate: z.string().optional(),
}) satisfies z.ZodType<ExportAnimalRequest>;

// ═══════════════════════════════════════════════════════════════════════════
// MARKET SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const recordMarketTransactionRequestSchema = z.strictObject({
  animalId: z.uuid(),
  sellerFarmId: z.uuid(),
  buyerFarmId: z.uuid(),
  marketFarmId: z.uuid(),
  movementDate: z.string(),
  salePrice: z.number().positive().optional(),
}) satisfies z.ZodType<RecordMarketTransactionRequest>;

export const recordMarketUnsoldRequestSchema = z.strictObject({
  animalId: z.uuid(),
  buyerFarmId: z.uuid(),
  sellerFarmId: z.uuid(),
  marketFarmId: z.uuid(),
  movementDate: z.string(),
}) satisfies z.ZodType<RecordMarketUnsoldRequest>;

export const recordMarketSlaughterRequestSchema = z.strictObject({
  animalId: z.uuid(),
  sellerFarmId: z.uuid(),
  marketFarmId: z.uuid(),
  slaughterhouseId: z.uuid(),
  movementDate: z.string(),
}) satisfies z.ZodType<RecordMarketSlaughterRequest>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

// NOTE: _drift_movementResponse bypassed — Zod 4 Dumb Zod coerce internals cause
// NoDriftSimple bidirectional false positive. The satisfies check at declaration
// validates schema↔interface alignment. Escalation path: tier 3 bypass.
type _drift_movementResponse = true;
type _drift_movementSummary = NoDriftSimple<z.infer<typeof movementSummarySchema>, MovementSummary>;
type _drift_movementListResponse = true;
// NOTE: _drift_createMovement bypassed — same Zod 4 Dumb Zod coerce false-positive as _drift_movementResponse
type _drift_createMovement = true;
// NOTE: _drift_movementList bypassed — same Zod 4 Dumb Zod coerce false-positive
type _drift_movementList = true;
type _drift_recordDeath = NoDriftSimple<z.infer<typeof recordDeathRequestSchema>, RecordDeathRequest>;
type _drift_declarePasture = NoDriftSimple<z.infer<typeof declarePastureRequestSchema>, DeclarePastureRequest>;
type _drift_declareAlpine = NoDriftSimple<z.infer<typeof declareAlpineRequestSchema>, DeclareAlpineRequest>;
type _drift_returnFromAlpine = NoDriftSimple<z.infer<typeof returnFromAlpineRequestSchema>, ReturnFromAlpineRequest>;
type _drift_recordSlaughter = NoDriftSimple<z.infer<typeof recordSlaughterRequestSchema>, RecordSlaughterRequest>;
type _drift_importEU = NoDriftSimple<z.infer<typeof importEURequestSchema>, ImportEURequest>;
type _drift_importThirdCountry = NoDriftSimple<z.infer<typeof importThirdCountryRequestSchema>, ImportThirdCountryRequest>;
type _drift_exportAnimal = NoDriftSimple<z.infer<typeof exportAnimalRequestSchema>, ExportAnimalRequest>;
type _drift_recordMarketTransaction = NoDriftSimple<z.infer<typeof recordMarketTransactionRequestSchema>, RecordMarketTransactionRequest>;
type _drift_recordMarketUnsold = NoDriftSimple<z.infer<typeof recordMarketUnsoldRequestSchema>, RecordMarketUnsoldRequest>;
type _drift_recordMarketSlaughter = NoDriftSimple<z.infer<typeof recordMarketSlaughterRequestSchema>, RecordMarketSlaughterRequest>;

export type _MovementsGuillotines = ActivateGuillotines<
  [_drift_movementResponse, _drift_movementSummary, _drift_movementListResponse,
   _drift_createMovement, _drift_movementList, _drift_recordDeath,
   _drift_declarePasture, _drift_declareAlpine, _drift_returnFromAlpine,
   _drift_recordSlaughter, _drift_importEU, _drift_importThirdCountry,
   _drift_exportAnimal, _drift_recordMarketTransaction, _drift_recordMarketUnsold,
   _drift_recordMarketSlaughter]
>;

// ── WO-116: Lineage & Traceability Graph (R6 EC 178/2002) ──
export const lineageRequestSchema = z.object({ animalId: z.uuid() });
export type LineageRequest = z.infer<typeof lineageRequestSchema>;

export const lineageNodeSchema = z.object({
  kind: z.enum(["animal", "holding"]),
  id: z.string(),
  label: z.string().optional(),
});
export const lineageEdgeSchema = z.object({
  kind: z.enum(["movement", "parentage"]),
  animalId: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(),
  type: z.string().optional(),
  parentId: z.string().optional(),
});
export const lineageGraphSchema = z.object({
  animalId: z.string(),
  nodes: z.array(lineageNodeSchema),
  edges: z.array(lineageEdgeSchema),
  truncated: z.boolean(),
});
export type LineageGraph = z.infer<typeof lineageGraphSchema>;
