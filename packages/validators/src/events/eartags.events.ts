// ── Ear Tag Domain Events ──
// Every ear tag has a lifecycle, Comrade. From manufacture to application to replacement,
// the ear tag is a material trace of the symbolic order of livestock identification.

import { z } from "zod";
import type { earTagReplacementReasonType, earTagStatusType } from "../enums/index.js";
import { earTagReplacementReasonSchema, earTagStatusSchema } from "../enums/index.js";
import type { ActivateGuillotines, NoDrift } from "../utils/type-bridge.js";
import { eventEnvelopeSchema } from "./base.js";

// ═══════════════════════════════════════════════════════════════
// EAR TAGS CREATED
// ═══════════════════════════════════════════════════════════════

export interface EarTagsCreatedPayload {
  orderId: string;
  typeId: string;
  tagIds: string[];
  startNumber: string;
  endNumber: string;
  batchNumber: string | null;
}

export const earTagsCreatedPayloadSchema = z.strictObject({
  orderId: z.uuid(),
  typeId: z.uuid(),
  tagIds: z.array(z.uuid()),
  startNumber: z.string().length(8),
  endNumber: z.string().length(8),
  batchNumber: z.string().nullable(),
}) satisfies z.ZodType<EarTagsCreatedPayload>;

export const EarTagsCreatedEvent = eventEnvelopeSchema(earTagsCreatedPayloadSchema);
export type EarTagsCreatedEvent = z.infer<typeof EarTagsCreatedEvent>;

type _drift_earTagsCreatedPayload = NoDrift<z.infer<typeof earTagsCreatedPayloadSchema>, EarTagsCreatedPayload>;

// ═══════════════════════════════════════════════════════════════
// EAR TAG ALLOCATED
// ═══════════════════════════════════════════════════════════════

export interface EarTagAllocatedPayload {
  allocationId: string;
  farmId: string;
  typeId: string;
  quantity: number;
  tagIds?: string[];
  allocationNumber: string;
}

export const earTagAllocatedPayloadSchema = z.strictObject({
  allocationId: z.uuid(),
  farmId: z.uuid(),
  typeId: z.uuid(),
  quantity: z.int(),
  tagIds: z.array(z.uuid()).optional(),
  allocationNumber: z.string(),
}) satisfies z.ZodType<EarTagAllocatedPayload>;

export const EarTagAllocatedEvent = eventEnvelopeSchema(earTagAllocatedPayloadSchema);
export type EarTagAllocatedEvent = z.infer<typeof EarTagAllocatedEvent>;

type _drift_earTagAllocatedPayload = NoDrift<z.infer<typeof earTagAllocatedPayloadSchema>, EarTagAllocatedPayload>;

// ═══════════════════════════════════════════════════════════════
// EAR TAG APPLIED (to animal)
// ═══════════════════════════════════════════════════════════════

export interface EarTagAppliedPayload {
  tagId: string;
  tagNumber: string;
  animalId: string;
  farmId: string;
  appliedDate: Date;
}

export const earTagAppliedPayloadSchema = z.strictObject({
  tagId: z.uuid(),
  tagNumber: z.string().length(8),
  animalId: z.uuid(),
  farmId: z.uuid(),
  appliedDate: z.date(),
}) satisfies z.ZodType<EarTagAppliedPayload>;

export const EarTagAppliedEvent = eventEnvelopeSchema(earTagAppliedPayloadSchema);
export type EarTagAppliedEvent = z.infer<typeof EarTagAppliedEvent>;

type _drift_earTagAppliedPayload = NoDrift<z.infer<typeof earTagAppliedPayloadSchema>, EarTagAppliedPayload>;

// ═══════════════════════════════════════════════════════════════
// EAR TAG REPLACED
// ═══════════════════════════════════════════════════════════════

export interface EarTagReplacedPayload {
  replacementId: string;
  animalId: string;
  farmId: string;
  oldTagNumber: string;
  newTagNumber: string;
  reason: earTagReplacementReasonType;
  replacementDate: Date;
}

export const earTagReplacedPayloadSchema = z.strictObject({
  replacementId: z.uuid(),
  animalId: z.uuid(),
  farmId: z.uuid(),
  oldTagNumber: z.string().length(8),
  newTagNumber: z.string().length(8),
  reason: earTagReplacementReasonSchema,
  replacementDate: z.date(),
}) satisfies z.ZodType<EarTagReplacedPayload>;

export const EarTagReplacedEvent = eventEnvelopeSchema(earTagReplacedPayloadSchema);
export type EarTagReplacedEvent = z.infer<typeof EarTagReplacedEvent>;

type _drift_earTagReplacedPayload = NoDrift<z.infer<typeof earTagReplacedPayloadSchema>, EarTagReplacedPayload>;

// ═══════════════════════════════════════════════════════════════
// EAR TAG DEFECTIVE
// ═══════════════════════════════════════════════════════════════

export interface EarTagDefectivePayload {
  tagId: string;
  tagNumber: string;
  defectReason: string;
  qualityCheckedBy?: string;
}

export const earTagDefectivePayloadSchema = z.strictObject({
  tagId: z.uuid(),
  tagNumber: z.string().length(8),
  defectReason: z.string(),
  qualityCheckedBy: z.uuid().optional(),
}) satisfies z.ZodType<EarTagDefectivePayload>;

export const EarTagDefectiveEvent = eventEnvelopeSchema(earTagDefectivePayloadSchema);
export type EarTagDefectiveEvent = z.infer<typeof EarTagDefectiveEvent>;

type _drift_earTagDefectivePayload = NoDrift<z.infer<typeof earTagDefectivePayloadSchema>, EarTagDefectivePayload>;

// ═══════════════════════════════════════════════════════════════
// EAR TAG ORDER STATUS CHANGED
// ═══════════════════════════════════════════════════════════════

export interface EarTagOrderStatusChangedPayload {
  orderId: string;
  orderNumber: string;
  oldStatus: earTagStatusType;
  newStatus: earTagStatusType;
}

export const earTagOrderStatusChangedPayloadSchema = z.strictObject({
  orderId: z.uuid(),
  orderNumber: z.string(),
  oldStatus: earTagStatusSchema,
  newStatus: earTagStatusSchema,
}) satisfies z.ZodType<EarTagOrderStatusChangedPayload>;

export const EarTagOrderStatusChangedEvent = eventEnvelopeSchema(earTagOrderStatusChangedPayloadSchema);
export type EarTagOrderStatusChangedEvent = z.infer<typeof EarTagOrderStatusChangedEvent>;

type _drift_earTagOrderStatusChangedPayload = NoDrift<
  z.infer<typeof earTagOrderStatusChangedPayloadSchema>,
  EarTagOrderStatusChangedPayload
>;

// ═══════════════════════════════════════════════════════════════
// GUILLOTINE ACTIVATION
// ═══════════════════════════════════════════════════════════════

export type _EarTagEventGuillotines = ActivateGuillotines<
  [
    _drift_earTagsCreatedPayload,
    _drift_earTagAllocatedPayload,
    _drift_earTagAppliedPayload,
    _drift_earTagReplacedPayload,
    _drift_earTagDefectivePayload,
    _drift_earTagOrderStatusChangedPayload,
  ]
>;
