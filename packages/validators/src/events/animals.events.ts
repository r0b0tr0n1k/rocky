// ── Animal Domain Events ──
// Every animal lifecycle transition is an event, Comrade.
// From birth to slaughter, the animal leaves a trail in the Symbolic order.

import { z } from "zod";
import { eventEnvelopeSchema } from "./base.js";
import { animalStatusSchema, sexSchema, birthTypeSchema, pastureTypeSchema } from "../enums/domain.js";
import type { sexType, birthTypeType, animalStatusType } from "../enums/domain.js";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════
// ANIMAL REGISTERED
// ═══════════════════════════════════════════════════════════════

export interface AnimalRegisteredPayload {
  animalId: string;
  stateCode: string;
  earTagNumber: string;
  birthDate: Date;
  sex: sexType;
  breed: string | null;
  birthType: birthTypeType | null;
  birthWeight: number | null;
  motherId: string | null;
  fatherId: string | null;
  currentFarmId: string;
  isFirstTagging: boolean;
}

export const animalRegisteredPayloadSchema = z.strictObject({
  animalId: z.uuid(),
  stateCode: z.string().length(3),
  earTagNumber: z.string().length(8),
  birthDate: z.date(),
  sex: sexSchema,
  breed: z.string().nullable(),
  birthType: birthTypeSchema.nullable(),
  birthWeight: z.int().nullable(),
  motherId: z.uuid().nullable(),
  fatherId: z.uuid().nullable(),
  currentFarmId: z.uuid(),
  isFirstTagging: z.boolean(),
}) satisfies z.ZodType<AnimalRegisteredPayload>;

export const AnimalRegisteredEvent = eventEnvelopeSchema(animalRegisteredPayloadSchema);
export type AnimalRegisteredEvent = z.infer<typeof AnimalRegisteredEvent>;

type _drift_animalRegisteredPayload = NoDrift<z.infer<typeof animalRegisteredPayloadSchema>, AnimalRegisteredPayload>;

// ═══════════════════════════════════════════════════════════════
// ANIMAL MOVED
// ═══════════════════════════════════════════════════════════════

export interface AnimalMovedPayload {
  animalId: string;
  movementId: string;
  fromFarmId: string | null;
  toFarmId: string;
  movementType: string;
  movementDate: Date;
}

export const animalMovedPayloadSchema = z.strictObject({
  animalId: z.uuid(),
  movementId: z.uuid(),
  fromFarmId: z.uuid().nullable(),
  toFarmId: z.uuid(),
  movementType: z.string(),
  movementDate: z.date(),
}) satisfies z.ZodType<AnimalMovedPayload>;

export const AnimalMovedEvent = eventEnvelopeSchema(animalMovedPayloadSchema);
export type AnimalMovedEvent = z.infer<typeof AnimalMovedEvent>;

type _drift_animalMovedPayload = NoDrift<z.infer<typeof animalMovedPayloadSchema>, AnimalMovedPayload>;

// ═══════════════════════════════════════════════════════════════
// ANIMAL DIED
// ═══════════════════════════════════════════════════════════════

export interface AnimalDiedPayload {
  animalId: string;
  farmId: string;
  deathDate: Date;
  deathCause: string | null;
}

export const animalDiedPayloadSchema = z.strictObject({
  animalId: z.uuid(),
  farmId: z.uuid(),
  deathDate: z.date(),
  deathCause: z.string().nullable(),
}) satisfies z.ZodType<AnimalDiedPayload>;

export const AnimalDiedEvent = eventEnvelopeSchema(animalDiedPayloadSchema);
export type AnimalDiedEvent = z.infer<typeof AnimalDiedEvent>;

type _drift_animalDiedPayload = NoDrift<z.infer<typeof animalDiedPayloadSchema>, AnimalDiedPayload>;

// ═══════════════════════════════════════════════════════════════
// ANIMAL SLAUGHTERED
// ═══════════════════════════════════════════════════════════════

export interface AnimalSlaughteredPayload {
  animalId: string;
  slaughterRecordId: string;
  slaughterhouseId: string;
  slaughterDate: Date;
  slaughterNumber: string;
  massType: string | null;
  mass: number | null;
}

export const animalSlaughteredPayloadSchema = z.strictObject({
  animalId: z.uuid(),
  slaughterRecordId: z.uuid(),
  slaughterhouseId: z.uuid(),
  slaughterDate: z.date(),
  slaughterNumber: z.string(),
  massType: z.string().nullable(),
  mass: z.int().nullable(),
}) satisfies z.ZodType<AnimalSlaughteredPayload>;

export const AnimalSlaughteredEvent = eventEnvelopeSchema(animalSlaughteredPayloadSchema);
export type AnimalSlaughteredEvent = z.infer<typeof AnimalSlaughteredEvent>;

type _drift_animalSlaughteredPayload = NoDrift<
  z.infer<typeof animalSlaughteredPayloadSchema>,
  AnimalSlaughteredPayload
>;

// ═══════════════════════════════════════════════════════════════
// ANIMAL STATUS CHANGED
// ═══════════════════════════════════════════════════════════════

export interface AnimalStatusChangedPayload {
  animalId: string;
  oldStatus: animalStatusType;
  newStatus: animalStatusType;
  reason?: string;
}

export const animalStatusChangedPayloadSchema = z.strictObject({
  animalId: z.uuid(),
  oldStatus: animalStatusSchema,
  newStatus: animalStatusSchema,
  reason: z.string().optional(),
}) satisfies z.ZodType<AnimalStatusChangedPayload>;

export const AnimalStatusChangedEvent = eventEnvelopeSchema(animalStatusChangedPayloadSchema);
export type AnimalStatusChangedEvent = z.infer<typeof AnimalStatusChangedEvent>;

type _drift_animalStatusChangedPayload = NoDrift<
  z.infer<typeof animalStatusChangedPayloadSchema>,
  AnimalStatusChangedPayload
>;

// ═══════════════════════════════════════════════════════════════
// BIRTH NOTIFIED
// ═══════════════════════════════════════════════════════════════

export interface BirthNotifiedPayload {
  notificationId: string;
  farmId: string;
  notificationDate: Date;
  actualBirthDate: Date | null;
  numberOfCalves: number;
  motherAnimalId: string | null;
  animalIds: string[] | null;
}

export const birthNotifiedPayloadSchema = z.strictObject({
  notificationId: z.uuid(),
  farmId: z.uuid(),
  notificationDate: z.date(),
  actualBirthDate: z.date().nullable(),
  numberOfCalves: z.int(),
  motherAnimalId: z.uuid().nullable(),
  animalIds: z.array(z.uuid()).nullable(),
}) satisfies z.ZodType<BirthNotifiedPayload>;

export const BirthNotifiedEvent = eventEnvelopeSchema(birthNotifiedPayloadSchema);
export type BirthNotifiedEvent = z.infer<typeof BirthNotifiedEvent>;

type _drift_birthNotifiedPayload = NoDrift<z.infer<typeof birthNotifiedPayloadSchema>, BirthNotifiedPayload>;

// ═══════════════════════════════════════════════════════════════
// PASTURE DECLARED
// ═══════════════════════════════════════════════════════════════

export interface PastureDeclaredPayload {
  declarationId: string;
  fromFarmId: string;
  toFarmId: string;
  departureDate: Date;
  expectedReturnDate: Date;
  pastureType: "MOUNTAIN" | "VILLAGE";
  animalIds: string[];
}

export const pastureDeclaredPayloadSchema = z.strictObject({
  declarationId: z.uuid(),
  fromFarmId: z.uuid(),
  toFarmId: z.uuid(),
  departureDate: z.date(),
  expectedReturnDate: z.date(),
  pastureType: pastureTypeSchema,
  animalIds: z.array(z.uuid()),
}) satisfies z.ZodType<PastureDeclaredPayload>;

export const PastureDeclaredEvent = eventEnvelopeSchema(pastureDeclaredPayloadSchema);
export type PastureDeclaredEvent = z.infer<typeof PastureDeclaredEvent>;

type _drift_pastureDeclaredPayload = NoDrift<z.infer<typeof pastureDeclaredPayloadSchema>, PastureDeclaredPayload>;

// ═══════════════════════════════════════════════════════════════
// GUILLOTINE ACTIVATION
// ═══════════════════════════════════════════════════════════════

export type _AnimalEventGuillotines = ActivateGuillotines<
  [
    _drift_animalRegisteredPayload,
    _drift_animalMovedPayload,
    _drift_animalDiedPayload,
    _drift_animalSlaughteredPayload,
    _drift_animalStatusChangedPayload,
    _drift_birthNotifiedPayload,
    _drift_pastureDeclaredPayload,
  ]
>;
