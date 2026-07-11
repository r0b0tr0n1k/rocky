/**
 * Archive Service
 *
 * @description Business logic for archive domain — CRUD, retention enforcement, inspection form archival.
 */

import { ok, err, fromAsyncThrowable, toAppError, type Result } from "@rocky/domains-shared";
import type { ArchiveRepository } from "../repositories/archive.repository.js";
import { ArchiveError, ARCHIVE_ERRORS } from "../errors/archive.errors.js";
import { ARCHIVE_DOCUMENT_TYPE, ARCHIVE_LOCATION } from "@rocky/database/constants";
import type { SystemService, RuleSetRetention } from "@rocky/domains-system";
import {
  archiveDocumentResponseSchema,
  type ArchiveDocumentResponse,
  type CreateArchiveDocumentRequest,
  type ArchiveInspectionFormRequest,
} from "@rocky/validators/api";

export type { ArchiveError, ArchiveErrorCode } from "../errors/archive.errors.js";

export class ArchiveService {
  constructor(
    private readonly repo: ArchiveRepository,
    private readonly system: SystemService,
  ) {}

  /** Retention years for an archive tier, from the RuleSet (ADR-0030 WO-014). Default 3. */
  private async retentionYearsFor(location: string): Promise<number> {
    try {
      const rs = await this.system.getRuleSet();
      if (rs.isOk()) {
        const years = rs.value.retention[location.toLowerCase() as keyof RuleSetRetention];
        if (typeof years === "number") return years;
      }
    } catch {
      // fall through to default
    }
    return 3;
  }

  // ── CRUD ──

  async getById(id: string): Promise<Result<ArchiveDocumentResponse, Error>> {
    const doc = await this.repo.findById(id);
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.NOT_FOUND, { documentId: id }));
    return ok(archiveDocumentResponseSchema.parse(doc));
  }

  async list(input: { documentType?: string; archiveLocation?: string; farmId?: string; isArchived?: boolean; search?: string; limit: number; offset: number }): Promise<Result<{ data: ArchiveDocumentResponse[]; total: number; limit: number; offset: number }, Error>> {
    const { data, total } = await this.repo.list(input);
    return ok({ data: data.map((d: unknown) => archiveDocumentResponseSchema.parse(d)), total, limit: input.limit, offset: input.offset });
  }

  async create(input: CreateArchiveDocumentRequest): Promise<Result<ArchiveDocumentResponse, Error>> {
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
      isArchived: false,
    });
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.INVALID_INPUT));
    return ok(archiveDocumentResponseSchema.parse(doc));
  }

  async markArchived(id: string): Promise<Result<ArchiveDocumentResponse, Error>> {
    const doc = await this.repo.findById(id);
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.NOT_FOUND, { documentId: id }));
    if (doc.isArchived) return err(new ArchiveError(ARCHIVE_ERRORS.ALREADY_ARCHIVED, { documentId: id }));

    const updated = await this.repo.markArchived(id);
    if (!updated) return err(new ArchiveError(ARCHIVE_ERRORS.NOT_FOUND, { documentId: id }));
    return ok(archiveDocumentResponseSchema.parse(updated));
  }

  async markDestroyed(id: string): Promise<Result<ArchiveDocumentResponse, Error>> {
    const doc = await this.repo.findById(id);
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.NOT_FOUND, { documentId: id }));

    const updated = await this.repo.markDestroyed(id);
    if (!updated) return err(new ArchiveError(ARCHIVE_ERRORS.NOT_FOUND, { documentId: id }));
    return ok(archiveDocumentResponseSchema.parse(updated));
  }

  // ── Retention Enforcement ──

  /** Find documents past retention that haven't been destroyed yet */
  async findExpiredRetention(limit = 100): Promise<Result<ArchiveDocumentResponse[], Error>> {
    const expiredDocs = await this.repo.findExpiredRetention(limit);
    return ok(expiredDocs.map((d: unknown) => archiveDocumentResponseSchema.parse(d)));
  }

  // ── Inspection Form Integration ──

  /** Archive an inspection form on completion — creates archive_documents entry with 3-year retention */
  async archiveInspectionForm(input: ArchiveInspectionFormRequest): Promise<Result<ArchiveDocumentResponse, Error>> {
    // Check if already archived
    const existing = await this.repo.findByInspectionId(input.inspectionId);
    if (existing) return ok(archiveDocumentResponseSchema.parse(existing)); // Already archived, return existing entry

    const years = await this.retentionYearsFor(input.archiveLocation ?? ARCHIVE_LOCATION.VI);
    const retentionExpiry = new Date();
    retentionExpiry.setFullYear(retentionExpiry.getFullYear() + years);

    const doc = await this.repo.create({
      documentType: ARCHIVE_DOCUMENT_TYPE.INSPECTION_FORM,
      archiveLocation: input.archiveLocation ?? ARCHIVE_LOCATION.VI,
      inspectionId: input.inspectionId,
      farmId: input.farmId,
      retentionExpiry: retentionExpiry.toISOString().split("T")[0]!,
      isArchived: false,
    });
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.INVALID_INPUT));
    return ok(archiveDocumentResponseSchema.parse(doc));
  }

  // ── Passport Seizure Integration ──

  /** Archive a seized passport — creates archive_documents entry at CPC with 3-year retention */
  async archiveSeizedPassport(input: {
    passportId: string;
    animalId: string;
    farmId: string;
    createdBy?: string;
  }): Promise<Result<ArchiveDocumentResponse, Error>> {
    // Idempotent: check if already archived
    const existing = await this.repo.findByPassportId(input.passportId);
    if (existing) return ok(archiveDocumentResponseSchema.parse(existing));

    const years = await this.retentionYearsFor(ARCHIVE_LOCATION.CPC);
    const retentionExpiry = new Date();
    retentionExpiry.setFullYear(retentionExpiry.getFullYear() + years);

    const doc = await this.repo.create({
      documentType: ARCHIVE_DOCUMENT_TYPE.PASSPORT,
      archiveLocation: ARCHIVE_LOCATION.CPC,
      passportId: input.passportId,
      animalId: input.animalId,
      farmId: input.farmId,
      retentionExpiry: retentionExpiry.toISOString().split("T")[0]!,
      isArchived: false,
    });
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.INVALID_INPUT));
    return ok(archiveDocumentResponseSchema.parse(doc));
  }

  // ── Error Correction Integration (Phase 3.3) ──

  /** Archive a resolved error correction — creates archive_documents entry with 3-year retention */
  async archiveErrorCorrection(input: {
    correctionId: string;
    animalId?: string;
    farmId?: string;
    passportId?: string;
    createdBy?: string;
  }): Promise<Result<ArchiveDocumentResponse, Error>> {
    // Idempotent: check if already archived by looking for correctionId in documentRef
    const existing = await this.repo.findByDocumentRef(input.correctionId);
    if (existing) return ok(archiveDocumentResponseSchema.parse(existing));

    const years = await this.retentionYearsFor(ARCHIVE_LOCATION.CPC);
    const retentionExpiry = new Date();
    retentionExpiry.setFullYear(retentionExpiry.getFullYear() + years);

    const doc = await this.repo.create({
      documentType: ARCHIVE_DOCUMENT_TYPE.OTHER,
      documentRef: input.correctionId,
      archiveLocation: ARCHIVE_LOCATION.CPC,
      animalId: input.animalId ?? undefined,
      farmId: input.farmId ?? undefined,
      passportId: input.passportId ?? undefined,
      retentionExpiry: retentionExpiry.toISOString().split("T")[0]!,
      isArchived: false,
    });
    if (!doc) return err(new ArchiveError(ARCHIVE_ERRORS.INVALID_INPUT));
    return ok(archiveDocumentResponseSchema.parse(doc));
  }
}
