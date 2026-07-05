/**
 * Archive Service
 *
 * @description Business logic for archive domain — CRUD, retention enforcement, inspection form archival.
 */

import { ok, err, type Result } from "neverthrow";
import { ArchiveRepository } from "../repositories/archive.repository.js";
import { ArchiveError, ARCHIVE_ERRORS } from "../errors/archive.errors.js";
import { ARCHIVE_DOCUMENT_TYPE, ARCHIVE_LOCATION } from "@rocky/database/constants";

export type { ArchiveError, ArchiveErrorCode } from "../errors/archive.errors.js";

// ── Input types ──

export interface CreateArchiveDocumentInput {
  documentType: string;
  documentRef?: string | null;
  archiveLocation?: string;
  physicalLocation?: string | null;
  animalId?: string | null;
  farmId?: string | null;
  passportId?: string | null;
  inspectionId?: string | null;
  retentionExpiry: Date | string;
  createdBy?: string;
}

export interface ArchiveInspectionFormInput {
  inspectionId: string;
  farmId: string;
  archiveLocation?: string;
  createdBy?: string;
}

export class ArchiveService {
  constructor(
    private readonly repo: ArchiveRepository,
  ) {}

  // ── CRUD ──

  async getById(id: string) {
    const doc = await this.repo.findById(id);
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.NOT_FOUND, { documentId: id }));
    return ok(doc);
  }

  async list(input: { documentType?: string; archiveLocation?: string; farmId?: string; isArchived?: boolean; search?: string; limit: number; offset: number }) {
    return ok(await this.repo.list(input));
  }

  async create(input: CreateArchiveDocumentInput) {
    const doc = await this.repo.create({
      documentType: input.documentType,
      documentRef: input.documentRef ?? undefined,
      archiveLocation: input.archiveLocation ?? ARCHIVE_LOCATION.CPC,
      physicalLocation: input.physicalLocation ?? undefined,
      animalId: input.animalId ?? undefined,
      farmId: input.farmId ?? undefined,
      passportId: input.passportId ?? undefined,
      inspectionId: input.inspectionId ?? undefined,
      retentionExpiry: (input.retentionExpiry instanceof Date ? input.retentionExpiry : new Date(input.retentionExpiry)).toISOString().split("T")[0]!,
      createdBy: input.createdBy,
      isArchived: false,
    } as any);
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.INVALID_INPUT));
    return ok(doc);
  }

  async markArchived(id: string) {
    const doc = await this.repo.findById(id);
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.NOT_FOUND, { documentId: id }));
    if (doc.isArchived) return err(new ArchiveError(ARCHIVE_ERRORS.ALREADY_ARCHIVED, { documentId: id }));

    const updated = await this.repo.markArchived(id);
    if (!updated) return err(new ArchiveError(ARCHIVE_ERRORS.NOT_FOUND, { documentId: id }));
    return ok(updated);
  }

  async markDestroyed(id: string) {
    const doc = await this.repo.findById(id);
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.NOT_FOUND, { documentId: id }));

    const updated = await this.repo.markDestroyed(id);
    if (!updated) return err(new ArchiveError(ARCHIVE_ERRORS.NOT_FOUND, { documentId: id }));
    return ok(updated);
  }

  // ── Retention Enforcement ──

  /** Find documents past retention that haven't been destroyed yet */
  async findExpiredRetention(limit = 100) {
    return ok(await this.repo.findExpiredRetention(limit));
  }

  // ── Inspection Form Integration ──

  /** Archive an inspection form on completion — creates archive_documents entry with 3-year retention */
  async archiveInspectionForm(input: ArchiveInspectionFormInput) {
    // Check if already archived
    const existing = await this.repo.findByInspectionId(input.inspectionId);
    if (existing) return ok(existing); // Already archived, return existing entry

    const retentionExpiry = new Date();
    retentionExpiry.setFullYear(retentionExpiry.getFullYear() + 3);

    const doc = await this.repo.create({
      documentType: ARCHIVE_DOCUMENT_TYPE.INSPECTION_FORM,
      archiveLocation: input.archiveLocation ?? ARCHIVE_LOCATION.VI,
      inspectionId: input.inspectionId,
      farmId: input.farmId,
      retentionExpiry: retentionExpiry.toISOString().split("T")[0]!,
      createdBy: input.createdBy,
      isArchived: false,
    } as any);
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.INVALID_INPUT));
    return ok(doc);
  }

  // ── Passport Seizure Integration ──

  /** Archive a seized passport — creates archive_documents entry at CPC with 3-year retention */
  async archiveSeizedPassport(input: {
    passportId: string;
    animalId: string;
    farmId: string;
    createdBy?: string;
  }) {
    // Idempotent: check if already archived
    const existing = await this.repo.findByPassportId(input.passportId);
    if (existing) return ok(existing);

    const retentionExpiry = new Date();
    retentionExpiry.setFullYear(retentionExpiry.getFullYear() + 3);

    const doc = await this.repo.create({
      documentType: ARCHIVE_DOCUMENT_TYPE.PASSPORT,
      archiveLocation: ARCHIVE_LOCATION.CPC,
      passportId: input.passportId,
      animalId: input.animalId,
      farmId: input.farmId,
      retentionExpiry: retentionExpiry.toISOString().split("T")[0]!,
      createdBy: input.createdBy,
      isArchived: false,
    } as any);
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.INVALID_INPUT));
    return ok(doc);
  }

  // ── Error Correction Integration (Phase 3.3) ──

  /** Archive a resolved error correction — creates archive_documents entry with 3-year retention */
  async archiveErrorCorrection(input: {
    correctionId: string;
    animalId?: string;
    farmId?: string;
    passportId?: string;
    createdBy?: string;
  }) {
    // Idempotent: check if already archived by looking for correctionId in documentRef
    const existing = await this.repo.findByDocumentRef(input.correctionId);
    if (existing) return ok(existing);

    const retentionExpiry = new Date();
    retentionExpiry.setFullYear(retentionExpiry.getFullYear() + 3);

    const doc = await this.repo.create({
      documentType: "OTHER",
      documentRef: input.correctionId,
      archiveLocation: ARCHIVE_LOCATION.CPC,
      animalId: input.animalId ?? undefined,
      farmId: input.farmId ?? undefined,
      passportId: input.passportId ?? undefined,
      retentionExpiry: retentionExpiry.toISOString().split("T")[0]!,
      createdBy: input.createdBy,
      isArchived: false,
    } as any);
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.INVALID_INPUT));
    return ok(doc);
  }
}
