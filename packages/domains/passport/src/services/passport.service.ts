/**
 * Passport Domain Service
 *
 * Orchestrates: validate → state machine → delegate to repository → return Result.
 */

import { PASSPORT_STATUS, STATE_CODE } from "@rocky/database/constants";
import type { AnimalRepository } from "@rocky/domains-animal";
import { fromAsyncThrowable, toAppError, type Result } from "@rocky/domains-shared";
import { passportResponseSchema, type PassportResponse } from "@rocky/validators/api";
import { PASSPORT_ERRORS, PassportError } from "../errors/passport.errors.js";
import type { PassportRepository } from "../repositories/passport.repository.js";

/** Valid state transitions for the passport lifecycle */
const VALID_TRANSITIONS: Record<string, string[]> = {
  [PASSPORT_STATUS.ISSUED]: [PASSPORT_STATUS.ACTIVE, PASSPORT_STATUS.CANCELLED],
  [PASSPORT_STATUS.ACTIVE]: [PASSPORT_STATUS.SEIZED, PASSPORT_STATUS.CANCELLED, PASSPORT_STATUS.REPRINTED],
  [PASSPORT_STATUS.SEIZED]: [PASSPORT_STATUS.ARCHIVED],
  [PASSPORT_STATUS.ARCHIVED]: [],
  [PASSPORT_STATUS.REPRINTED]: [PASSPORT_STATUS.CANCELLED],
};

export class PassportService {
  constructor(
    private readonly repo: PassportRepository,
    private readonly animalRepo: AnimalRepository,
  ) { }

  // ── CRUD ──

  async getById(id: string): Promise<Result<PassportResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const passport = await this.repo.findById(id);
      if (!passport) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id });
      return passportResponseSchema.parse(passport);
    }, toAppError)();
  }

  async list(input: { farmId?: string; status?: string; limit: number; offset: number }): Promise<Result<{ data: PassportResponse[]; total: number; limit: number; offset: number }, Error>> {
    return fromAsyncThrowable(async () => {
      if (input.farmId) {
        const { data, total } = await this.repo.findByFarmId(input.farmId, input);
        return { data: data.map((d: unknown) => passportResponseSchema.parse(d)), total, limit: input.limit, offset: input.offset };
      }
      const { data, total } = await this.repo.findSeized(input);
      return { data: data.map((d: unknown) => passportResponseSchema.parse(d)), total, limit: input.limit, offset: input.offset };
    }, toAppError)();
  }

  // ── Lifecycle Methods ──

  /**
   * Rule 1: Issue passport for an error-free registered animal.
   * Creates an ISSUED passport. Only one active passport per animal.
   */
  async issueForAnimal(input: { animalId: string; farmId: string; createdBy?: string }): Promise<Result<PassportResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // Verify animal exists
      const animal = await this.animalRepo.findById(input.animalId);
      if (!animal) {
        throw new PassportError(PASSPORT_ERRORS.ANIMAL_NOT_FOUND, { animalId: input.animalId });
      }

      // Check no existing active passport for this animal
      const existing = await this.repo.findByAnimalId(input.animalId);
      if (existing) {
        throw new PassportError(PASSPORT_ERRORS.PASSPORT_EXISTS, {
          animalId: input.animalId,
          existingPassportId: existing.id,
        });
      }

      // Generate passport number: MK-YYYY-XXXXX
      const year = new Date().getFullYear();
      const seq = String(Math.floor(Math.random() * 99999)).padStart(5, "0");
      const passportNumber = `MK-${year}-${seq}`;

      const passport = await this.repo.create({
        passportNumber,
        stateCode: STATE_CODE.MK,
        animalId: input.animalId,
        farmId: input.farmId,
        status: PASSPORT_STATUS.ISSUED,
        issueDate: new Date().toISOString().split("T")[0],
      });

      if (!passport) throw new PassportError(PASSPORT_ERRORS.INVALID_INPUT, { reason: "Failed to create passport" });
      return passportResponseSchema.parse(passport);
    }, toAppError)();
  }

  /**
   * Rule 3: Ship passport to VS.
   * ISSUED → ACTIVE (after delivery to keeper)
   */
  async shipToVs(passportId: string): Promise<Result<PassportResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const passport = await this.repo.findById(passportId);
      if (!passport) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id: passportId });
      this.validateTransition(passport.status, PASSPORT_STATUS.ACTIVE);

      const updated = await this.repo.shipToVs(passportId);
      return passportResponseSchema.parse(updated);
    }, toAppError)();
  }

  /**
   * Rule 4: VS delivers passport to keeper.
   * Completes the ISSUED → ACTIVE transition.
   */
  async deliverToKeeper(passportId: string): Promise<Result<PassportResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const passport = await this.repo.findById(passportId);
      if (!passport) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id: passportId });
      this.validateTransition(passport.status, PASSPORT_STATUS.ACTIVE);

      const updated = await this.repo.deliverToKeeper(passportId);
      return passportResponseSchema.parse(updated);
    }, toAppError)();
  }

  /**
   * Rules 5-6: Seize passport on death/slaughter.
   * ACTIVE → SEIZED. Records death date and cause.
   */
  async seize(passportId: string, deathDate: string, deathCause?: string): Promise<Result<PassportResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const passport = await this.repo.findById(passportId);
      if (!passport) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id: passportId });

      // P1: Idempotent — already seized is a no-op skip, not an error
      if (passport.status === PASSPORT_STATUS.SEIZED) {
        return passportResponseSchema.parse(passport);
      }
      this.validateTransition(passport.status, PASSPORT_STATUS.SEIZED);

      const updated = await this.repo.seize(passportId, deathDate, deathCause);
      return passportResponseSchema.parse(updated);
    }, toAppError)();
  }

  /**
   * Rule 8: Reprint passport after error correction.
   * ACTIVE → REPRINTED (old invalidated, new ACTIVE created).
   */
  async reprint(originalPassportId: string): Promise<Result<PassportResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const original = await this.repo.findById(originalPassportId);
      if (!original) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id: originalPassportId });
      this.validateTransition(original.status, PASSPORT_STATUS.REPRINTED);

      // Invalidate original
      await this.repo.updateStatus(originalPassportId, PASSPORT_STATUS.REPRINTED);

      // Create new passport
      const year = new Date().getFullYear();
      const seq = String(Math.floor(Math.random() * 99999)).padStart(5, "0");
      const passportNumber = `MK-${year}-${seq}`;

      const newPassport = await this.repo.create({
        passportNumber,
        stateCode: original.stateCode,
        animalId: original.animalId,
        farmId: original.farmId,
        status: PASSPORT_STATUS.ACTIVE,
        issueDate: new Date().toISOString().split("T")[0],
        isReprint: true,
        originalPassportId,
      });

      if (!newPassport) throw new PassportError(PASSPORT_ERRORS.INVALID_INPUT, { reason: "Failed to create reprint" });
      return passportResponseSchema.parse(newPassport);
    }, toAppError)();
  }

  /**
   * Rule 7: Archive seized passport after 3-year retention.
   * SEIZED → ARCHIVED.
   */
  async archive(passportId: string): Promise<Result<PassportResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const passport = await this.repo.findById(passportId);
      if (!passport) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id: passportId });
      this.validateTransition(passport.status, PASSPORT_STATUS.ARCHIVED);

      const updated = await this.repo.archive(passportId);
      return passportResponseSchema.parse(updated);
    }, toAppError)();
  }

  // ── State Machine ──

  private validateTransition(currentStatus: string, targetStatus: string) {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed?.includes(targetStatus)) {
      throw new PassportError(PASSPORT_ERRORS.INVALID_STATUS_TRANSITION, {
        currentStatus,
        targetStatus,
      });
    }
  }
}
