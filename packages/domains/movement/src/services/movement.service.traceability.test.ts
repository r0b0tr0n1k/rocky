import { describe, expect, it, vi, beforeEach } from "vitest";
import { ok } from "neverthrow";
import { MovementService } from "./movement.service.js";
import type { MovementRepository } from "../repositories/movement.repository.js";
import type { AnimalRepository } from "@rocky/domains-animal";
import type { SystemService } from "@rocky/domains-system";
import type { GeoService } from "@rocky/geo";
import { DEFAULT_TRACABILITY_RULES } from "@rocky/domains-system";
import { MovementError, MOVEMENT_ERRORS } from "../errors/movement.errors.js";
import { ANIMAL_STATUS, MOVEMENT_TYPE } from "@rocky/database/constants";

/**
 * Traceability guards from Implementing Reg (EU) 2021/520 (Art. 13(4) tag-before-move,
 * Art. 3 transmission window), driven by the traceability rules engine. Pure unit test:
 * mock repos + SystemService, drive a cross-farm SALE through `create`, assert the
 * engine-gated guards fire before `repo.insert`.
 */
describe("MovementService — EU 2021/520 traceability guards (rules engine)", () => {
  const animalId = "99999999-9999-4999-8999-999999999999";
  const fromFarmId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
  const toFarmId = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

  const traceabilityRules = DEFAULT_TRACABILITY_RULES.map((r) => ({
    ...r,
    params: { ...r.params },
  }));

  const ruleSet = {
    jurisdiction: "MK",
    euAligned: true,
    thresholds: {
      taggingDays: 20,
      notificationDays: 7,
      stillbornThresholdDays: 25,
      slaughterMinAgeDays: 25,
      arrivalCorrectionDays: 2,
    },
    traceability: { maxDepth: 10, retentionYears: 2 },
    traceabilityRules,
    welfare: {
      unweanedMaxAgeDays: 120,
      maxSingleLegDays: 1,
      multiDayMaxDays: 2,
      restStopAfterDays: 1,
    },
  };

  let repo: MovementRepository;
  let animalRepo: AnimalRepository;
  let service: MovementService;

  beforeEach(() => {
    repo = {
      findActivePastureDeclaration: vi.fn().mockResolvedValue(null),
      deactivatePastureDeclaration: vi.fn(),
      farmHasOverdueBirths: vi.fn().mockResolvedValue(false),
      isAnimalUnderWithdrawal: vi.fn().mockResolvedValue(false),
      insert: vi.fn().mockResolvedValue({ id: "mov-1" }),
      updateFarm: vi.fn().mockResolvedValue(undefined),
      findFarmType: vi.fn().mockResolvedValue("FARM"),
    } as unknown as MovementRepository;
    animalRepo = {
      findById: vi.fn(),
      updateFarm: vi.fn().mockResolvedValue(undefined),
    } as unknown as AnimalRepository;
    const system = {
      getRuleSet: vi.fn().mockResolvedValue(ok(ruleSet)),
    } as unknown as SystemService;
    const geoService = {
      runDiseaseZoneCheck: vi
        .fn()
        .mockResolvedValue({
          inProtectionZone: false,
          inSurveillanceZone: false,
          protectionZoneKm: 3,
          surveillanceZoneKm: 10,
          protectionZones: [],
          surveillanceZones: [],
        }),
    } as unknown as GeoService;
    service = new MovementService(repo, animalRepo, system, {} as never, geoService);
  });

  const baseInput = (overrides: Record<string, unknown> = {}) => ({
    animalId,
    fromFarmId,
    toFarmId,
    type: MOVEMENT_TYPE.SALE,
    movementDate: new Date(),
    ...overrides,
  });

  const taggedAnimal = (overrides: Record<string, unknown> = {}) => ({
    id: animalId,
    status: ANIMAL_STATUS.ALIVE,
    birthDate: "2025-01-01",
    earTagNumber: "12345678",
    ...overrides,
  });

  it("Art. 13(4): blocks a cross-farm departure for an unidentified animal", async () => {
    animalRepo.findById = vi
      .fn()
      .mockResolvedValue({ id: animalId, status: ANIMAL_STATUS.ALIVE, birthDate: "2025-01-01" });
    const res = await service.create(baseInput() as never);
    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      const err = res.error as MovementError;
      expect(err.code).toBe(MOVEMENT_ERRORS.TAG_REQUIRED_BEFORE_MOVE);
    }
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it("Art. 13(4): allows the departure once the animal carries an ear tag", async () => {
    animalRepo.findById = vi.fn().mockResolvedValue(taggedAnimal());
    const res = await service.create(baseInput() as never);
    expect(repo.insert).toHaveBeenCalled();
    if (res.isErr()) {
      const err = res.error as MovementError;
      expect(err.code).not.toBe(MOVEMENT_ERRORS.TAG_REQUIRED_BEFORE_MOVE);
      expect(err.code).not.toBe(MOVEMENT_ERRORS.TRANSMISSION_DEADLINE_EXCEEDED);
    }
  });

  it("Art. 3: blocks reporting a movement older than the transmission window", async () => {
    animalRepo.findById = vi.fn().mockResolvedValue(taggedAnimal());
    const late = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const res = await service.create(baseInput({ movementDate: late }) as never);
    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      const err = res.error as MovementError;
      expect(err.code).toBe(MOVEMENT_ERRORS.TRANSMISSION_DEADLINE_EXCEEDED);
    }
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it("Art. 3: allows a movement reported within the transmission window", async () => {
    animalRepo.findById = vi.fn().mockResolvedValue(taggedAnimal());
    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const res = await service.create(baseInput({ movementDate: recent }) as never);
    expect(repo.insert).toHaveBeenCalled();
    if (res.isErr()) {
      const err = res.error as MovementError;
      expect(err.code).not.toBe(MOVEMENT_ERRORS.TAG_REQUIRED_BEFORE_MOVE);
      expect(err.code).not.toBe(MOVEMENT_ERRORS.TRANSMISSION_DEADLINE_EXCEEDED);
    }
  });

  it("rules engine: disabling ART3_TRANSMISSION_WINDOW disables the Art. 3 guard", async () => {
    animalRepo.findById = vi.fn().mockResolvedValue(taggedAnimal());
    const disabledRules = DEFAULT_TRACABILITY_RULES.map((r) =>
      r.id === "ART3_TRANSMISSION_WINDOW"
        ? { ...r, enabled: false }
        : { ...r, params: { ...r.params } },
    );
    const disabledRuleSet = { ...ruleSet, traceabilityRules: disabledRules };
    const system = {
      getRuleSet: vi.fn().mockResolvedValue(ok(disabledRuleSet)),
    } as unknown as SystemService;
    const geoService = {
      runDiseaseZoneCheck: vi
        .fn()
        .mockResolvedValue({
          inProtectionZone: false,
          inSurveillanceZone: false,
          protectionZoneKm: 3,
          surveillanceZoneKm: 10,
          protectionZones: [],
          surveillanceZones: [],
        }),
    } as unknown as GeoService;
    const svc = new MovementService(repo, animalRepo, system, {} as never, geoService);
    const late = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const res = await svc.create(baseInput({ movementDate: late }) as never);
    expect(repo.insert).toHaveBeenCalled();
    if (res.isErr()) {
      const err = res.error as MovementError;
      expect(err.code).not.toBe(MOVEMENT_ERRORS.TAG_REQUIRED_BEFORE_MOVE);
      expect(err.code).not.toBe(MOVEMENT_ERRORS.TRANSMISSION_DEADLINE_EXCEEDED);
    }
  });

  it("rules engine: disabling ART13_TAG_BEFORE_MOVE allows an unidentified animal to depart", async () => {
    animalRepo.findById = vi
      .fn()
      .mockResolvedValue({ id: animalId, status: ANIMAL_STATUS.ALIVE, birthDate: "2025-01-01" });
    const disabledRules = DEFAULT_TRACABILITY_RULES.map((r) =>
      r.id === "ART13_TAG_BEFORE_MOVE"
        ? { ...r, enabled: false }
        : { ...r, params: { ...r.params } },
    );
    const disabledRuleSet = { ...ruleSet, traceabilityRules: disabledRules };
    const system = {
      getRuleSet: vi.fn().mockResolvedValue(ok(disabledRuleSet)),
    } as unknown as SystemService;
    const geoService = {
      runDiseaseZoneCheck: vi
        .fn()
        .mockResolvedValue({
          inProtectionZone: false,
          inSurveillanceZone: false,
          protectionZoneKm: 3,
          surveillanceZoneKm: 10,
          protectionZones: [],
          surveillanceZones: [],
        }),
    } as unknown as GeoService;
    const svc = new MovementService(repo, animalRepo, system, {} as never, geoService);
    const res = await svc.create(baseInput() as never);
    expect(repo.insert).toHaveBeenCalled();
    if (res.isErr()) {
      const err = res.error as MovementError;
      expect(err.code).not.toBe(MOVEMENT_ERRORS.TAG_REQUIRED_BEFORE_MOVE);
      expect(err.code).not.toBe(MOVEMENT_ERRORS.TRANSMISSION_DEADLINE_EXCEEDED);
    }
  });
});
