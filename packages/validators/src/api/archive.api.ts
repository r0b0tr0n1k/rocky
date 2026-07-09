// ── Archive API Schemas - Diamond Seal ──
//
// 3-tier document archive, retention enforcement, inspection form archival.

import { z } from "zod";
import {
  archiveDocumentsSelectSchema,
  archiveDocumentsInsertSchema,
} from "@rocky/database/zod";
import {
  archiveDocumentTypeSchema,
  archiveLocationSchema,
} from "../enums/index.js";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** Archive document record */
export const archiveDocumentResponseSchema = archiveDocumentsSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    documentType: archiveDocumentTypeSchema,
    archiveLocation: archiveLocationSchema,
    retentionExpiry: z.coerce.date<string>(),
    archivedAt: z.coerce.date<string>().nullable(),
    destroyedAt: z.coerce.date<string>().nullable(),
  }).strip();

export type ArchiveDocumentResponse = z.infer<typeof archiveDocumentResponseSchema>;

/** Paginated list of archive documents */
export const archiveDocumentListResponseSchema = z
  .object({
    data: z.array(archiveDocumentResponseSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  })
  .strip();

export type ArchiveDocumentListResponse = z.infer<typeof archiveDocumentListResponseSchema>;

/** Expired (retention-due) archive documents */
export const archiveExpiredListResponseSchema = z.array(archiveDocumentResponseSchema);

export type ArchiveExpiredListResponse = z.infer<typeof archiveExpiredListResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// LIST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const archiveDocumentListRequestSchema = z
  .strictObject({
    documentType: archiveDocumentTypeSchema.optional(),
    archiveLocation: archiveLocationSchema.optional(),
    farmId: z.uuid().optional(),
    isArchived: z.boolean().optional(),
    search: z.string().optional(),
    limit: z.int().min(1).max(100).default(20),
    offset: z.int().min(0).default(0),
  });

export type ArchiveDocumentListRequest = z.infer<typeof archiveDocumentListRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// CREATE / INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const createArchiveDocumentRequestSchema = archiveDocumentsInsertSchema
  .pick({
    documentType: true,
    documentRef: true,
    archiveLocation: true,
    physicalLocation: true,
    animalId: true,
    farmId: true,
    passportId: true,
    inspectionId: true,
  })
  .extend({
    documentType: archiveDocumentTypeSchema,
    archiveLocation: archiveLocationSchema.optional(),
    retentionExpiry: z.coerce.date<string>(),
  })
  .strict();

export type CreateArchiveDocumentRequest = z.infer<typeof createArchiveDocumentRequestSchema>;

export const archiveInspectionFormRequestSchema = z.strictObject({
    inspectionId: z.uuid(),
    farmId: z.uuid(),
    archiveLocation: archiveLocationSchema.optional(),
    createdBy: z.uuid().optional(),
  });

export type ArchiveInspectionFormRequest = z.infer<typeof archiveInspectionFormRequestSchema>;

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_archiveDocumentResponse = NoDrift<z.infer<typeof archiveDocumentResponseSchema>, ArchiveDocumentResponse>;
type _drift_archiveDocumentList = NoDrift<z.infer<typeof archiveDocumentListRequestSchema>, ArchiveDocumentListRequest>;
type _drift_createArchiveDocument = NoDrift<z.infer<typeof createArchiveDocumentRequestSchema>, CreateArchiveDocumentRequest>;
type _drift_archiveInspectionForm = NoDrift<z.infer<typeof archiveInspectionFormRequestSchema>, ArchiveInspectionFormRequest>;

export type _ArchiveGuillotines = ActivateGuillotines<
  [
    _drift_archiveDocumentResponse,
    _drift_archiveDocumentList,
    _drift_createArchiveDocument,
    _drift_archiveInspectionForm,
  ]
>;
