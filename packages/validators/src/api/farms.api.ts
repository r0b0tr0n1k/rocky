// ── Farms API Schemas - Diamond Seal ──
//
// The farm is the fundamental unit of the I&R system, Comrade.
// Without a farm, an animal is a floating signifier with no anchor in the material world.
//
// Based on: FS - HK_MK(v1.0).pdf, HK.PDF

import { z } from "zod";
import { farmBookSelectSchema, farmSelectSchema, farmInsertSchema, addressSelectSchema, vsAssignmentSelectSchema, vsContractSelectSchema } from "@rocky/database/zod";
import { farmBookStatusSchema, verificationStatusSchema, farmTypeSchema, dataSourceSchema, sortByFarmSchema, sortOrderSchema, vsContractStatusSchema } from "../enums/domain.js";
import type { farmBookStatusType, vsContractStatusType } from "../enums/domain.js";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";
import { farmIdSchema } from "../utils/check-digit.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const farmResponseSchema = farmSelectSchema
  .omit({ createdBy: true, updatedBy: true, validTo: true })
  .extend({
    location: z.unknown().nullable(),
    signatureCapturedAt: z.coerce.date<string>().nullable(),
    verifiedAt: z.coerce.date<string>().nullable(),
    type: farmTypeSchema,
    verificationStatus: verificationStatusSchema,
    dataSource: dataSourceSchema,
  })
  .strip();

export type FarmResponse = z.infer<typeof farmResponseSchema>;

export const farmSummarySchema = z.object(farmResponseSchema
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
    geocodedAt: z.coerce.date<string>().nullable(),
  })
  .strip();

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

// ═══════════════════════════════════════════════════════════════════════════
// FARM BOOK SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export interface FarmBookResponse {
  id: string;
  farmId: string;
  status: farmBookStatusType;
  assembledAt: Date | null;
  printedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  assembledBy: string | null;
  printedBy: string | null;
  shippedToVs: boolean;
  deliveredToKeeper: boolean;
  vsId: string | null;
  reprintOf: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
}

export const farmBookResponseSchema = farmBookSelectSchema
  .omit({ createdBy: true, updatedAt: true, validTo: true })
  .extend({ status: farmBookStatusSchema })
  .strip() satisfies z.ZodType<FarmBookResponse>;

type _nodrift_farmBookResponse = NoDrift<z.infer<typeof farmBookResponseSchema>, FarmBookResponse>;

export interface CreateFarmBookRequest {
  farmId: string;
}

export const createFarmBookRequestSchema = z.strictObject({
  farmId: z.uuid(),
}) satisfies z.ZodType<CreateFarmBookRequest>;

type _nodrift_createFarmBookRequest = NoDrift<z.infer<typeof createFarmBookRequestSchema>, CreateFarmBookRequest>;

export interface UpdateFarmBookStatusRequest {
  status: farmBookStatusType;
  vsId?: string;
  notes?: string;
}

export const updateFarmBookStatusRequestSchema = z.strictObject({
  status: farmBookStatusSchema,
  vsId: z.uuid().optional(),
  notes: z.string().optional(),
}) satisfies z.ZodType<UpdateFarmBookStatusRequest>;

type _nodrift_updateFarmBookStatusRequest = NoDrift<z.infer<typeof updateFarmBookStatusRequestSchema>, UpdateFarmBookStatusRequest>;

// ═══════════════════════════════════════════════════════════════════════════
// VS CONTRACT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export interface VsContractResponse {
  id: string;
  subjectId: string;
  contractNumber: string;
  region: string;
  startDate: Date;
  endDate: Date | null;
  status: vsContractStatusType;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
}

export const vsContractResponseSchema = vsContractSelectSchema
  .omit({ createdBy: true, updatedAt: true, validTo: true })
  .extend({ status: vsContractStatusSchema })
  .strip() satisfies z.ZodType<VsContractResponse>;

type _nodrift_vsContractResponse = NoDrift<z.infer<typeof vsContractResponseSchema>, VsContractResponse>;

export interface CreateVsContractRequest {
  subjectId: string;
  contractNumber: string;
  region: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export const createVsContractRequestSchema = z.strictObject({
  subjectId: z.uuid(),
  contractNumber: z.string().min(1).max(50),
  region: z.string().min(1).max(100),
  startDate: z.coerce.date<string>(),
  endDate: z.coerce.date<string>().optional(),
  notes: z.string().optional(),
}) satisfies z.ZodType<CreateVsContractRequest>;

type _nodrift_createVsContractRequest = NoDrift<z.infer<typeof createVsContractRequestSchema>, CreateVsContractRequest>;

export interface UpdateVsContractStatusRequest {
  status: vsContractStatusType;
}

export const updateVsContractStatusRequestSchema = z.strictObject({
  status: vsContractStatusSchema,
}) satisfies z.ZodType<UpdateVsContractStatusRequest>;

type _nodrift_updateVsContractStatusRequest = NoDrift<z.infer<typeof updateVsContractStatusRequestSchema>, UpdateVsContractStatusRequest>;

// ═══════════════════════════════════════════════════════════════════════════
// VS ASSIGNMENT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export interface VsAssignmentResponse {
  id: string;
  contractId: string;
  farmId: string;
  isPrimary: boolean;
  startDate: Date;
  endDate: Date | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
}

export const vsAssignmentResponseSchema = vsAssignmentSelectSchema
  .omit({ createdBy: true, updatedAt: true, validTo: true })
  .strip() satisfies z.ZodType<VsAssignmentResponse>;

type _nodrift_vsAssignmentResponse = NoDrift<z.infer<typeof vsAssignmentResponseSchema>, VsAssignmentResponse>;

export interface CreateVsAssignmentRequest {
  contractId: string;
  farmId: string;
  startDate: Date;
  endDate?: Date;
  isPrimary?: boolean;
  notes?: string;
}

export const createVsAssignmentRequestSchema = z.strictObject({
  contractId: z.uuid(),
  farmId: z.uuid(),
  startDate: z.coerce.date<string>(),
  endDate: z.coerce.date<string>().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
}) satisfies z.ZodType<CreateVsAssignmentRequest>;

type _nodrift_createVsAssignmentRequest = NoDrift<z.infer<typeof createVsAssignmentRequestSchema>, CreateVsAssignmentRequest>;

export interface UpdateVsAssignmentRequest {
  endDate?: Date;
  notes?: string;
}

export const updateVsAssignmentRequestSchema = z.strictObject({
  endDate: z.coerce.date<string>().optional(),
  notes: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, "At least one field must be updated") satisfies z.ZodType<UpdateVsAssignmentRequest>;

type _nodrift_updateVsAssignmentRequest = NoDrift<z.infer<typeof updateVsAssignmentRequestSchema>, UpdateVsAssignmentRequest>;

export type _FarmGuillotines = ActivateGuillotines<
  [_nodrift_farmBookResponse, _nodrift_createFarmBookRequest, _nodrift_updateFarmBookStatusRequest,
   _nodrift_vsContractResponse, _nodrift_createVsContractRequest, _nodrift_updateVsContractStatusRequest,
   _nodrift_vsAssignmentResponse, _nodrift_createVsAssignmentRequest, _nodrift_updateVsAssignmentRequest]
>;
