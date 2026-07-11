import { describe, expect, it, vi, beforeEach } from "vitest";
import { AnimalService } from "./animal.service.js";
import type { AnimalRepository } from "./animal.repository.js";
import { ok } from "neverthrow";
import type { SystemService } from "@rocky/domains-system";
import { AnimalFactory } from "@rocky/testing";
import { ANIMAL_ERRORS } from "../errors/animal.errors.js";

describe("AnimalService", () => {
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

    mockSystem = {
      getRuleSet: vi.fn().mockResolvedValue(ok({
        jurisdiction: "MK",
        farmerCanAdminister: true,
        retention: { cpc: 3, vs: 3, vi: 3, bip: 3 },
        roleVocab: ["owner", "keeper", "veterinarian", "trader", "slaughterhouse_op", "market_op", "technician", "guardian"],
        administerRoles: ["veterinarian"],
        thresholds: {
          orderIntervalDays: 120,
          maxOrdersPerYear: 4,
          minVaccinationAgeDays: 30,
          slaughterMinAgeDays: 25,
          stillbornThresholdDays: 25,
          arrivalCorrectionDays: 2,
          minMotherAgeMonths: 17,
          calvingPeriodDays: 365,
          taggingDays: 20,
          notificationDays: 7,
        },
        weights: { selectionPercentage: 10, farmSize: 0.3, history: 0.3, species: 0.2, region: 0.2 },
        welfare: {
          unweanedMaxAgeDays: 120,
          maxSingleLegDays: 1,
          multiDayMaxDays: 2,
          restStopAfterDays: 1,
        },
        // WO-118: ear-tag format config — was missing from the pre-WO-118 mock, causing tag.format to crash
        tag: { format: "MK_8", prefix: "807" },
        traceability: { maxDepth: 10, retentionYears: 2 },
        fsma: { cteExportFormat: "json", responseSlaHours: 24 },
        euAligned: true,
      })),
    } as unknown as SystemService;

    service = new AnimalService(mockRepo, mockSystem);
  });

  describe("getById", () => {
    it("should return animal when found", async () => {
      const farmId = crypto.randomUUID();
      const factory = new AnimalFactory(farmId);
      const animal = factory.create();
      const { createdBy, validTo, ...animalData } = animal;
      mockRepo.findById = vi.fn().mockResolvedValue(animalData);

      const result = await service.getById(animal.id);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.id).toBe(animal.id);
      }
    });

    it("should return NOT_FOUND error when animal not found", async () => {
      mockRepo.findById = vi.fn().mockResolvedValue(null);

      const result = await service.getById("non-existent-id");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(ANIMAL_ERRORS.NOT_FOUND);
      }
    });
  });

  describe("create", () => {
    it("should create animal successfully", async () => {
      const farmId = crypto.randomUUID();
      const factory = new AnimalFactory(farmId);
      const animal = factory.create();
      const { createdBy, validTo, ...animalData } = animal;
      const input = {
        earTagNumber: animal.earTagNumber,
        stateCode: animal.stateCode,
        birthDate: animal.birthDate,
        sex: animal.sex,
        currentFarmId: farmId,
      };

      mockRepo.findByTag = vi.fn().mockResolvedValue(null);
      mockRepo.insert = vi.fn().mockResolvedValue(animalData);

      const result = await service.create(input);

      expect(result.isOk()).toBe(true);
    });

    it("should return error for duplicate ear tag", async () => {
      const farmId = crypto.randomUUID();
      const factory = new AnimalFactory(farmId);
      const existingAnimal = factory.create();
      const input = {
        earTagNumber: existingAnimal.earTagNumber,
        stateCode: existingAnimal.stateCode,
        birthDate: existingAnimal.birthDate,
        sex: existingAnimal.sex,
        currentFarmId: farmId,
      };

      mockRepo.findByTag = vi.fn().mockResolvedValue(existingAnimal);

      const result = await service.create(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(ANIMAL_ERRORS.EAR_TAG_ALREADY_USED);
      }
    });

    it("should return error when mother not on farm", async () => {
      const farmId = crypto.randomUUID();
      const motherFarmId = crypto.randomUUID();
      const factory = new AnimalFactory(farmId);
      const motherFactory = new AnimalFactory(motherFarmId);
      const mother = motherFactory.create({ status: "alive" });
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
      mockRepo.findById = vi.fn().mockResolvedValueOnce(motherData);

      const result = await service.create(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(ANIMAL_ERRORS.MOTHER_NOT_ON_FARM);
      }
    });

    it("should return error when mother not alive", async () => {
      const farmId = crypto.randomUUID();
      const factory = new AnimalFactory(farmId);
      const mother = factory.create({ status: "dead" });
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
      mockRepo.findById = vi.fn().mockResolvedValueOnce(motherData);

      const result = await service.create(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(ANIMAL_ERRORS.MOTHER_NOT_ALIVE);
      }
    });

    it("should return error when mother too young", async () => {
      const farmId = crypto.randomUUID();
      const factory = new AnimalFactory(farmId);
      
      // Mother born only 10 months ago (less than minMotherAgeMonths = 17)
      const motherBirthDate = new Date();
      motherBirthDate.setMonth(motherBirthDate.getMonth() - 10);
      
      const mother = factory.create({ 
        status: "alive",
        birthDate: motherBirthDate.toISOString().split("T")[0], // Format as "YYYY-MM-DD"
      });
      const { createdBy, validTo, ...motherData } = mother;

      // Calf born now
      const input = {
        earTagNumber: factory.create().earTagNumber,
        stateCode: "MK",
        birthDate: new Date(),
        sex: "female",
        currentFarmId: farmId,
        motherId: mother.id,
      };

      mockRepo.findByTag = vi.fn().mockResolvedValue(null);
      mockRepo.findById = vi.fn().mockResolvedValueOnce(motherData);

      const result = await service.create(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(ANIMAL_ERRORS.MOTHER_TOO_YOUNG);
      }
    });

    it("should return error for invalid calving gap", async () => {
      const farmId = crypto.randomUUID();
      const factory = new AnimalFactory(farmId);
      
      // Mother must be older than minMotherAgeMonths (17) or Rule A.4c fires
      // MOTHER_TOO_YOUNG *before* the calving-gap check (A.4d) — set birthDate 2y back.
      const motherBirthDate = new Date();
      motherBirthDate.setFullYear(motherBirthDate.getFullYear() - 2);
      const mother = factory.create({
        status: "alive",
        sex: "female",
        birthDate: motherBirthDate.toISOString().split("T")[0],
      });
      const { createdBy, validTo, ...motherData } = mother;

      // Last calf born only 100 days ago (less than calvingPeriodDays = 365)
      const lastCalfDate = new Date();
      lastCalfDate.setDate(lastCalfDate.getDate() - 100);
      
      const lastCalf = factory.create({
        birthDate: lastCalfDate.toISOString().split("T")[0],
        motherId: mother.id,
      });
      const { createdBy: _, validTo: __, ...lastCalfData } = lastCalf;

      const input = {
        earTagNumber: factory.create().earTagNumber,
        stateCode: "MK",
        birthDate: new Date(),
        sex: "female",
        currentFarmId: farmId,
        motherId: mother.id,
      };

      mockRepo.findByTag = vi.fn().mockResolvedValue(null);
      mockRepo.findById = vi.fn()
        .mockResolvedValueOnce(motherData) // First call: find mother
        .mockResolvedValueOnce(motherData); // Second call: find mother again (for parent sex check)
      mockRepo.findLastCalfByMother = vi.fn().mockResolvedValue(lastCalfData);

      const result = await service.create(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(ANIMAL_ERRORS.INVALID_CALVING_GAP);
      }
    });
  });
});
