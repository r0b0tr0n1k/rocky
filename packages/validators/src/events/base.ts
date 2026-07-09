// ── 4-Part Canonical Event Blueprint ──
//
// Every event in the Animal I&R system follows this dialectical structure:
//
//   1. EVENT HEADER  - The Symbolic: what kind of event, when, and its place in the causal chain
//   2. EVENT PAYLOAD - The Real: the irreducible kernel of domain data that changed
//   3. EVENT SOURCE  - The Imaginary: who/what produced this event and from where
//   4. EVENT ENVELOPE - The Sublime Object: the complete event as it travels through the system
//
// Usage:
//   export const AnimalRegisteredEvent = eventEnvelopeSchema(animalRegisteredPayloadSchema);

import { z } from "zod";
import { eventSourceSchema as eventSourceTypeSchema } from "../enums/index.js";
import type { ActivateGuillotines, NoDrift } from "../utils/type-bridge.js";

// ── Part 1: EVENT HEADER (The Symbolic) ──
// Non-strict version is private - only the strict variant is the public contract
const _eventHeaderSchema = z.object({
  /** Unique event id (UUID v7 - time-ordered) */
  eventId: z.uuid(),

  /** Event type discriminator (e.g. "animal.registered", "ear-tag.allocated") */
  eventType: z.string().min(1),

  /** Event version for schema evolution */
  version: z.int().positive().default(1),

  /** When the event occurred (wall-clock) */
  timestamp: z.date(),

  /** Causation chain: the event that DIRECTLY caused this one */
  causationId: z.uuid().optional(),

  /** Correlation chain: the root event that started the whole business process */
  correlationId: z.uuid().optional(),

  /** Sequence number within the aggregate stream */
  aggregateSequence: z.int().nonnegative().optional(),

  /** Unique idempotency key - same key = same event, even if retried */
  idempotencyKey: z.string().optional(),
});

export interface EventHeader {
  eventId: string;
  eventType: string;
  version: number;
  timestamp: Date;
  causationId?: string;
  correlationId?: string;
  aggregateSequence?: number;
  idempotencyKey?: string;
}

export const eventHeaderSchema = z.strictObject(_eventHeaderSchema.shape) satisfies z.ZodType<EventHeader>;

type _drift_eventHeader = NoDrift<z.infer<typeof eventHeaderSchema>, EventHeader>;

// ── Part 2: EVENT SOURCE (The Imaginary) ──
// Non-strict version is private - only the strict variant is the public contract
const _eventSourceSchema = z.object({
  /** Who produced this event (user id from auth system) */
  userId: z.uuid().optional(),

  /** What subsystem produced this event */
  source: eventSourceTypeSchema.default("API"),

  /** IP address of the producer */
  ipAddress: z.string().optional(),

  /** User agent string */
  userAgent: z.string().optional(),
});

export interface EventSource {
  userId?: string;
  source: "API" | "MOBILE" | "SYNC" | "SYSTEM" | "IMPORT" | "WEBHOOK";
  ipAddress?: string;
  userAgent?: string;
}

export const eventSourceSchema = z.strictObject(_eventSourceSchema.shape) satisfies z.ZodType<EventSource>;

type _drift_eventSource = NoDrift<z.infer<typeof eventSourceSchema>, EventSource>;

// ── Part 3: EVENT PAYLOAD FACTORY (The Real) ──
/**
 * Wrap a domain-specific payload schema into the 4-part canonical event.
 * This is where the Real of the domain meets the Symbolic of the event system.
 */
export function eventEnvelopeSchema<TPayload extends z.ZodType>(payloadSchema: TPayload) {
  return z.strictObject({
    header: eventHeaderSchema,
    source: eventSourceSchema,
    payload: payloadSchema,
  });
}

export type EventEnvelope<TPayload> = EventHeader & {
  source: EventSource;
  payload: TPayload;
};

// ── Part 4: COMMON PAYLOAD PATTERNS ──

/** Snapshot of entity state BEFORE the change */
export interface EntitySnapshot {
  entityType: string;
  entityId: string;
  state: Record<string, unknown>;
}

export const entitySnapshotSchema = z.strictObject({
  /** Entity type (e.g. "animal", "farm") */
  entityType: z.string(),
  /** Entity id */
  entityId: z.uuid(),
  /** Snapshot of entity state at the moment of the event */
  state: z.record(z.string(), z.unknown()),
}) satisfies z.ZodType<EntitySnapshot>;

type _drift_entitySnapshot = NoDrift<z.infer<typeof entitySnapshotSchema>, EntitySnapshot>;

/** Change record: what changed, from what to what */
export interface EntityChange {
  field: string;
  oldValue?: unknown;
  newValue: unknown;
}

export const entityChangeSchema = z.strictObject({
  /** Field name that changed */
  field: z.string(),
  /** Value before the change */
  oldValue: z.unknown().optional(),
  /** Value after the change */
  newValue: z.unknown(),
}) satisfies z.ZodType<EntityChange>;

type _drift_entityChange = NoDrift<z.infer<typeof entityChangeSchema>, EntityChange>;

// ═══════════════════════════════════════════════════════════════
// GUILLOTINE ACTIVATION
// ═══════════════════════════════════════════════════════════════

export type _BaseEventGuillotines = ActivateGuillotines<
  [_drift_eventHeader, _drift_eventSource, _drift_entitySnapshot, _drift_entityChange]
>;
