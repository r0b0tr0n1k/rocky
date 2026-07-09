import { describe, expect, it, vi, beforeEach } from "vitest";
import { FarmBookService } from "./farm-book.service.js";
import type { FarmBookRepository } from "../repositories/farm-book.repository.js";
import { FarmBookFactory } from "@rocky/testing";
import { farmBookResponseSchema } from "@rocky/validators/api";
import { FarmError, FARM_ERRORS } from "../errors/farm.errors.js";
import { FARM_BOOK_STATUS } from "@rocky/database/constants";

/**
 * WO-030 workflow test — pure unit test (Scenario B): mock the repository,
 * drive the farm-book lifecycle with `FarmBookFactory`, assert on `Result`, and
 * re-parse with the integration `farmBookResponseSchema`. No DB. The farm book
 * is forward-only by `STATUS_ORDER`, with CANCELLED always permitted.
 */
describe("FarmBookService — farm book lifecycle state machine (workflow)", () => {
  const farmId = "018fbe2c-7a3d-4c9e-8b1a-2c3d4e5f6a7b";
  let service: FarmBookService;
  let repo: FarmBookRepository;

  beforeEach(() => {
    repo = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as FarmBookRepository;
    service = new FarmBookService(repo);
  });

  describe("updateStatus (forward-only)", () => {
    it("advances PENDING → ASSEMBLED", async () => {
      const pending = new FarmBookFactory(farmId).createPending();
      repo.findById = vi.fn().mockResolvedValue(pending);
      repo.updateStatus = vi.fn().mockResolvedValue({ ...pending, status: FARM_BOOK_STATUS.ASSEMBLED });

      const res = await service.updateStatus(pending.id, { status: FARM_BOOK_STATUS.ASSEMBLED });

      expect(res.isOk()).toBe(true);
      if (res.isOk()) {
        expect(res.value.status).toBe(FARM_BOOK_STATUS.ASSEMBLED);
        expect(() => farmBookResponseSchema.parse(res.value)).not.toThrow();
      }
    });

    it("rejects a backward transition (ASSEMBLED → PENDING)", async () => {
      const assembled = new FarmBookFactory(farmId).createAssembled();
      repo.findById = vi.fn().mockResolvedValue(assembled);

      const res = await service.updateStatus(assembled.id, { status: FARM_BOOK_STATUS.PENDING });

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(FarmError);
        expect(res.error.code).toBe(FARM_ERRORS.INVALID_INPUT);
      }
      expect(repo.updateStatus).not.toHaveBeenCalled();
    });

    it("allows DELIVERED → CANCELLED (cancellation always permitted)", async () => {
      const delivered = new FarmBookFactory(farmId).createDelivered();
      repo.findById = vi.fn().mockResolvedValue(delivered);
      repo.updateStatus = vi.fn().mockResolvedValue({ ...delivered, status: FARM_BOOK_STATUS.CANCELLED });

      const res = await service.updateStatus(delivered.id, { status: FARM_BOOK_STATUS.CANCELLED });

      expect(res.isOk()).toBe(true);
      if (res.isOk()) expect(res.value.status).toBe(FARM_BOOK_STATUS.CANCELLED);
    });
  });

  describe("not found", () => {
    it("returns NOT_FOUND for a missing farm book", async () => {
      repo.findById = vi.fn().mockResolvedValue(undefined);

      const res = await service.updateStatus("missing-id", { status: FARM_BOOK_STATUS.ASSEMBLED });

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(FarmError);
        expect(res.error.code).toBe(FARM_ERRORS.NOT_FOUND);
      }
    });
  });
});
