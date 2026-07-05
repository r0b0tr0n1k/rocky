/**
 * Correction Domain Service
 *
 * Orchestrates: validate → state machine → delegate to repository → return Result.
 */

import { CORRECTION_STATUS } from "@rocky/database/constants";
import { fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { CorrectionError, CORRECTION_ERRORS } from "../errors/correction.errors.js";
import type { CorrectionRepository } from "../repositories/correction.repository.js";

interface ArchiveServiceLike {
  archiveErrorCorrection(input: {
    correctionId: string;
    animalId?: string;
    farmId?: string;
    passportId?: string;
    createdBy?: string;
  }): Promise<any>;
}

interface PassportServiceLike {
  reprint(originalPassportId: string): Promise<any>;
}

/** Valid state transitions */
const VALID_TRANSITIONS: Record<string, string[]> = {
  [CORRECTION_STATUS.PENDING]: [CORRECTION_STATUS.UNDER_REVIEW, CORRECTION_STATUS.REJECTED],
  [CORRECTION_STATUS.UNDER_REVIEW]: [CORRECTION_STATUS.RESOLVED, CORRECTION_STATUS.ESCALATED, CORRECTION_STATUS.REJECTED],
  [CORRECTION_STATUS.RESOLVED]: [],
  [CORRECTION_STATUS.ESCALATED]: [CORRECTION_STATUS.UNDER_REVIEW, CORRECTION_STATUS.RESOLVED],
  [CORRECTION_STATUS.REJECTED]: [CORRECTION_STATUS.PENDING],
};

export class CorrectionService {
  constructor(
    private readonly repo: CorrectionRepository,
    private readonly archiveService?: ArchiveServiceLike,
    private readonly passportService?: PassportServiceLike,
  ) {}

  async getById(id: string) {
    return fromAsyncThrowable(async () => {
      const correction = await this.repo.findById(id);
      if (!correction) throw new CorrectionError(CORRECTION_ERRORS.NOT_FOUND, { id });
      return correction;
    }, toAppError)();
  }

  async list(input: { farmId?: string; animalId?: string; status?: string; detectionSource?: string; limit: number; offset: number }) {
    return fromAsyncThrowable(async () => {
      return this.repo.listFiltered(input);
    }, toAppError)();
  }

  /**
   * Create a new error correction record.
   * Rule 1: Vet marks corrections on passport, sends to CPC.
   * Rule 5: A priori: PDA upload validated before insertion.
   */
  async create(input: {
    detectionSource: string;
    farmId?: string;
    animalId?: string;
    errorType: string;
    errorDescription: string;
    originalData?: unknown;
    correctedData?: unknown;
    caseType?: string;
    createdBy?: string;
  }) {
    return fromAsyncThrowable(async () => {
      const correction = await this.repo.create({
        detectionSource: input.detectionSource,
        farmId: input.farmId,
        animalId: input.animalId,
        errorType: input.errorType,
        errorDescription: input.errorDescription,
        originalData: input.originalData as any,
        correctedData: input.correctedData as any,
        status: CORRECTION_STATUS.PENDING,
        caseType: input.caseType as any,
        createdBy: input.createdBy,
      });
      if (!correction) throw new CorrectionError(CORRECTION_ERRORS.INVALID_INPUT, { reason: "Failed to create correction" });
      return correction;
    }, toAppError)();
  }

  /**
   * Move correction to under review.
   * Rule 2: CPC runs plausibility checks on new data.
   */
  async review(id: string) {
    return fromAsyncThrowable(async () => {
      const correction = await this.repo.findById(id);
      if (!correction) throw new CorrectionError(CORRECTION_ERRORS.NOT_FOUND, { id });
      this.validateTransition(correction.status, CORRECTION_STATUS.UNDER_REVIEW);
      return this.repo.updateStatus(id, CORRECTION_STATUS.UNDER_REVIEW);
    }, toAppError)();
  }

  /**
   * Rules 3, 7: If OK — corrections made, replacement passport printed.
   * Case A: Technician Resolvable — resolved and entered.
   */
  async resolve(id: string, input: { resolvedBy: string; resolutionNotes?: string }) {
    return fromAsyncThrowable(async () => {
      const correction = await this.repo.findById(id);
      if (!correction) throw new CorrectionError(CORRECTION_ERRORS.NOT_FOUND, { id });
      this.validateTransition(correction.status, CORRECTION_STATUS.RESOLVED);
      const result = await this.repo.updateStatus(id, CORRECTION_STATUS.RESOLVED, {
        resolvedBy: input.resolvedBy,
        resolutionNotes: input.resolutionNotes,
      });
      if (this.archiveService) {
        await this.archiveService.archiveErrorCorrection({
          correctionId: id,
          animalId: correction.animalId ?? undefined,
          farmId: correction.farmId ?? undefined,
          passportId: correction.passportId ?? undefined,
          createdBy: input.resolvedBy,
        });
      }
      if (this.passportService && correction.passportReprintRequired && correction.passportId) {
        await this.passportService.reprint(correction.passportId).catch(() => {});
      }
      return result;
    }, toAppError)();
  }

  /**
   * Rule 4: If NOT — communicated to VS to clarify.
   * Case C: Complex — handed to VI for on-spot control.
   */
  async escalate(id: string, input: { escalatedTo: string; reason?: string }) {
    return fromAsyncThrowable(async () => {
      const correction = await this.repo.findById(id);
      if (!correction) throw new CorrectionError(CORRECTION_ERRORS.NOT_FOUND, { id });
      this.validateTransition(correction.status, CORRECTION_STATUS.ESCALATED);
      return this.repo.escalate(id, input.escalatedTo, input.reason);
    }, toAppError)();
  }

  /**
   * Reject a correction (not valid or duplicate).
   */
  async reject(id: string) {
    return fromAsyncThrowable(async () => {
      const correction = await this.repo.findById(id);
      if (!correction) throw new CorrectionError(CORRECTION_ERRORS.NOT_FOUND, { id });
      this.validateTransition(correction.status, CORRECTION_STATUS.REJECTED);
      return this.repo.updateStatus(id, CORRECTION_STATUS.REJECTED);
    }, toAppError)();
  }

  private validateTransition(currentStatus: string, targetStatus: string) {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed?.includes(targetStatus)) {
      throw new CorrectionError(CORRECTION_ERRORS.INVALID_STATUS_TRANSITION, {
        currentStatus,
        targetStatus,
      });
    }
  }
}
