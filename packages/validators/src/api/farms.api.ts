// ── Farms API Schemas — Diamond Seal ──
//
// The farm is the fundamental unit of the I&R system, Comrade.
// Without a farm, an animal is a floating signifier with no anchor in the material world.
//
// Based on: FS - HK_MK(v1.0).pdf, HK.PDF

import { z } from "zod";
import { farmSelectSchema, farmInsertSchema, addressSelectSchema } from "@rocky/database/zod";
import { verificationStatusSchema, farmTypeSchema, dataSourceSchema, sortByFarmSchema, sortOrderSchema } from "../enums/domain.js";
import { farmIdSchema } from "../utils/check-digit.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const farmResponseSchema = farmSelectSchema
  .omit({ createdBy: true, updatedBy: true, validTo: true })
  .extend({
    location: z.unknown().nullable(),
    signatureCapturedAt: z.coerce.date().nullable(),
    verifiedAt: z.coerce.date().nullable(),
    type: farmTypeSchema,
    verificationStatus: verificationStatusSchema,
    dataSource: dataSourceSchema,
  })
  .strict();

export type FarmResponse = z.infer<typeof farmResponseSchema>;

export const farmSummarySchema = z.strictObject(farmResponseSchema
  .pick({
    id: true,
    farmId: true,
    name: true,
    type: true,
    verificationStatus: true,
    isActive: true,
    createdAt: true,
  }).shape);

export type FarmSummary = z.infer<typeof farmSummarySchema>;

export const addressResponseSchema = addressSelectSchema
  .omit({ legacyId: true, createdBy: true, validTo: true })
  .extend({
    location: z.string().nullable(),
    geocodedAddress: z.string().nullable(),
    geocodedAt: z.coerce.date().nullable(),
  })
  .strict();

export type AddressResponse = z.infer<typeof addressResponseSchema>;

export const farmListResponseSchema = z.strictObject({
  data: z.array(farmResponseSchema),
  total: z.int().nonnegative(),
  limit: z.int(),
  offset: z.int(),
});

export type FarmListResponse = z.infer<typeof farmListResponseSchema>;

export const createFarmRequestSchema = farmInsertSchema
  .pick({
    farmId: true,
    addressId: true,
    name: true,
    type: true,
    parentFarmId: true,
    dataSource: true,
    isActive: true,
  })
  .extend({
    farmId: farmIdSchema,
    type: farmTypeSchema,
    dataSource: dataSourceSchema,
    verificationStatus: verificationStatusSchema.optional(),
  })
  .strict();

export type CreateFarmRequest = z.infer<typeof createFarmRequestSchema>;

export interface UpdateFarmRequest {
  name?: string;
  type?: string;
  addressId?: string;
  parentFarmId?: string;
  verificationStatus?: string;
  verificationNote?: string;
  dataSource?: string;
}

export const updateFarmRequestSchema = z.strictObject({
  name: z.string().max(50).optional(),
  type: farmTypeSchema.optional(),
  addressId: z.uuid().optional(),
  parentFarmId: z.uuid().optional(),
  verificationStatus: verificationStatusSchema.optional(),
  verificationNote: z.string().optional(),
  dataSource: dataSourceSchema.optional(),
}).refine((data) => Object.keys(data).length > 0, "At least one field must be updated") satisfies z.ZodType<UpdateFarmRequest>;

export const farmListRequestSchema = z.strictObject({
  type: farmTypeSchema.optional(),
  verificationStatus: verificationStatusSchema.optional(),
  search: z.string().optional(),
  sortBy: sortByFarmSchema.default("createdAt"),
  sortOrder: sortOrderSchema.default("desc"),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

export type FarmListRequest = z.infer<typeof farmListRequestSchema>;
