// ── Farm & Subject Domain Events ──
// The Holder Keeper is the fundamental unit of the system, Comrade.
// Without the farm, the animal is a floating signifier - it must be anchored.

import { z } from "zod";
import type { dataSourceType, farmTypeType, subjectRoleType, verificationStatusType } from "../enums/index.js";
import { dataSourceSchema, farmTypeSchema, subjectRoleSchema, verificationStatusSchema } from "../enums/index.js";
import type { ActivateGuillotines, NoDrift } from "../utils/type-bridge.js";
import { eventEnvelopeSchema } from "./base.js";

// ═══════════════════════════════════════════════════════════════
// FARM REGISTERED
// ═══════════════════════════════════════════════════════════════

export interface FarmRegisteredPayload {
  farmId: string;
  farmIdNumber: string;
  name: string | null;
  type: farmTypeType;
  addressId: string;
  verificationStatus: verificationStatusType;
  dataSource: dataSourceType;
}

export const farmRegisteredPayloadSchema = z.strictObject({
  farmId: z.uuid(),
  farmIdNumber: z.string().length(9),
  name: z.string().nullable(),
  type: farmTypeSchema,
  addressId: z.uuid(),
  verificationStatus: verificationStatusSchema,
  dataSource: dataSourceSchema,
}) satisfies z.ZodType<FarmRegisteredPayload>;

export const FarmRegisteredEvent = eventEnvelopeSchema(farmRegisteredPayloadSchema);
export type FarmRegisteredEvent = z.infer<typeof FarmRegisteredEvent>;

type _drift_farmRegisteredPayload = NoDrift<z.infer<typeof farmRegisteredPayloadSchema>, FarmRegisteredPayload>;

// ═══════════════════════════════════════════════════════════════
// FARM VERIFIED
// ═══════════════════════════════════════════════════════════════

export interface FarmVerifiedPayload {
  farmId: string;
  oldStatus: verificationStatusType;
  newStatus: verificationStatusType;
  verifiedBy: string;
  verificationNote: string | null;
}

export const farmVerifiedPayloadSchema = z.strictObject({
  farmId: z.uuid(),
  oldStatus: verificationStatusSchema,
  newStatus: verificationStatusSchema,
  verifiedBy: z.uuid(),
  verificationNote: z.string().nullable(),
}) satisfies z.ZodType<FarmVerifiedPayload>;

export const FarmVerifiedEvent = eventEnvelopeSchema(farmVerifiedPayloadSchema);
export type FarmVerifiedEvent = z.infer<typeof FarmVerifiedEvent>;

type _drift_farmVerifiedPayload = NoDrift<z.infer<typeof farmVerifiedPayloadSchema>, FarmVerifiedPayload>;

// ═══════════════════════════════════════════════════════════════
// SUBJECT REGISTERED
// ═══════════════════════════════════════════════════════════════

export interface SubjectRegisteredPayload {
  subjectId: string;
  shortName: string;
  personalId: string | null;
  vatNumber: string | null;
  email: string | null;
  phoneNumber: string | null;
}

export const subjectRegisteredPayloadSchema = z.strictObject({
  subjectId: z.uuid(),
  shortName: z.string(),
  personalId: z.string().nullable(),
  vatNumber: z.string().nullable(),
  email: z.string().nullable(),
  phoneNumber: z.string().nullable(),
}) satisfies z.ZodType<SubjectRegisteredPayload>;

export const SubjectRegisteredEvent = eventEnvelopeSchema(subjectRegisteredPayloadSchema);
export type SubjectRegisteredEvent = z.infer<typeof SubjectRegisteredEvent>;

type _drift_subjectRegisteredPayload = NoDrift<
  z.infer<typeof subjectRegisteredPayloadSchema>,
  SubjectRegisteredPayload
>;

// ═══════════════════════════════════════════════════════════════
// SUBJECT BOUND TO FARM
// ═══════════════════════════════════════════════════════════════

export interface SubjectBoundToFarmPayload {
  bindingId: string;
  farmId: string;
  subjectId: string;
  role: subjectRoleType;
}

export const subjectBoundToFarmPayloadSchema = z.strictObject({
  bindingId: z.uuid(),
  farmId: z.uuid(),
  subjectId: z.uuid(),
  role: subjectRoleSchema,
}) satisfies z.ZodType<SubjectBoundToFarmPayload>;

export const SubjectBoundToFarmEvent = eventEnvelopeSchema(subjectBoundToFarmPayloadSchema);
export type SubjectBoundToFarmEvent = z.infer<typeof SubjectBoundToFarmEvent>;

type _drift_subjectBoundToFarmPayload = NoDrift<
  z.infer<typeof subjectBoundToFarmPayloadSchema>,
  SubjectBoundToFarmPayload
>;

// ═══════════════════════════════════════════════════════════════
// SUBJECT UNBOUND FROM FARM
// ═══════════════════════════════════════════════════════════════

export interface SubjectUnboundFromFarmPayload {
  bindingId: string;
  farmId: string;
  subjectId: string;
  role: subjectRoleType;
}

export const subjectUnboundFromFarmPayloadSchema = z.strictObject({
  bindingId: z.uuid(),
  farmId: z.uuid(),
  subjectId: z.uuid(),
  role: subjectRoleSchema,
}) satisfies z.ZodType<SubjectUnboundFromFarmPayload>;

export const SubjectUnboundFromFarmEvent = eventEnvelopeSchema(subjectUnboundFromFarmPayloadSchema);
export type SubjectUnboundFromFarmEvent = z.infer<typeof SubjectUnboundFromFarmEvent>;

type _drift_subjectUnboundFromFarmPayload = NoDrift<
  z.infer<typeof subjectUnboundFromFarmPayloadSchema>,
  SubjectUnboundFromFarmPayload
>;

// ═══════════════════════════════════════════════════════════════
// GUILLOTINE ACTIVATION
// ═══════════════════════════════════════════════════════════════

export type _FarmEventGuillotines = ActivateGuillotines<
  [
    _drift_farmRegisteredPayload,
    _drift_farmVerifiedPayload,
    _drift_subjectRegisteredPayload,
    _drift_subjectBoundToFarmPayload,
    _drift_subjectUnboundFromFarmPayload,
  ]
>;
