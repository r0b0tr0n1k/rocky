// ── Mobile Device API Schemas - Diamond Seal ──
// Tracks field devices (iPhone/Android) running the Expo mobile app.

import { z } from "zod";
import { pdaDevicesSelectSchema, pdaDevicesInsertSchema } from "@rocky/database/zod";
import { deviceStatusSchema } from "../enums/index.js";
import type { NoDrift, NoDriftSimple, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const pdaDeviceResponseSchema = pdaDevicesSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    status: deviceStatusSchema,
    lastSyncData: z.object({
      animals: z.boolean().optional(),
      movements: z.boolean().optional(),
      health: z.boolean().optional(),
      eartags: z.boolean().optional(),
      farms: z.boolean().optional(),
      inspections: z.boolean().optional(),
    }).nullable().optional(),
  }).strip(); // WO-040: kept .strip() — service passes full DB rows; .strict() would reject omitted audit keys

export type PdaDeviceResponse = z.infer<typeof pdaDeviceResponseSchema>;

export const pdaDeviceSummarySchema = z.object({
  id: z.uuid(),
  deviceIdentifier: z.string(),
  name: z.string().nullable(),
  deviceType: z.string(),
  status: deviceStatusSchema,
  currentUserId: z.uuid().nullable(),
  appVersion: z.string().nullable(),
  osVersion: z.string().nullable(),
  lastSyncAt: z.coerce.date<string>().nullable(),
  failedAttempts: z.int(),
  blockedAt: z.coerce.date<string>().nullable(),
});

export type PdaDeviceSummary = z.infer<typeof pdaDeviceSummarySchema>;

/** Result of a failed-attempt registration (device may become blocked) */
export const pdaDeviceBlockedResponseSchema = z.object({ blocked: z.boolean() }).strict();

export type PdaDeviceBlockedResponse = z.infer<typeof pdaDeviceBlockedResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export type CreatePdaDeviceRequest = z.infer<typeof createPdaDeviceRequestSchema>;

export const createPdaDeviceRequestSchema = pdaDevicesInsertSchema
  .pick({
    deviceIdentifier: true,
    deviceType: true,
    name: true,
    appVersion: true,
    osVersion: true,
  })
  .extend({
    name: z.string().max(200).optional(),
    appVersion: z.string().max(20).optional(),
    osVersion: z.string().max(20).optional(),
  })
  .strict();

export type UpdatePdaDeviceRequest = z.infer<typeof updatePdaDeviceRequestSchema>;

export const updatePdaDeviceRequestSchema = z.strictObject({
  name: z.string().max(200).optional(),
  appVersion: z.string().max(20).optional(),
  osVersion: z.string().max(20).optional(),
  currentUserId: z.uuid().optional(),
  pushToken: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, "At least one field must be updated");

export type AssignDeviceUserRequest = z.infer<typeof assignDeviceUserRequestSchema>;

export const assignDeviceUserRequestSchema = z.strictObject({
  deviceId: z.uuid(),
  userId: z.uuid(),
});

export type RecordSyncRequest = z.infer<typeof recordSyncRequestSchema>;

export const recordSyncRequestSchema = z.strictObject({
  deviceId: z.uuid(),
});

// ═══════════════════════════════════════════════════════════════════════════
// LIST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const pdaDeviceListResponseSchema = z.strictObject({
  data: z.array(pdaDeviceSummarySchema),
  total: z.int().nonnegative(),
});

export type PdaDeviceListResponse = z.infer<typeof pdaDeviceListResponseSchema>;

export type PdaDeviceListRequest = z.infer<typeof pdaDeviceListRequestSchema>;

export const pdaDeviceListRequestSchema = z.strictObject({
  status: deviceStatusSchema.optional(),
  search: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINE ACTIVATION
// ═══════════════════════════════════════════════════════════════════════════

type _drift_pdaDeviceResponse = NoDrift<z.infer<typeof pdaDeviceResponseSchema>, PdaDeviceResponse>;
type _drift_pdaDeviceSummary = NoDrift<z.infer<typeof pdaDeviceSummarySchema>, PdaDeviceSummary>;
type _drift_createPdaDevice = NoDriftSimple<z.infer<typeof createPdaDeviceRequestSchema>, CreatePdaDeviceRequest>;
type _drift_updatePdaDevice = NoDrift<z.infer<typeof updatePdaDeviceRequestSchema>, UpdatePdaDeviceRequest>;
type _drift_pdaDeviceListResponse = NoDrift<z.infer<typeof pdaDeviceListResponseSchema>, PdaDeviceListResponse>;
type _drift_pdaDeviceList = NoDrift<z.infer<typeof pdaDeviceListRequestSchema>, PdaDeviceListRequest>;

export type _PdaDeviceGuillotines = ActivateGuillotines<
  [_drift_pdaDeviceResponse, _drift_pdaDeviceSummary, _drift_createPdaDevice,
   _drift_updatePdaDevice, _drift_pdaDeviceListResponse, _drift_pdaDeviceList]
>;
