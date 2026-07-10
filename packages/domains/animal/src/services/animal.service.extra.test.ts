import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnimalService } from "./animal.service.js";
import type { AnimalRepository } from "../repositories/animal.repository.js";
import { ok } from "neverthrow";
import type { SystemService } from "@rocky/domains-system";
import { AnimalFactory } from "@rocky/testing";
import { ANIMAL_ERRORS } from "../errors/animal.errors.js";
import { ANIMAL_STATUS } from "@rocky/database/constants";

function makeRuleSet() {
  return ok({
    jurisdiction: "MK",
    thresholds: {
      orderIntervalDays: 120,
      maxOrdersPerYear: 4,
      minVaccinationAgeDays: 30,
      slaughterMinAgeDays: 25,
      stillbornThresholdDays: 25,
      arrivalCorrectionDays: 2,
      minMotherAgeMonths: 17,
      calvingPeriodDays: 365,
    },
    weights: { selectionPercentage: 10, farmSize: 0.3, history: 0.3, species: 0.2, region: 0.2 },
  });
}

function oldMother(factory: AnimalFactory) {
  const b = new Date();
  b.setFullYear(b.getFullYear() - 2); // > minMotherAgeMonths
  return factory.create({
    status: ANIMAL_STATUS.ALIVE,
    sex: "female",
    birthDate: b.toISOString().split("T")[0],
  });
}

describe("AnimalService — mother validation (factory + schema grounded)", () => {
  let mockRepo: AnimalRepository;
  let mockSystem: SystemService;
  let service: AnimalService;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByTag: vi.fn(),
      listFiltered: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      findLastCalfByMother: vi.fn(),
    } as unknown as AnimalRepository;
    mockSystem = { getRuleSet: vi.fn().mockResolvedValue(makeRuleSet()) } as unknown as SystemService;
    service = new AnimalService(mockRepo, mockSystem);
  });

  it("rejects a dead mother (MOTHER_NOT_ALIVE)", async () => {
    const farmId = crypto.randomUUID();
    const factory = new AnimalFactory(farmId);
    const mother = factory.create({
      status: ANIMAL_STATUS.DEAD,
      sex: "female",
      birthDate: oldMother(factory).birthDate,
    });
    const { createdBy, validTo, ...motherData } = mother;
    const input = {
      earTagNumber: factory.create().earTagNumber,
      stateCode: "MK",
      birthDate: new Date(),
      sex: "female",
      currentFarmId: farmId,
      motherId: mother.id,
    };
    mockRepo.findByTag = vi.fn().mockResolvedValue(null);
    mockRepo.findById = vi.fn().mockResolvedValue(motherData);
    const result = await service.create(input);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.message).toContain(ANIMAL_ERRORS.MOTHER_NOT_ALIVE);
  });

  it("rejects a male mother (INVALID_PARENT_SEX) — age + gap already pass", async () => {
    const farmId = crypto.randomUUID();
    const factory = new AnimalFactory(farmId);
    const mother = factory.create({
      status: ANIMAL_STATUS.ALIVE,
      sex: "male",
      birthDate: oldMother(factory).birthDate,
    });
    const { createdBy, validTo, ...motherData } = mother;
    const input = {
      earTagNumber: factory.create().earTagNumber,
      stateCode: "MK",
      birthDate: new Date(),
      sex: "female",
      currentFarmId: farmId,
      motherId: mother.id,
    };
    mockRepo.findByTag = vi.fn().mockResolvedValue(null);
    mockRepo.findById = vi.fn().mockResolvedValue(motherData); // age+gap pass (no last calf)
    mockRepo.findLastCalfByMother = vi.fn().mockResolvedValue(null);
    const result = await service.create(input);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.message).toContain(ANIMAL_ERRORS.INVALID_PARENT_SEX);
  });
});
