import { describe, expect, it, vi, beforeEach } from "vitest";
import { CorrectionService } from "./correction.service.js";
import type { CorrectionRepository } from "../repositories/correction.repository.js";
import { ErrorCorrectionFactory } from "@rocky/testing";
import { correctionResponseSchema } from "@rocky/validators/api";
import { CorrectionError, CORRECTION_ERRORS } from "../errors/correction.errors.js";
import { CORRECTION_STATUS } from "@rocky/database/constants";

/**
 * WO-030 workflow test — pure unit test (Scenario B): mock the repository,
 * drive the correction case lifecycle with `ErrorCorrectionFactory`, assert on
 * `Result`, and re-parse with the integration `correctionResponseSchema`. No DB.
 */
describe("CorrectionService — case lifecycle state machine (workflow)", () => {
  const farmId = "44444444-4444-4444-8444-444444444444";
  const animalId = "55555555-5555-4555-8555-555555555555";
  let service: CorrectionService;
  let repo: CorrectionRepository;

  beforeEach(() => {
    repo = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
      escalate: vi.fn(),
    } as unknown as CorrectionRepository;
    // archiveService / passportService are optional and omitted here, so the
    // resolve() side-effects (archive + reprint) are not exercised.
    service = new CorrectionService(repo);
  });

  describe("review (PENDING → UNDER_REVIEW)", () => {
    it("moves a PENDING case to UNDER_REVIEW", async () => {
      const pending = new ErrorCorrectionFactory(farmId, animalId).createPending();
      repo.findById = vi.fn().mockResolvedValue(pending);
      repo.updateStatus = vi.fn().mockResolvedValue({ ...pending, status: CORRECTION_STATUS.UNDER_REVIEW });

      const res = await service.review(pending.id);

      expect(res.isOk()).toBe(true);
      if (res.isOk()) {
        expect(res.value.status).toBe(CORRECTION_STATUS.UNDER_REVIEW);
        expect(() => correctionResponseSchema.parse(res.value)).not.toThrow();
      }
    });

    it("rejects reviewing a terminal RESOLVED case (invalid transition)", async () => {
      const resolved = new ErrorCorrectionFactory(farmId, animalId).createResolved();
      repo.findById = vi.fn().mockResolvedValue(resolved);

      const res = await service.review(resolved.id);

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(CorrectionError);
        expect(res.error.code).toBe(CORRECTION_ERRORS.INVALID_STATUS_TRANSITION);
      }
    });
  });

  describe("resolve (UNDER_REVIEW → RESOLVED)", () => {
    it("resolves an UNDER_REVIEW case", async () => {
      const underReview = new ErrorCorrectionFactory(farmId, animalId).create({ status: CORRECTION_STATUS.UNDER_REVIEW });
      repo.findById = vi.fn().mockResolvedValue(underReview);
      repo.updateStatus = vi.fn().mockResolvedValue({ ...underReview, status: CORRECTION_STATUS.RESOLVED });

      const res = await service.resolve(underReview.id, { resolvedBy: "vet-1" });

      expect(res.isOk()).toBe(true);
      if (res.isOk()) expect(res.value.status).toBe(CORRECTION_STATUS.RESOLVED);
    });
  });

  describe("escalate (UNDER_REVIEW → ESCALATED)", () => {
    it("escalates an UNDER_REVIEW case to the VI", async () => {
      const underReview = new ErrorCorrectionFactory(farmId, animalId).create({ status: CORRECTION_STATUS.UNDER_REVIEW });
      repo.findById = vi.fn().mockResolvedValue(underReview);
      repo.escalate = vi.fn().mockResolvedValue({ ...underReview, status: CORRECTION_STATUS.ESCALATED });

      const res = await service.escalate(underReview.id, { escalatedTo: "vi-1", reason: "needs on-spot" });

      expect(res.isOk()).toBe(true);
      if (res.isOk()) expect(res.value.status).toBe(CORRECTION_STATUS.ESCALATED);
    });
  });

  describe("reject (PENDING → REJECTED)", () => {
    it("rejects a PENDING case", async () => {
      const pending = new ErrorCorrectionFactory(farmId, animalId).createPending();
      repo.findById = vi.fn().mockResolvedValue(pending);
      repo.updateStatus = vi.fn().mockResolvedValue({ ...pending, status: CORRECTION_STATUS.REJECTED });

      const res = await service.reject(pending.id);

      expect(res.isOk()).toBe(true);
      if (res.isOk()) expect(res.value.status).toBe(CORRECTION_STATUS.REJECTED);
    });
  });

  describe("not found", () => {
    it("returns NOT_FOUND for a missing case", async () => {
      repo.findById = vi.fn().mockResolvedValue(undefined);

      const res = await service.review("missing-id");

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(CorrectionError);
        expect(res.error.code).toBe(CORRECTION_ERRORS.NOT_FOUND);
      }
    });
  });
});
