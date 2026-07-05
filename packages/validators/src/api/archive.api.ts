// ── Archive API Schemas - Diamond Seal ──
//
// 3-tier document archive, retention enforcement, inspection form archival.

import { z } from "zod";
import {
  archiveDocumentSelectSchema,
  archiveDocumentInsertSchema,
} from "@rocky/database/zod";
import {
  archiveDocumentTypeSchema,
  archiveLocationSchema,
} from "../enums/domain.js";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

/** Archive document record */
export const archiveDocumentResponseSchema = archiveDocumentSelectSchema
  .omit({ createdBy: true, validTo: true })
  .extend({
    documentType: archiveDocumentTypeSchema,
    archiveLocation: archiveLocationSchema,
    retentionExpiry: z.coerce.date(),
    archivedAt: z.coerce.date().nullable(),
    destroyedAt: z.coerce.date().nullable(),
  })
  .strict();

export type ArchiveDocumentResponse = z.infer<typeof archiveDocumentResponseSchema>;

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

export const createArchiveDocumentRequestSchema = archiveDocumentInsertSchema
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
    retentionExpiry: z.coerce.date(),
  })
  .strict();

export type CreateArchiveDocumentRequest = z.infer<typeof createArchiveDocumentRequestSchema>;

export const archiveInspectionFormRequestSchema = z.strictObject(z
  .strictObject({
    inspectionId: z.uuid(),
    farmId: z.uuid(),
    archiveLocation: archiveLocationSchema.optional(),
  }).shape);

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
