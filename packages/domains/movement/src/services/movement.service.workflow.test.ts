import { describe, expect, it, vi, beforeEach } from "vitest";
import { ok } from "neverthrow";
import { MovementService } from "./movement.service.js";
import type { MovementRepository } from "../repositories/movement.repository.js";
import type { AnimalRepository } from "@rocky/domains-animal";
import type { SystemService } from "@rocky/domains-system";
import { MovementFactory } from "@rocky/testing";
import { movementResponseSchema } from "@rocky/validators/api";
import { MovementError, MOVEMENT_ERRORS } from "../errors/movement.errors.js";
import { ANIMAL_STATUS, MOVEMENT_TYPE } from "@rocky/database/constants";

/**
 * WO-030 workflow test — pure unit test (Scenario B): mock the repository,
 * animal repo and SystemService, drive death/slaughter events with
 * `MovementFactory`, assert on `Result`, and re-parse with the integration
 * `movementResponseSchema`. No DB. The workflow rules exercised here are the
 * animal ALIVE guard and the RuleSet-driven age thresholds.
 */
describe("MovementService — death/slaughter events (workflow)", () => {
  const animalId = "99999999-9999-4999-8999-999999999999";
  const farmId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
  const slaughterhouseId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
  let service: MovementService;
  let repo: MovementRepository;
  let animalRepo: AnimalRepository;
  const ruleSet = {
    jurisdiction: "MK",
    thresholds: {
      stillbornThresholdDays: 25,
      slaughterMinAgeDays: 25,
      arrivalCorrectionDays: 2,
      minVaccinationAgeDays: 30,
      minMotherAgeMonths: 17,
      calvingPeriodDays: 365,
    },
    weights: { farmSize: 0.3, history: 0.3, species: 0.2, region: 0.2, selectionPercentage: 10 },
  };

  beforeEach(() => {
    repo = {
      findActivePastureDeclaration: vi.fn().mockResolvedValue(null),
      deactivatePastureDeclaration: vi.fn(),
      insert: vi.fn(),
    } as unknown as MovementRepository;
    animalRepo = {
      findById: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as AnimalRepository;
    const system = { getRuleSet: vi.fn().mockResolvedValue(ok(ruleSet)) } as unknown as SystemService;
    service = new MovementService(repo, animalRepo, system);
  });

  describe("recordDeath", () => {
    it("records death for an ALIVE animal past the stillborn threshold", async () => {
      animalRepo.findById = vi.fn().mockResolvedValue({ id: animalId, status: ANIMAL_STATUS.ALIVE, birthDate: "2020-01-01" });
      repo.insert = vi.fn().mockResolvedValue(new MovementFactory(animalId, farmId).createDeath({ id: animalId }));

      const res = await service.recordDeath({ animalId, farmId, deathDate: "2026-07-01", deathCause: "illness" });

      expect(res.isOk()).toBe(true);
      if (res.isOk()) {
        expect(res.value.type).toBe(MOVEMENT_TYPE.DEATH);
        expect(() => movementResponseSchema.parse(res.value)).not.toThrow();
      }
    });

    it("rejects death of a non-ALIVE animal", async () => {
      animalRepo.findById = vi.fn().mockResolvedValue({ id: animalId, status: ANIMAL_STATUS.DEAD, birthDate: "2020-01-01" });

      const res = await service.recordDeath({ animalId, farmId, deathDate: "2026-07-01", deathCause: "illness" });

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(MovementError);
        expect(res.error.code).toBe(MOVEMENT_ERRORS.ANIMAL_NOT_ALIVE);
      }
    });
  });

  describe("recordSlaughter", () => {
    it("rejects slaughter of an animal below the minimum age", async () => {
      animalRepo.findById = vi.fn().mockResolvedValue({ id: animalId, status: ANIMAL_STATUS.ALIVE, birthDate: "2026-06-20" });

      const res = await service.recordSlaughter({ animalId, fromFarmId: farmId, slaughterhouseId, slaughterDate: "2026-07-09" });

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(MovementError);
        expect(res.error.code).toBe(MOVEMENT_ERRORS.SLAUGHTER_MIN_AGE);
      }
    });

    it("records slaughter for an ALIVE animal of sufficient age", async () => {
      animalRepo.findById = vi.fn().mockResolvedValue({ id: animalId, status: ANIMAL_STATUS.ALIVE, birthDate: "2020-01-01" });
      repo.insert = vi.fn().mockResolvedValue(
        new MovementFactory(animalId, farmId).createSlaughter({ id: animalId, fromFarmId: farmId, toFarmId: slaughterhouseId }),
      );

      const res = await service.recordSlaughter({ animalId, fromFarmId: farmId, slaughterhouseId, slaughterDate: "2026-07-01" });

      expect(res.isOk()).toBe(true);
      if (res.isOk()) expect(res.value.type).toBe(MOVEMENT_TYPE.SLAUGHTERHOUSE);
    });
  });
});
