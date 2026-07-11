// ── IoT API Schemas — Diamond Seal ──
// Request/response contracts for IoT device registry, sensor readings, and geofences.
// No event streams, no real-time — just basic CRUD.

import { z } from "zod";
import {
  iotDevicesSelectSchema,
  sensorReadingsSelectSchema,
  geofencesSelectSchema,
  animalGeofenceEventsSelectSchema,
} from "@rocky/database/zod";
import {
  iotDeviceStatusSchema,
  transmissionTypeSchema,
  readingTypeSchema,
  processingStageSchema,
  fenceTypeSchema,
  geofenceEventTypeSchema,
  geofenceEventSourceSchema,
} from "../enums/index.js";
import type {
  iotDeviceStatusType,
  transmissionTypeType,
  readingTypeType,
  processingStageType,
  fenceTypeType,
  geofenceEventTypeType,
  geofenceEventSourceType,
} from "../enums/index.js";
import type {
  NoDrift,
  NoDriftSimple,
  ActivateGuillotines,
} from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS — derived from Dumb Zod
// ═══════════════════════════════════════════════════════════════════════════

export const iotDeviceResponseSchema = iotDevicesSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    status: iotDeviceStatusSchema,
    transmissionType: transmissionTypeSchema.nullable(),
  }).strip() satisfies z.ZodType<IotDeviceResponse>; // WO-040: kept .strip() — service passes full DB rows; .strict() would reject omitted audit keys

export interface IotDeviceResponse {
  id: string;
  deviceEui: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  firmwareVersion: string | null;
  transmissionType: transmissionTypeType | null;
  transmissionIntervalSeconds: number | null;
  assignedToAnimalId: string | null;
  assignedToFarmId: string | null;
  activationDate: string | null;
  deactivationDate: string | null;
  batteryLevel: number | null;
  batteryLastChecked: Date | null;
  lastTransmissionAt: Date | null;
  status: iotDeviceStatusType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export const iotDeviceSummarySchema = iotDevicesSelectSchema
  .pick({
    id: true,
    deviceEui: true,
    manufacturer: true,
    model: true,
    status: true,
    assignedToFarmId: true,
  })
  .extend({
    status: iotDeviceStatusSchema,
  })
  .strict() satisfies z.ZodType<IotDeviceSummary>;

export interface IotDeviceSummary {
  id: string;
  deviceEui: string | null;
  manufacturer: string | null;
  model: string | null;
  status: iotDeviceStatusType;
  assignedToFarmId: string | null;
}

export const sensorReadingResponseSchema = sensorReadingsSelectSchema
  .extend({
    readingType: readingTypeSchema,
    processingStage: processingStageSchema.nullable(),
  })
  .strict() satisfies z.ZodType<SensorReadingResponse>;

export interface SensorReadingResponse {
  id: string;
  deviceId: string;
  animalId: string | null;
  farmId: string | null;
  recordedAt: Date;
  ingestedAt: Date;
  readingType: readingTypeType;
  valueNumeric: string | null;
  valueText: string | null;
  unit: string | null;
  location: any;
  rawPayload: any;
  processingStage: processingStageType | null;
  processedAt: Date | null;
  createdAt: Date;
}

export const geofenceResponseSchema = geofencesSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    fenceType: fenceTypeSchema,
  }).strip() satisfies z.ZodType<GeofenceResponse>; // WO-040: kept .strip() — service passes full DB rows; .strict() would reject omitted audit keys

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

// ── Paginated list responses (Diamond Seal) ──
export const iotDeviceListResponseSchema = z
  .object({ data: z.array(iotDeviceResponseSchema), total: z.number(), limit: z.number(), offset: z.number() })
  .strict();
export type IotDeviceListResponse = z.infer<typeof iotDeviceListResponseSchema>;

export const sensorReadingListResponseSchema = z
  .object({ data: z.array(sensorReadingResponseSchema), total: z.number(), limit: z.number(), offset: z.number() })
  .strict();
export type SensorReadingListResponse = z.infer<typeof sensorReadingListResponseSchema>;

export const geofenceEventListResponseSchema = z
  .object({ data: z.array(geofenceEventResponseSchema), total: z.number(), limit: z.number(), offset: z.number() })
  .strict();
export type GeofenceEventListResponse = z.infer<typeof geofenceEventListResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS — IoT Devices
// ═══════════════════════════════════════════════════════════════════════════

export const registerDeviceRequestSchema = z.strictObject({
  deviceEui: z.string().max(64).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  firmwareVersion: z.string().max(30).optional(),
  transmissionType: transmissionTypeSchema.optional(),
  transmissionIntervalSeconds: z.int().positive().optional(),
  assignedToAnimalId: z.uuid().optional(),
  assignedToFarmId: z.uuid().optional(),
  activationDate: z.string().optional(),
}) satisfies z.ZodType<RegisterDeviceRequest>;

export interface RegisterDeviceRequest {
  deviceEui?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  transmissionType?: transmissionTypeType;
  transmissionIntervalSeconds?: number;
  assignedToAnimalId?: string;
  assignedToFarmId?: string;
  activationDate?: string;
}

export const listDevicesRequestSchema = z.strictObject({
  farmId: z.uuid().optional(),
  animalId: z.uuid().optional(),
  status: iotDeviceStatusSchema.optional(),
  transmissionType: transmissionTypeSchema.optional(),
  limit: z.int().min(1).max(100).default(20),
  offset: z.int().min(0).default(0),
}) satisfies z.ZodType<ListDevicesRequest>;

export interface ListDevicesRequest {
  farmId?: string;
  animalId?: string;
  status?: iotDeviceStatusType;
  transmissionType?: transmissionTypeType;
  limit: number;
  offset: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS — Sensor Readings
// ═══════════════════════════════════════════════════════════════════════════

export const ingestReadingRequestSchema = z.strictObject({
  deviceId: z.uuid(),
  animalId: z.uuid().optional(),
  farmId: z.uuid().optional(),
  recordedAt: z.iso.datetime(),
  readingType: readingTypeSchema,
  valueNumeric: z.number().optional(),
  valueText: z.string().optional(),
  unit: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  rawPayload: z.record(z.string(), z.unknown()).optional(),
}) satisfies z.ZodType<IngestReadingRequest>;

export interface IngestReadingRequest {
  deviceId: string;
  animalId?: string;
  farmId?: string;
  recordedAt: string;
  readingType: readingTypeType;
  valueNumeric?: number;
  valueText?: string;
  unit?: string;
  latitude?: number;
  longitude?: number;
  rawPayload?: Record<string, unknown>;
}

export const listReadingsRequestSchema = z.strictObject({
  deviceId: z.uuid().optional(),
  animalId: z.uuid().optional(),
  farmId: z.uuid().optional(),
  readingType: readingTypeSchema.optional(),
  fromDate: z.iso.datetime().optional(),
  toDate: z.iso.datetime().optional(),
  limit: z.int().min(1).max(1000).default(100),
  offset: z.int().min(0).default(0),
}) satisfies z.ZodType<ListReadingsRequest>;

export interface ListReadingsRequest {
  deviceId?: string;
  animalId?: string;
  farmId?: string;
  readingType?: readingTypeType;
  fromDate?: string;
  toDate?: string;
  limit: number;
  offset: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS — Geofences
// ═══════════════════════════════════════════════════════════════════════════

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
    | {
        type: "circle";
        center: { latitude: number; longitude: number };
        radiusMeters: number;
      }
    | {
        type: "polygon";
        vertices: Array<{ latitude: number; longitude: number }>;
      };
}

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

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_iotDeviceResponse = NoDriftSimple<
  z.infer<typeof iotDeviceResponseSchema>,
  IotDeviceResponse
>;
type _drift_iotDeviceSummary = NoDriftSimple<
  z.infer<typeof iotDeviceSummarySchema>,
  IotDeviceSummary
>;
type _drift_sensorReadingResponse = NoDriftSimple<
  z.infer<typeof sensorReadingResponseSchema>,
  SensorReadingResponse
>;
type _drift_geofenceResponse = NoDriftSimple<
  z.infer<typeof geofenceResponseSchema>,
  GeofenceResponse
>;
type _drift_geofenceEventResponse = NoDriftSimple<
  z.infer<typeof geofenceEventResponseSchema>,
  GeofenceEventResponse
>;
type _drift_registerDevice = NoDriftSimple<
  z.infer<typeof registerDeviceRequestSchema>,
  RegisterDeviceRequest
>;
type _drift_listDevices = NoDriftSimple<
  z.infer<typeof listDevicesRequestSchema>,
  ListDevicesRequest
>;
type _drift_ingestReading = NoDriftSimple<
  z.infer<typeof ingestReadingRequestSchema>,
  IngestReadingRequest
>;
type _drift_listReadings = NoDriftSimple<
  z.infer<typeof listReadingsRequestSchema>,
  ListReadingsRequest
>;
type _drift_createGeofence = NoDriftSimple<
  z.infer<typeof createGeofenceRequestSchema>,
  CreateGeofenceRequest
>;
type _drift_logGeofenceEvent = NoDriftSimple<
  z.infer<typeof logGeofenceEventRequestSchema>,
  LogGeofenceEventRequest
>;

export type _IotGuillotines = ActivateGuillotines<
  [
    _drift_iotDeviceResponse,
    _drift_iotDeviceSummary,
    _drift_sensorReadingResponse,
    _drift_geofenceResponse,
    _drift_geofenceEventResponse,
    _drift_registerDevice,
    _drift_listDevices,
    _drift_ingestReading,
    _drift_listReadings,
    _drift_createGeofence,
    _drift_logGeofenceEvent,
  ]
>;
