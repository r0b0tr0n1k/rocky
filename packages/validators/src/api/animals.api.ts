// ── Animals API Schemas - Diamond Seal ──
//
// This is the gate, Comrade. Every tRPC procedure that touches animals
// must pass through these schemas. They are the SOLE contract between
// the database (the Real) and the API consumer (the Big Other).
//
// Based on: FS - registration_MK(v0.91).pdf §Business rules

import { animalsInsertSchema, animalParentsSelectSchema, animalsSelectSchema } from "@rocky/database/zod";
import { z } from "zod";
import {
  animalStatusSchema,
  birthTypeSchema,
  sexSchema,
  sortAnimalBySchema,
  sortOrderSchema,
  stateCodeSchema,
} from "../enums/index.js";
import { earTagSchema } from "../utils/check-digit.js";
import type { ActivateGuillotines, NoDrift, NoDriftSimple } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS (Diamond Seal - what the API returns)
// ═══════════════════════════════════════════════════════════════════════════

/** Full animal record returned by GET /animals/:id */
export const animalResponseSchema = animalsSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    birthDate: z.coerce.date<string>(),
    taggingDate: z.coerce.date<string>().nullable(),
    importDate: z.coerce.date<string>().nullable(),
    status: animalStatusSchema,
    sex: sexSchema,
    birthType: birthTypeSchema.nullable(),
  }).strip(); // WO-040: kept .strip() — service passes full DB rows; .strict() would reject omitted audit keys

export type AnimalResponse = z.infer<typeof animalResponseSchema>;

/** Animal record embedded in list/parent responses (lighter than full response) */
export const animalSummarySchema = z.object({
  id: z.uuid(),
  stateCode: stateCodeSchema,
  earTagNumber: z.string().length(8),
  sex: sexSchema,
  breed: z.string().nullable(),
  status: animalStatusSchema,
  currentFarmId: z.uuid(),
  birthDate: z.coerce.date<string>(),
});

export type AnimalSummary = z.infer<typeof animalSummarySchema>;

/** Parent record embedded in lineage responses */
export const animalParentResponseSchema = animalParentsSelectSchema.strict();

export type AnimalParentResponse = z.infer<typeof animalParentResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// PAGINATION & LIST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const paginationSchema = z.strictObject({
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

export const animalListResponseSchema = z.strictObject({
  data: z.array(animalSummarySchema),
  total: z.int().nonnegative(),
  limit: z.int(),
  offset: z.int(),
});

export type AnimalListResponse = z.infer<typeof animalListResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS (what the API accepts)
// ═══════════════════════════════════════════════════════════════════════════

// ── Create Animal Request ──

export type CreateAnimalRequest = z.infer<typeof createAnimalRequestSchema>;

export const createAnimalRequestSchema = animalsInsertSchema
  .pick({
    stateCode: true,
    earTagNumber: true,
    birthDate: true,
    sex: true,
    breed: true,
    birthType: true,
    birthWeight: true,
    motherId: true,
    fatherId: true,
    currentFarmId: true,
    status: true,
    isFirstTagging: true,
    taggingDate: true,
    imported: true,
    importCountry: true,
    importDate: true,
    isActive: true,
  })
  .extend({
    earTagNumber: earTagSchema,
    sex: sexSchema,
    birthType: birthTypeSchema.optional(),
    status: animalStatusSchema.optional(),
  })
  .refine(
    (data: Record<string, unknown>) => {
      const bd = data.birthDate;
      if (bd) {
        const d = typeof bd === "string" ? new Date(bd) : bd;
        if (d instanceof Date && d > new Date()) return false;
      }
      return true;
    },
    { message: "Birth date cannot be in the future" },
  )
  .strict();

// ── Update Animal Request ──

export type UpdateAnimalRequest = z.infer<typeof updateAnimalRequestSchema>;

export const updateAnimalRequestSchema = z
  .strictObject({
    breed: z.string().max(50).optional(),
    birthType: birthTypeSchema.optional(),
    birthWeight: z.int().positive().optional(),
    status: animalStatusSchema.optional(),
    currentFarmId: z.uuid().optional(),
    motherId: z.uuid().optional(),
    taggingDate: z.coerce.date<string>().optional(),
    isFirstTagging: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field must be updated");

// ── Animal List Request ──

export type AnimalListRequest = z.infer<typeof animalListRequestSchema>;

export const animalListRequestSchema = z.strictObject({
  farmId: z.uuid().optional(),
  status: animalStatusSchema.optional(),
  sex: sexSchema.optional(),
  breed: z.string().optional(),
  search: z.string().optional(),
  sortBy: sortAnimalBySchema.default("createdAt"),
  sortOrder: sortOrderSchema.default("desc"),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

// ── Find Animal By Tag Request ──

export type FindAnimalByTagRequest = z.infer<typeof findAnimalByTagRequestSchema>;

export const findAnimalByTagRequestSchema = z.strictObject({
  earTag: earTagSchema,
  stateCode: stateCodeSchema,
});

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINE ACTIVATION
// ═══════════════════════════════════════════════════════════════════════════

type _drift_animalResponse = NoDrift<z.infer<typeof animalResponseSchema>, AnimalResponse>;
type _drift_animalSummary = NoDrift<z.infer<typeof animalSummarySchema>, AnimalSummary>;
type _drift_animalParentResponse = NoDrift<z.infer<typeof animalParentResponseSchema>, AnimalParentResponse>;
type _drift_animalListResponse = NoDrift<z.infer<typeof animalListResponseSchema>, AnimalListResponse>;
type _drift_createAnimal = NoDriftSimple<z.infer<typeof createAnimalRequestSchema>, CreateAnimalRequest>;
type _drift_updateAnimal = NoDrift<z.infer<typeof updateAnimalRequestSchema>, UpdateAnimalRequest>;
type _drift_animalList = NoDrift<z.infer<typeof animalListRequestSchema>, AnimalListRequest>;
type _drift_findByTag = NoDrift<z.infer<typeof findAnimalByTagRequestSchema>, FindAnimalByTagRequest>;

export type _AnimalGuillotines = ActivateGuillotines<
  [
    _drift_animalResponse,
    _drift_animalSummary,
    _drift_animalParentResponse,
    _drift_animalListResponse,
    _drift_createAnimal,
    _drift_updateAnimal,
    _drift_animalList,
    _drift_findByTag,
  ]
>;
