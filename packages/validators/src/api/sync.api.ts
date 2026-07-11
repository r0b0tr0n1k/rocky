// ── Sync API Schemas - Diamond Seal ──
//
// Top-level `sync` router contract (WO-081). Mobile offline-first sync:
//   download = RLS-scoped field-entity snapshot + health master data (LWW via watermark);
//   upload   = ordered, idempotent, version-checked application of PDA-created records.
// No row escapes without a guillotine check.

import { z } from "zod";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

import { animalSummarySchema } from "./animals.api.js";
import { farmResponseSchema } from "./farms.api.js";
import { movementResponseSchema } from "./movements.api.js";
import { inspectionResponseSchema } from "./inspection.api.js";
import { earTagResponseSchema } from "./eartags.api.js";
import { syncRecordTypeSchema } from "../enums/index.js";
import {
  diseaseResponseSchema,
  vaccineResponseSchema,
  vaccineBatchResponseSchema,
  vaccineDiseaseResponseSchema,
} from "./health.api.js";

// ── Download ────────────────────────────────────────────────────

export const syncDownloadRequestSchema = z.strictObject({
  since: z.coerce.date<string>().nullable().optional(),
});
export type SyncDownloadRequest = z.infer<typeof syncDownloadRequestSchema>;

export const syncDownloadResponseSchema = z.strictObject({
  animals: z.array(animalSummarySchema),
  farms: z.array(farmResponseSchema),
  movements: z.array(movementResponseSchema),
  inspections: z.array(inspectionResponseSchema),
  earTags: z.array(earTagResponseSchema),
  diseases: z.array(diseaseResponseSchema),
  vaccines: z.array(vaccineResponseSchema),
  batches: z.array(vaccineBatchResponseSchema),
  vaccineDiseases: z.array(vaccineDiseaseResponseSchema),
  syncedAt: z.coerce.date<string>(),
  watermark: z.coerce.date<string>().nullable(),
});
export type SyncDownloadResponse = z.infer<typeof syncDownloadResponseSchema>;

// ── Upload ──────────────────────────────────────────────────────

export const syncUploadItemSchema = z.strictObject({
  idempotencyKey: z.string().max(100),
  type: syncRecordTypeSchema,
  data: z.record(z.string(), z.unknown()),
  baseUpdatedAt: z.coerce.date<string>().nullable().optional(),
});
export type SyncUploadItemType = z.infer<typeof syncUploadItemSchema>["type"];
export type SyncUploadItem = z.infer<typeof syncUploadItemSchema>;

export const syncUploadRequestSchema = z.strictObject({
  records: z.array(syncUploadItemSchema).min(1).max(500),
});
export type SyncUploadRequest = z.infer<typeof syncUploadRequestSchema>;

export const syncUploadResultSchema = z.strictObject({
  idempotencyKey: z.string(),
  success: z.boolean(),
  recordId: z.uuid().nullable(),
  error: z.string().nullable(),
});
export type SyncUploadResult = z.infer<typeof syncUploadResultSchema>;

export const syncUploadResponseSchema = z.strictObject({
  results: z.array(syncUploadResultSchema),
  processed: z.int().nonnegative(),
  failed: z.int().nonnegative(),
});
export type SyncUploadResponse = z.infer<typeof syncUploadResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_syncDownloadRequest = NoDrift<z.infer<typeof syncDownloadRequestSchema>, SyncDownloadRequest>;
type _drift_syncDownload = NoDrift<z.infer<typeof syncDownloadResponseSchema>, SyncDownloadResponse>;
type _drift_syncUploadItem = NoDrift<z.infer<typeof syncUploadItemSchema>, SyncUploadItem>;
type _drift_syncUploadRequest = NoDrift<z.infer<typeof syncUploadRequestSchema>, SyncUploadRequest>;
type _drift_syncUploadResult = NoDrift<z.infer<typeof syncUploadResultSchema>, SyncUploadResult>;
type _drift_syncUploadResponse = NoDrift<z.infer<typeof syncUploadResponseSchema>, SyncUploadResponse>;

export type _SyncGuillotines = ActivateGuillotines<
  [
    _drift_syncDownloadRequest,
    _drift_syncDownload,
    _drift_syncUploadItem,
    _drift_syncUploadRequest,
    _drift_syncUploadResult,
    _drift_syncUploadResponse,
  ]
>;
