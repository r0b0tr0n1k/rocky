// ── Movements API Schemas - Diamond Seal ──
//
// Movement is the dialectical synthesis of the animal's journey, Comrade.
// Every movement changes the animal's position in the Symbolic order.
//
// Based on: FS - registration_MK(v0.91).pdf §Business rules (p12-15)

import { z } from "zod";
import { movementSelectSchema, movementInsertSchema } from "@rocky/database/zod";
import { movementTypeSchema } from "../enums/domain.js";
import { sortByMovementSchema, sortOrderSchema } from "../enums/domain.js";
import { earTagSchema, farmIdSchema } from "../utils/check-digit.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const movementResponseSchema = movementSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    movementDate: z.coerce.date(),
    arrivalDate: z.coerce.date().nullable(),
    deathDate: z.coerce.date().nullable(),
    type: movementTypeSchema,
  })
  .strict();

export type MovementResponse = z.infer<typeof movementResponseSchema>;

export const movementSummarySchema = z.strictObject(movementResponseSchema
  .pick({
    id: true,
    animalId: true,
    fromFarmId: true,
    toFarmId: true,
    type: true,
    movementDate: true,
    isActive: true,
  }).shape);

export type MovementSummary = z.infer<typeof movementSummarySchema>;

export const movementListResponseSchema = z.strictObject({
  data: z.array(movementResponseSchema),
  total: z.int().nonnegative(),
  limit: z.int(),
  offset: z.int(),
});

export type MovementListResponse = z.infer<typeof movementListResponseSchema>;

export const createMovementRequestSchema = movementInsertSchema
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
    movementDate: z.coerce.date(),
    arrivalDate: z.coerce.date().optional(),
    deathDate: z.coerce.date().optional().nullable(),
  })
  .strict();

export type CreateMovementRequest = z.infer<typeof createMovementRequestSchema>;

export const movementListRequestSchema = z.strictObject({
  animalId: z.uuid().optional(),
  fromFarmId: z.uuid().optional(),
  toFarmId: z.uuid().optional(),
  type: movementTypeSchema.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: sortByMovementSchema.default("movementDate"),
  sortOrder: sortOrderSchema.default("desc"),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

export type MovementListRequest = z.infer<typeof movementListRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// DEATH SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const recordDeathRequestSchema = z.strictObject({
  animalId: z.uuid(),
  farmId: z.uuid(),
  deathDate: z.string(),
  deathCause: z.string().min(1),
});

export type RecordDeathRequest = z.infer<typeof recordDeathRequestSchema>;

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
});

export type DeclarePastureRequest = z.infer<typeof declarePastureRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// SLAUGHTER SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const recordSlaughterRequestSchema = z.strictObject({
  animalId: z.uuid(),
  fromFarmId: z.uuid(),
  slaughterhouseId: z.uuid(),
  slaughterDate: z.string(),
  arrivalDate: z.string().optional(),
});

export type RecordSlaughterRequest = z.infer<typeof recordSlaughterRequestSchema>;

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
});

export type ImportEURequest = z.infer<typeof importEURequestSchema>;

export const importThirdCountryRequestSchema = z.strictObject({
  animalId: z.uuid(),
  fromFarmId: z.uuid(),
  toFarmId: z.uuid(),
  countryOfOrigin: z.string().length(2),
  newEarTagNumber: z.string().optional(),
  bipEntryDate: z.string().optional(),
});

export type ImportThirdCountryRequest = z.infer<typeof importThirdCountryRequestSchema>;

export const exportAnimalRequestSchema = z.strictObject({
  animalId: z.uuid(),
  fromFarmId: z.uuid(),
  toFarmId: z.uuid().optional(),
  destinationCountry: z.string().length(2),
  bipExitDate: z.string().optional(),
});

export type ExportAnimalRequest = z.infer<typeof exportAnimalRequestSchema>;

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
});

export type RecordMarketTransactionRequest = z.infer<typeof recordMarketTransactionRequestSchema>;

export const recordMarketUnsoldRequestSchema = z.strictObject({
  animalId: z.uuid(),
  buyerFarmId: z.uuid(),
  sellerFarmId: z.uuid(),
  marketFarmId: z.uuid(),
  movementDate: z.string(),
});

export type RecordMarketUnsoldRequest = z.infer<typeof recordMarketUnsoldRequestSchema>;

export const recordMarketSlaughterRequestSchema = z.strictObject({
  animalId: z.uuid(),
  sellerFarmId: z.uuid(),
  marketFarmId: z.uuid(),
  slaughterhouseId: z.uuid(),
  movementDate: z.string(),
});

export type RecordMarketSlaughterRequest = z.infer<typeof recordMarketSlaughterRequestSchema>;
