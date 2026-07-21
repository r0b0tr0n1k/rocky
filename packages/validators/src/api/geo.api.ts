// ── Geo foundation API schemas (geofences, geofence events) ──
//
// Moved out of iot.api: geo foundation now lives in @rocky/geo and iot is the
// networking service (devices + sensor readings) only. These schemas are the
// API contract for the geo router's geofence queries + mutations.

import { geofencesSelectSchema, animalGeofenceEventsSelectSchema, settlementsSelectSchema } from "@rocky/database/zod";
import {
  fenceTypeSchema,
  geofenceEventTypeSchema,
  geofenceEventSourceSchema,
  settlementTypeSchema,
} from "../enums/index.js";
import type {
  fenceTypeType,
  geofenceEventTypeType,
  geofenceEventSourceType,
  settlementTypeType,
} from "../enums/index.js";
import type { NoDriftSimple, ActivateGuillotines } from "../utils/type-bridge.js";
import { z } from "zod";

// ── Geofence ──

export const geofenceResponseSchema = geofencesSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({ fenceType: fenceTypeSchema, polygon: z.any() })
  .strip() satisfies z.ZodType<GeofenceResponse>;

export interface GeofenceResponse {
  id: string;
  name: string;
  description: string | null;
  farmId: string;
  pastureId: string | null;
  cadastralReference: string | null;
  deforestationFreeSince: string | null;
  geometry: any;
  polygon: any;
  fenceType: fenceTypeType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export const createGeofenceRequestSchema = z.strictObject({
  cadastralReference: z.string().optional(),
  deforestationFreeSince: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  farmId: z.uuid(),
  pastureId: z.uuid().optional(),
  fenceType: fenceTypeSchema,
  geometry: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("circle"),
      center: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      }),
      radiusMeters: z.number().positive(),
    }),
    z.object({
      type: z.literal("polygon"),
      vertices: z
        .array(
          z.object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
          }),
        )
        .min(3),
    }),
  ]),
}) satisfies z.ZodType<CreateGeofenceRequest>;

export interface CreateGeofenceRequest {
  name: string;
  description?: string;
  farmId: string;
  pastureId?: string;
  cadastralReference?: string;
  deforestationFreeSince?: string;
  fenceType: fenceTypeType;
  geometry:
    | { type: "circle"; center: { latitude: number; longitude: number }; radiusMeters: number }
    | { type: "polygon"; vertices: Array<{ latitude: number; longitude: number }> };
}

// ── Geofence Event ──

export const geofenceEventResponseSchema = animalGeofenceEventsSelectSchema
  .extend({
    eventType: geofenceEventTypeSchema,
    source: geofenceEventSourceSchema.nullable(),
  })
  .strict() satisfies z.ZodType<GeofenceEventResponse>;

export interface GeofenceEventResponse {
  id: string;
  animalId: string;
  geofenceId: string;
  farmId: string | null;
  eventType: geofenceEventTypeType;
  eventAt: Date;
  location: any;
  source: geofenceEventSourceType | null;
  createdAt: Date;
}

export const geofenceEventListResponseSchema = z
  .object({ data: z.array(geofenceEventResponseSchema), total: z.number(), limit: z.number(), offset: z.number() })
  .strict();
export type GeofenceEventListResponse = z.infer<typeof geofenceEventListResponseSchema>;

export const logGeofenceEventRequestSchema = z.strictObject({
  animalId: z.uuid(),
  geofenceId: z.uuid(),
  farmId: z.uuid().optional(),
  eventType: geofenceEventTypeSchema,
  eventAt: z.iso.datetime(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  source: geofenceEventSourceSchema.default("manual"),
}) satisfies z.ZodType<LogGeofenceEventRequest>;

export interface LogGeofenceEventRequest {
  animalId: string;
  geofenceId: string;
  farmId?: string;
  eventType: geofenceEventTypeType;
  eventAt: string;
  latitude?: number;
  longitude?: number;
  source: geofenceEventSourceType;
}

// ── Settlement reference (provided/ingested disease-zone anchor, ADR-0080) ──
// Settlements are the nearest-village/town a disease is reported against. The
// authoritative settlement + outbreak data is supplied to us on go-live, not
// hand-drawn by vets/farmers.

export const settlementResponseSchema = settlementsSelectSchema
  .omit({ location: true })
  .extend({ settlementType: settlementTypeSchema })
  .strip() satisfies z.ZodType<SettlementResponse>;

export interface SettlementResponse {
  id: string;
  name: string;
  settlementType: settlementTypeType;
  createdAt: Date;
}

export const declareDiseaseZoneRequestSchema = z.strictObject({
  farmId: z.uuid(),
  disease: z.string().min(1),
  validTo: z.string().optional(),
  source: z.string().optional(),
  protectionRadiusMeters: z.number().int().positive().optional(),
  surveillanceRadiusMeters: z.number().int().positive().optional(),
}) satisfies z.ZodType<DeclareDiseaseZoneRequest>;

export interface DeclareDiseaseZoneRequest {
  farmId: string;
  disease: string;
  validTo?: string;
  source?: string;
  protectionRadiusMeters?: number;
  surveillanceRadiusMeters?: number;
}

export const diseaseZoneListResponseSchema = z
  .object({
    data: z.array(geofenceResponseSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  })
  .strict();
export type DiseaseZoneListResponse = z.infer<typeof diseaseZoneListResponseSchema>;

// ── Dashboard counts (ADR-0078 Consequence) ──

export const geoCountSchema = z
  .object({
    activeDiseaseZones: z.number().int().min(0),
    openGeofenceEvents: z.number().int().min(0),
  })
  .strict();
export type GeoCount = z.infer<typeof geoCountSchema>;

// NoDrift guillotines: schema output ⊆ aliased interface (hand-written SSOT
// is wider than the Drizzle-derived response). One-directional subset check.
type _drift_geofenceResponse = NoDriftSimple<z.infer<typeof geofenceResponseSchema>, GeofenceResponse>;
type _drift_geofenceEventResponse = NoDriftSimple<z.infer<typeof geofenceEventResponseSchema>, GeofenceEventResponse>;
type _drift_createGeofence = NoDriftSimple<z.infer<typeof createGeofenceRequestSchema>, CreateGeofenceRequest>;
type _drift_logGeofenceEvent = NoDriftSimple<z.infer<typeof logGeofenceEventRequestSchema>, LogGeofenceEventRequest>;
type _drift_settlementResponse = NoDriftSimple<z.infer<typeof settlementResponseSchema>, SettlementResponse>;
type _drift_declareDiseaseZone = NoDriftSimple<
  z.infer<typeof declareDiseaseZoneRequestSchema>,
  DeclareDiseaseZoneRequest
>;
type _drift_diseaseZoneList = NoDriftSimple<z.infer<typeof diseaseZoneListResponseSchema>, DiseaseZoneListResponse>;

export type _GeoGuillotines = ActivateGuillotines<
  [
    _drift_geofenceResponse,
    _drift_geofenceEventResponse,
    _drift_createGeofence,
    _drift_logGeofenceEvent,
    _drift_settlementResponse,
    _drift_declareDiseaseZone,
    _drift_diseaseZoneList,
  ]
>;
