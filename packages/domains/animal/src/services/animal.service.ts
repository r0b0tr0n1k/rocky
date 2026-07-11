/**
 * Animal Domain Service
 *
 * Orchestrates: validate → delegate to repository → return Result.
 */

import { ANIMAL_STATUS, OUTBOX_AGGREGATE_TYPE, STATE_CODE } from "@rocky/database/constants";
import { fromAsyncThrowable, type Result, toAppError } from "@rocky/domains-shared";
import type { OutboxEventPublisher } from "@rocky/execution";
import type {
  AnimalListRequest,
  AnimalListResponse,
  AnimalResponse,
  CreateAnimalRequest,
  UpdateAnimalRequest,
} from "@rocky/validators/api";
import { animalResponseSchema, animalSummarySchema } from "@rocky/validators/api";
import { ANIMAL_ERRORS, AnimalError } from "../errors/animal.errors.js";
import type { SystemService } from "@rocky/domains-system";
import type { AnimalRepository } from "../repositories/animal.repository.js";
import { randomUUID } from "node:crypto";

/** System parameters for registration validation */

function monthsBetween(d1: Date, d2: Date): number {
  const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  return months;
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export class AnimalService {
  constructor(
    private readonly repo: AnimalRepository,
    private readonly system: SystemService,
    private readonly outboxPublisher?: OutboxEventPublisher,
  ) {}

  async getById(id: string): Promise<Result<AnimalResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const animal = await this.repo.findById(id);
      if (!animal) throw new AnimalError(ANIMAL_ERRORS.NOT_FOUND, { id });
      return animalResponseSchema.parse(animal);
    }, toAppError)();
  }

  async list(input: AnimalListRequest): Promise<Result<AnimalListResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const { data, total } = await this.repo.listFiltered(input);
      return {
        data: data.map((d: unknown) => animalSummarySchema.parse(d)),
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }, toAppError)();
  }

  async create(input: CreateAnimalRequest & { createdBy?: string }): Promise<Result<AnimalResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // ── Rule A.3: Ear tag must be NEW (not previously applied) ──
      const existingTag = await this.repo.findByTag(input.earTagNumber, input.stateCode ?? STATE_CODE.MK);
      if (existingTag) {
        throw new AnimalError(ANIMAL_ERRORS.EAR_TAG_ALREADY_USED, {
          earTagNumber: input.earTagNumber,
          stateCode: input.stateCode,
        });
      }

      // ── Pre-generate animal ID for self-reference guard ──
      const animalId = randomUUID();

      // Rule A.4e: Animal cannot be its own mother
      if (input.motherId && input.motherId === animalId) {
        throw new AnimalError(ANIMAL_ERRORS.SELF_MOTHER, { motherId: input.motherId });
      }

      // ── Mother checks (Rules A.4a–A.4d) ──
      if (input.motherId) {
        const mother = await this.repo.findById(input.motherId);
        if (!mother) {
          throw new AnimalError(ANIMAL_ERRORS.NOT_FOUND, { id: input.motherId, context: "mother" });
        }

        // Rule A.4a: Mother must be on the farm at time of birth
        if (mother.currentFarmId !== input.currentFarmId) {
          throw new AnimalError(ANIMAL_ERRORS.MOTHER_NOT_ON_FARM, {
            motherId: input.motherId,
            motherFarmId: mother.currentFarmId,
            birthFarmId: input.currentFarmId,
          });
        }

        // Rule A.4b: Mother must be alive at time of birth
        if (mother.status !== ANIMAL_STATUS.ALIVE) {
          throw new AnimalError(ANIMAL_ERRORS.MOTHER_NOT_ALIVE, {
            motherId: input.motherId,
            motherStatus: mother.status,
          });
        }

        const ruleSet = await this.system.getRuleSet();
        if (ruleSet.isErr()) throw ruleSet.error;
        const { thresholds } = ruleSet.value;

        // Rule A.4c: Mother must be >= minMotherAgeMonths old at birth
        const birthDate = new Date(input.birthDate);
        const motherBirthDate = new Date(mother.birthDate);
        const motherAgeMonths = monthsBetween(motherBirthDate, birthDate);
        if (motherAgeMonths < thresholds.minMotherAgeMonths) {
          throw new AnimalError(ANIMAL_ERRORS.MOTHER_TOO_YOUNG, {
            motherId: input.motherId,
            motherAgeMonths,
            requiredMonths: thresholds.minMotherAgeMonths,
          });
        }

        // Rule A.4d: Calving gap >= calvingPeriodDays since mother's last calf
        const lastCalf = await this.repo.findLastCalfByMother(input.motherId);
        if (lastCalf) {
          const lastCalfDate = new Date(lastCalf.birthDate);
          const gapDays = daysBetween(lastCalfDate, birthDate);
          if (gapDays < thresholds.calvingPeriodDays) {
            throw new AnimalError(ANIMAL_ERRORS.INVALID_CALVING_GAP, {
              motherId: input.motherId,
              lastCalfDate: lastCalf.birthDate,
              gapDays,
              requiredDays: thresholds.calvingPeriodDays,
            });
          }
        }
      }

      // ── Rule A.5: Parent sex validation ──
      if (input.motherId) {
        const mother = await this.repo.findById(input.motherId);
        if (mother && mother.sex !== "female") {
          throw new AnimalError(ANIMAL_ERRORS.INVALID_PARENT_SEX, {
            parentId: input.motherId,
            parentType: "mother",
            actualSex: mother.sex,
            expectedSex: "female",
          });
        }
      }
      if (input.fatherId) {
        const father = await this.repo.findById(input.fatherId);
        if (father && father.sex !== "male") {
          throw new AnimalError(ANIMAL_ERRORS.INVALID_PARENT_SEX, {
            parentId: input.fatherId,
            parentType: "father",
            actualSex: father.sex,
            expectedSex: "male",
          });
        }
      }

      const animal = await this.repo.insert({
        ...input,
        id: animalId,
        createdBy: input.createdBy,
      } as typeof import("@rocky/database").animals.$inferInsert);

      if (!animal) {
        throw new AnimalError(ANIMAL_ERRORS.INVALID_INPUT, { reason: "Failed to create animal record" });
      }

      if (this.outboxPublisher) {
        await this.outboxPublisher.publish({
          type: "animal_registered",
          aggregateType: OUTBOX_AGGREGATE_TYPE.ANIMAL,
          aggregateId: animal.id,
          payload: {
            animalId: animal.id,
            farmId: input.currentFarmId,
            earTagNumber: input.earTagNumber,
            birthDate: input.birthDate,
            sex: animal.sex,
            stateCode: input.stateCode,
            motherId: input.motherId,
            fatherId: input.fatherId,
            createdBy: input.createdBy,
          },
          createdBy: input.createdBy,
        });
      }

      return animalResponseSchema.parse(animal);
    }, toAppError)();
  }

  async update(id: string, input: UpdateAnimalRequest): Promise<Result<AnimalResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // Rule A.4e: Animal cannot be its own mother
      if (input.motherId && input.motherId === id) {
        throw new AnimalError(ANIMAL_ERRORS.SELF_MOTHER, { motherId: input.motherId });
      }

      // Mother validation if motherId is being changed
      if (input.motherId) {
        const mother = await this.repo.findById(input.motherId);
        if (!mother) {
          throw new AnimalError(ANIMAL_ERRORS.NOT_FOUND, { id: input.motherId, context: "mother" });
        }
        // Mother must be alive
        if (mother.status !== ANIMAL_STATUS.ALIVE) {
          throw new AnimalError(ANIMAL_ERRORS.MOTHER_NOT_ALIVE, {
            motherId: input.motherId,
            motherStatus: mother.status,
          });
        }
        // Mother sex check
        if (mother.sex !== "female") {
          throw new AnimalError(ANIMAL_ERRORS.INVALID_PARENT_SEX, {
            parentId: input.motherId,
            parentType: "mother",
            actualSex: mother.sex,
            expectedSex: "female",
          });
        }
      }

      const animal = await this.repo.update(
        id,
        input as Partial<typeof import("@rocky/database").animals.$inferInsert>,
      );
      if (!animal) throw new AnimalError(ANIMAL_ERRORS.NOT_FOUND, { id });
      return animalResponseSchema.parse(animal);
    }, toAppError)();
  }

  async findByTag(earTag: string, stateCode = STATE_CODE.MK): Promise<Result<AnimalResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const animal = await this.repo.findByTag(earTag, stateCode);
      if (!animal) throw new AnimalError(ANIMAL_ERRORS.NOT_FOUND, { earTag, stateCode });
      return animalResponseSchema.parse(animal);
    }, toAppError)();
  }

  /**
   * WO-022 — Enforce birth-notification tagging deadlines (TRACES / AHL 2016/429).
   * Any PENDING notification past its taggingDeadline is transitioned to OVERDUE and a
   * birth_notification.overdue outbox event is published per affected farm. The farm lock
   * itself is enforced derivatively in MovementService (no outgoing movement while OVERDUE births exist).
   */
  async enforceBirthDeadlines(): Promise<Result<{ overdueCount: number }, Error>> {
    return fromAsyncThrowable(async () => {
      const overdue = await this.repo.findOverduePendingBirthNotifications();
      if (overdue.length === 0) return { overdueCount: 0 };
      await this.repo.markBirthNotificationsOverdue(overdue.map((b) => b.id));
      for (const b of overdue) {
        await this.outboxPublisher?.publish({
          type: "birth_notification.overdue",
          aggregateType: "birth_notification",
          aggregateId: b.id,
          payload: { farmId: b.farmId, taggingDeadline: b.taggingDeadline },
          createdBy: "system",
        });
      }
      return { overdueCount: overdue.length };
    }, toAppError)();
  }
}
