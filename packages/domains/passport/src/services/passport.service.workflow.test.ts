import { describe, expect, it, vi, beforeEach } from "vitest";
import { PassportService } from "./passport.service.js";
import type { PassportRepository } from "../repositories/passport.repository.js";
import type { AnimalRepository } from "@rocky/domains-animal";
import { CattlePassportFactory } from "@rocky/testing";
import { passportResponseSchema } from "@rocky/validators/api";
import { PassportError, PASSPORT_ERRORS } from "../errors/passport.errors.js";
import { PASSPORT_STATUS } from "@rocky/database/constants";

/**
 * WO-030 workflow test — pure unit test (Scenario B): mock the repository,
 * drive the passport lifecycle with `CattlePassportFactory`, assert on `Result`,
 * and re-parse with the integration `passportResponseSchema`. No DB.
 */
describe("PassportService — lifecycle state machine (workflow)", () => {
  const animalId = "22222222-2222-4222-8222-222222222222";
  const farmId = "33333333-3333-4333-8333-333333333333";
  let service: PassportService;
  let repo: PassportRepository;

  beforeEach(() => {
    repo = {
      findById: vi.fn(),
      seize: vi.fn(),
      updateStatus: vi.fn(),
      create: vi.fn(),
    } as unknown as PassportRepository;
    const animalRepo = { findById: vi.fn() } as unknown as AnimalRepository;
    service = new PassportService(repo, animalRepo);
  });

  describe("seize (ACTIVE → SEIZED)", () => {
    it("seizes an ACTIVE passport", async () => {
      const active = new CattlePassportFactory(animalId, farmId).create({ status: PASSPORT_STATUS.ACTIVE });
      repo.findById = vi.fn().mockResolvedValue(active);
      repo.seize = vi.fn().mockResolvedValue({ ...active, status: PASSPORT_STATUS.SEIZED, seizeDate: "2026-01-01" });

      const res = await service.seize(active.id, "2026-01-01", "slaughter");

      expect(res.isOk()).toBe(true);
      if (res.isOk()) {
        expect(res.value.status).toBe(PASSPORT_STATUS.SEIZED);
        expect(() => passportResponseSchema.parse(res.value)).not.toThrow();
      }
    });

    it("is idempotent when the passport is already SEIZED", async () => {
      const seized = new CattlePassportFactory(animalId, farmId).createSeized();
      repo.findById = vi.fn().mockResolvedValue(seized);

      const res = await service.seize(seized.id, "2026-01-01");

      expect(res.isOk()).toBe(true);
      if (res.isOk()) expect(res.value.status).toBe(PASSPORT_STATUS.SEIZED);
      expect(repo.seize).not.toHaveBeenCalled();
    });

    it("rejects seizing an ISSUED passport (invalid transition)", async () => {
      const issued = new CattlePassportFactory(animalId, farmId).createIssued();
      repo.findById = vi.fn().mockResolvedValue(issued);

      const res = await service.seize(issued.id, "2026-01-01");

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(PassportError);
        expect(res.error.code).toBe(PASSPORT_ERRORS.INVALID_STATUS_TRANSITION);
      }
    });
  });

  describe("reprint (ACTIVE → REPRINTED)", () => {
    it("invalidates the original and issues a new ACTIVE passport", async () => {
      const active = new CattlePassportFactory(animalId, farmId).create({ status: PASSPORT_STATUS.ACTIVE });
      const reprint = new CattlePassportFactory(animalId, farmId).create({
        status: PASSPORT_STATUS.ACTIVE,
        isReprint: true,
        originalPassportId: active.id,
      });
      repo.findById = vi.fn().mockResolvedValue(active);
      repo.updateStatus = vi.fn().mockResolvedValue(true);
      repo.create = vi.fn().mockResolvedValue(reprint);

      const res = await service.reprint(active.id);

      expect(res.isOk()).toBe(true);
      if (res.isOk()) {
        expect(res.value.status).toBe(PASSPORT_STATUS.ACTIVE);
        expect(res.value.isReprint).toBe(true);
        expect(res.value.originalPassportId).toBe(active.id);
      }
    });

    it("rejects reprinting an ISSUED passport (invalid transition)", async () => {
      const issued = new CattlePassportFactory(animalId, farmId).createIssued();
      repo.findById = vi.fn().mockResolvedValue(issued);

      const res = await service.reprint(issued.id);

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(PassportError);
        expect(res.error.code).toBe(PASSPORT_ERRORS.INVALID_STATUS_TRANSITION);
      }
    });
  });
});
