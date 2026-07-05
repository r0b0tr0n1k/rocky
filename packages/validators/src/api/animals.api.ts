// ── Animals API Schemas — Diamond Seal ──
//
// This is the gate, Comrade. Every tRPC procedure that touches animals
// must pass through these schemas. They are the SOLE contract between
// the database (the Real) and the API consumer (the Big Other).
//
// Based on: FS - registration_MK(v0.91).pdf §Business rules

import { z } from "zod";
import { animalSelectSchema, animalInsertSchema, animalParentSelectSchema } from "@rocky/database/zod";
import { animalStatusSchema, birthTypeSchema, sexSchema } from "../enums/domain.js";
import { sortAnimalBySchema, sortOrderSchema, stateCodeSchema } from "../enums/domain.js";
import { earTagSchema } from "../utils/check-digit.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS (Diamond Seal — what the API returns)
// ═══════════════════════════════════════════════════════════════════════════

/** Full animal record returned by GET /animals/:id */
export const animalResponseSchema = animalSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    birthDate: z.coerce.date(),
    taggingDate: z.coerce.date().nullable(),
    importDate: z.coerce.date().nullable(),
    status: animalStatusSchema,
    sex: sexSchema,
    birthType: birthTypeSchema.nullable(),
  })
  .strict();

export type AnimalResponse = z.infer<typeof animalResponseSchema>;

/** Animal record embedded in list/parent responses (lighter than full response) */
export const animalSummarySchema = z.strictObject({
  id: z.uuid(),
  stateCode: z.string().length(3),
  earTagNumber: z.string().length(8),
  sex: sexSchema,
  breed: z.string().nullable(),
  status: animalStatusSchema,
  currentFarmId: z.uuid(),
  birthDate: z.date(),
});

export type AnimalSummary = z.infer<typeof animalSummarySchema>;

/** Parent record embedded in lineage responses */
export const animalParentResponseSchema = animalParentSelectSchema.strict();

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

export const createAnimalRequestSchema = animalInsertSchema
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    validTo: true,
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
  );

// ── Update Animal Request ──

export type UpdateAnimalRequest = z.infer<typeof updateAnimalRequestSchema>;

export const updateAnimalRequestSchema = z
  .object({
    breed: z.string().max(50).optional(),
    birthType: birthTypeSchema.optional(),
    birthWeight: z.int().positive().optional(),
    status: animalStatusSchema.optional(),
    currentFarmId: z.uuid().optional(),
    taggingDate: z.date().optional(),
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
