/**
 * Passport Domain Service
 *
 * Orchestrates: validate → state machine → delegate to repository → return Result.
 */

import { PASSPORT_STATUS, STATE_CODE } from "@rocky/database/constants";
import { type Result, fromAsyncThrowable, toAppError } from "@rocky/domains-shared";
import { PassportError, PASSPORT_ERRORS } from "../errors/passport.errors.js";
import type { PassportRepository } from "../repositories/passport.repository.js";
import type { AnimalRepository } from "@rocky/domains-animal";

/** Valid state transitions for the passport lifecycle */
const VALID_TRANSITIONS: Record<string, string[]> = {
  [PASSPORT_STATUS.ISSUED]: [PASSPORT_STATUS.ACTIVE, "cancelled"],
  [PASSPORT_STATUS.ACTIVE]: [PASSPORT_STATUS.SEIZED, "cancelled", "reprinted"],
  [PASSPORT_STATUS.SEIZED]: [PASSPORT_STATUS.ARCHIVED],
  [PASSPORT_STATUS.ARCHIVED]: [],
};

export class PassportService {
  constructor(
    private readonly repo: PassportRepository,
    private readonly animalRepo: AnimalRepository,
  ) {}

  // ── CRUD ──

  async getById(id: string) {
    return fromAsyncThrowable(async () => {
      const passport = await this.repo.findById(id);
      if (!passport) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id });
      return passport;
    }, toAppError)();
  }

  async list(input: { farmId?: string; status?: string; limit: number; offset: number }) {
    return fromAsyncThrowable(async () => {
      if (input.farmId) {
        return this.repo.findByFarmId(input.farmId, input);
      }
      return this.repo.findSeized(input);
    }, toAppError)();
  }

  // ── Lifecycle Methods ──

  /**
   * Rule 1: Issue passport for an error-free registered animal.
   * Creates an ISSUED passport. Only one active passport per animal.
   */
  async issueForAnimal(input: { animalId: string; farmId: string; createdBy?: string }) {
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
        createdBy: input.createdBy,
      });

      if (!passport) throw new PassportError(PASSPORT_ERRORS.INVALID_INPUT, { reason: "Failed to create passport" });
      return passport;
    }, toAppError)();
  }

  /**
   * Rule 3: Ship passport to VS.
   * ISSUED → ACTIVE (after delivery to keeper)
   */
  async shipToVs(passportId: string) {
    return fromAsyncThrowable(async () => {
      const passport = await this.repo.findById(passportId);
      if (!passport) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id: passportId });
      this.validateTransition(passport.status, PASSPORT_STATUS.ACTIVE);

      return this.repo.shipToVs(passportId);
    }, toAppError)();
  }

  /**
   * Rule 4: VS delivers passport to keeper.
   * Completes the ISSUED → ACTIVE transition.
   */
  async deliverToKeeper(passportId: string) {
    return fromAsyncThrowable(async () => {
      const passport = await this.repo.findById(passportId);
      if (!passport) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id: passportId });
      this.validateTransition(passport.status, PASSPORT_STATUS.ACTIVE);

      return this.repo.deliverToKeeper(passportId);
    }, toAppError)();
  }

  /**
   * Rules 5-6: Seize passport on death/slaughter.
   * ACTIVE → SEIZED. Records death date and cause.
   */
  async seize(passportId: string, deathDate: string, deathCause?: string) {
    return fromAsyncThrowable(async () => {
      const passport = await this.repo.findById(passportId);
      if (!passport) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id: passportId });
      if (passport.status === PASSPORT_STATUS.SEIZED) {
        throw new PassportError(PASSPORT_ERRORS.ALREADY_SEIZED, { id: passportId });
      }
      this.validateTransition(passport.status, PASSPORT_STATUS.SEIZED);

      return this.repo.seize(passportId, deathDate, deathCause);
    }, toAppError)();
  }

  /**
   * Rule 8: Reprint passport after error correction.
   * ACTIVE → REPRINTED (old invalidated, new ACTIVE created).
   */
  async reprint(originalPassportId: string) {
    return fromAsyncThrowable(async () => {
      const original = await this.repo.findById(originalPassportId);
      if (!original) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id: originalPassportId });
      this.validateTransition(original.status, "reprinted");

      // Invalidate original
      await this.repo.updateStatus(originalPassportId, "reprinted");

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
      return newPassport;
    }, toAppError)();
  }

  /**
   * Rule 7: Archive seized passport after 3-year retention.
   * SEIZED → ARCHIVED.
   */
  async archive(passportId: string) {
    return fromAsyncThrowable(async () => {
      const passport = await this.repo.findById(passportId);
      if (!passport) throw new PassportError(PASSPORT_ERRORS.NOT_FOUND, { id: passportId });
      this.validateTransition(passport.status, PASSPORT_STATUS.ARCHIVED);

      return this.repo.archive(passportId);
    }, toAppError)();
  }

  // ── State Machine ──

  private validateTransition(currentStatus: string, targetStatus: string) {
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new PassportError(PASSPORT_ERRORS.INVALID_STATUS_TRANSITION, {
        currentStatus,
        targetStatus,
      });
    }
  }
}
