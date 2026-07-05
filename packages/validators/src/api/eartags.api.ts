// ── Ear Tags API Schemas - Diamond Seal ──
//
// Ear tags are the material trace of the animal in the Symbolic order.
// Every tag has a lifecycle: manufactured → allocated → applied → replaced.
//
// Based on: FS - eartags_MK(v1.0).pdf, Eartags.PDF

import { earTagSelectSchema, earTagTypeSelectSchema } from "@rocky/database/zod";
import { z } from "zod";
import {
  contingentTypeSchema,
  earTagStatusSchema,
  orderStatusSchema,
  sortByEartagSchema,
  sortOrderSchema,
} from "../enums/domain.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const earTagResponseSchema = earTagSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    appliedDate: z.coerce.date().nullable(),
    manufactureDate: z.coerce.date().nullable(),
    expiryDate: z.coerce.date().nullable(),
    status: earTagStatusSchema,
  })
  .strict();

export type EarTagResponse = z.infer<typeof earTagResponseSchema>;

export const earTagSummarySchema = z.strictObject(
  earTagResponseSchema.pick({
    id: true,
    stateCode: true,
    tagNumber: true,
    status: true,
    typeId: true,
    animalId: true,
    appliedDate: true,
  }).shape,
);

export type EarTagSummary = z.infer<typeof earTagSummarySchema>;

export const earTagTypeResponseSchema = earTagTypeSelectSchema.omit({ createdBy: true, validTo: true }).strict();

export type EarTagTypeResponse = z.infer<typeof earTagTypeResponseSchema>;

export const earTagListRequestSchema = z.strictObject({
  earTag: z.string().optional(),
  stateCode: z.string().length(3).optional(),
  status: earTagStatusSchema.optional(),
  typeId: z.uuid().optional(),
  orderId: z.uuid().optional(),
  allocationId: z.uuid().optional(),
  animalId: z.uuid().optional(),
  isDefective: z.boolean().optional(),
  sortBy: sortByEartagSchema.default("createdAt"),
  sortOrder: sortOrderSchema.default("desc"),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
});

export type EarTagListRequest = z.infer<typeof earTagListRequestSchema>;

export const earTagListResponseSchema = z.strictObject({
  data: z.array(earTagResponseSchema),
  total: z.int().nonnegative(),
  limit: z.int(),
  offset: z.int(),
});

export type EarTagListResponse = z.infer<typeof earTagListResponseSchema>;

export const orderStatusTransitionSchema = z.strictObject({
  orderId: z.uuid(),
  newStatus: orderStatusSchema,
});

export type OrderStatusTransition = z.infer<typeof orderStatusTransitionSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createOrderRequestSchema = z.strictObject({
  organizationId: z.uuid(),
  supplierOrganizationId: z.uuid(),
  supplierName: z.string().min(1).max(100),
  quantity: z.int().min(1).max(10000),
  farmId: z.uuid().optional(),
  description: z.string().max(500).optional(),
  idempotencyKey: z.string().max(100).optional(),
}) satisfies z.ZodType<CreateOrderRequest>;

export type CreateOrderRequest = {
  organizationId: string;
  supplierOrganizationId: string;
  supplierName: string;
  quantity: number;
  farmId?: string;
  description?: string;
  idempotencyKey?: string;
};

export const cancelOrderRequestSchema = z.strictObject({
  orderId: z.uuid(),
  reason: z.string().max(500).optional(),
}) satisfies z.ZodType<CancelOrderRequest>;

export type CancelOrderRequest = {
  orderId: string;
  reason?: string;
};

export const cancelOrderItemRequestSchema = z.strictObject({
  orderId: z.uuid(),
  earTagId: z.uuid(),
  reason: z.string().max(500).optional(),
}) satisfies z.ZodType<CancelOrderItemRequest>;

export type CancelOrderItemRequest = {
  orderId: string;
  earTagId: string;
  reason?: string;
};

export const appendToOrderRequestSchema = z.strictObject({
  orderId: z.uuid(),
  organizationId: z.uuid(),
  additionalQuantity: z.int().min(1).max(10000),
}) satisfies z.ZodType<AppendToOrderRequest>;

export type AppendToOrderRequest = {
  orderId: string;
  organizationId: string;
  additionalQuantity: number;
};

export const collectOrderTagsRequestSchema = z.strictObject({
  orderId: z.uuid(),
  supplierOrganizationId: z.uuid(),
}) satisfies z.ZodType<CollectOrderTagsRequest>;

export type CollectOrderTagsRequest = {
  orderId: string;
  supplierOrganizationId: string;
};

export const generateTagNumbersRequestSchema = z.strictObject({
  count: z.int().min(1).max(10000),
  startFrom: z.int().min(10000001).optional(),
}) satisfies z.ZodType<GenerateTagNumbersRequest>;

export type GenerateTagNumbersRequest = {
  count: number;
  startFrom?: number;
};

export const generateTagNumbersResponseSchema = z.strictObject({
  tags: z.array(z.string().length(8)),
});

export type GenerateTagNumbersResponse = z.infer<typeof generateTagNumbersResponseSchema>;

export const createDuplicateOrderRequestSchema = z.strictObject({
  animalId: z.uuid(),
  farmId: z.uuid(),
  organizationId: z.uuid(),
  supplierOrganizationId: z.uuid(),
  supplierName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
}) satisfies z.ZodType<CreateDuplicateOrderRequest>;

export type CreateDuplicateOrderRequest = {
  animalId: string;
  farmId: string;
  organizationId: string;
  supplierOrganizationId: string;
  supplierName: string;
  description?: string;
};

export const orderListRequestSchema = z.strictObject({
  status: orderStatusSchema.optional(),
  organizationId: z.uuid().optional(),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
}) satisfies z.ZodType<OrderListRequest>;

export type OrderListRequest = {
  status?: string;
  organizationId?: string;
  limit?: number;
  offset?: number;
};

// ── B.1: Supplier Contingent Assignment ────────────────────────────

export const assignSupplierContingentRequestSchema = z.strictObject({
  supplierOrganizationId: z.uuid(),
  farmId: z.uuid(),
  typeId: z.uuid(),
  tagRangeStart: z.string().length(8),
  tagRangeEnd: z.string().length(8),
  quantity: z.int().min(1).max(100000),
  contingentType: contingentTypeSchema,
}) satisfies z.ZodType<AssignSupplierContingentRequest>;

export type AssignSupplierContingentRequest = {
  supplierOrganizationId: string;
  farmId: string;
  typeId: string;
  tagRangeStart: string;
  tagRangeEnd: string;
  quantity: number;
  contingentType: "supplier" | "vd" | "vs";
};

// ── B.2: Takeover File ─────────────────────────────────────────────

export const takeoverFileResponseSchema = z.strictObject({
  takeoverId: z.uuid(),
  orderId: z.uuid(),
  supplierOrganizationId: z.uuid(),
  fileName: z.string(),
  content: z.string(),
  lineCount: z.int().nonnegative(),
}) satisfies z.ZodType<TakeoverFileResponse>;

export type TakeoverFileResponse = {
  takeoverId: string;
  orderId: string;
  supplierOrganizationId: string;
  fileName: string;
  content: string;
  lineCount: number;
};

export const getTakeoverFileRequestSchema = z.strictObject({
  takeoverId: z.uuid(),
}) satisfies z.ZodType<GetTakeoverFileRequest>;

export type GetTakeoverFileRequest = {
  takeoverId: string;
};
