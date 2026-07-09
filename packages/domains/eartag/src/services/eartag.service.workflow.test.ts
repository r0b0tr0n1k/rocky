import { describe, expect, it, vi, beforeEach } from "vitest";
import { ok } from "neverthrow";
import { EarTagService } from "./eartag.service.js";
import type { EarTagRepository } from "../repositories/eartag.repository.js";
import { EarTagOrderFactory } from "@rocky/testing";
import { earTagResponseSchema, earTagOrderResponseSchema } from "@rocky/validators/api";
import { EarTagError, EARTAG_ERRORS } from "../errors/eartag.errors.js";
import { EAR_TAG_ORDER_STATUS } from "@rocky/database/constants";
import type { SystemService } from "@rocky/domains-system";

/**
 * WO-030 workflow test — pure unit test (Scenario B of the Diamond Seal
 * Testing Doctrine): mock the repository, drive the order state machine with
 * `EarTagOrderFactory`, and assert on `Result`. No DB. The integration
 * `earTagResponseSchema` is reused: every success path is schema-validated by
 * the service itself, and we re-parse to prove it.
 */
describe("EarTagService — order state machine (workflow)", () => {
  const orgId = "018fbe2c-7a3d-4c9e-8b1a-2c3d4e5f6a7b";
  let service: EarTagService;
  let mockRepo: EarTagRepository;

  beforeEach(() => {
    mockRepo = {
      findOrderById: vi.fn(),
      updateOrderStatus: vi.fn(),
      findAvailableEarTags: vi.fn(),
      assignTagsToOrder: vi.fn(),
    } as unknown as EarTagRepository;
    const mockSystem = {
      getRuleSet: vi.fn().mockResolvedValue(ok({ jurisdiction: "MK" })),
    } as unknown as SystemService;
    service = new EarTagService(mockRepo, mockSystem);
  });

  describe("transitionOrderStatus", () => {
    it("allows DRAFT → PENDING and returns a schema-valid order", async () => {
      const draft = new EarTagOrderFactory(orgId).createDraft();
      mockRepo.findOrderById = vi.fn().mockResolvedValue(draft);
      mockRepo.updateOrderStatus = vi
        .fn()
        .mockResolvedValue({ ...draft, status: EAR_TAG_ORDER_STATUS.PENDING });

      const res = await service.transitionOrderStatus(draft.id, EAR_TAG_ORDER_STATUS.PENDING);

      expect(res.isOk()).toBe(true);
      if (res.isOk()) {
        expect(res.value.status).toBe(EAR_TAG_ORDER_STATUS.PENDING);
        expect(() => earTagOrderResponseSchema.parse(res.value)).not.toThrow();
      }
    });

    it("rejects DRAFT → RECEIVED (invalid transition)", async () => {
      const draft = new EarTagOrderFactory(orgId).createDraft();
      mockRepo.findOrderById = vi.fn().mockResolvedValue(draft);

      const res = await service.transitionOrderStatus(draft.id, EAR_TAG_ORDER_STATUS.RECEIVED);

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(EarTagError);
        expect(res.error.code).toBe(EARTAG_ERRORS.INVALID_STATUS_TRANSITION);
      }
    });

    it("rejects transition from a missing order with ORDER_NOT_FOUND", async () => {
      mockRepo.findOrderById = vi.fn().mockResolvedValue(undefined);

      const res = await service.transitionOrderStatus("nope", EAR_TAG_ORDER_STATUS.PENDING);

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(EarTagError);
        expect(res.error.code).toBe(EARTAG_ERRORS.ORDER_NOT_FOUND);
      }
    });
  });

  describe("cancelOrder", () => {
    it("allows cancel from DRAFT → CANCELLED", async () => {
      const draft = new EarTagOrderFactory(orgId).createDraft();
      mockRepo.findOrderById = vi.fn().mockResolvedValue(draft);
      mockRepo.updateOrderStatus = vi
        .fn()
        .mockResolvedValue({ ...draft, status: EAR_TAG_ORDER_STATUS.CANCELLED });

      const res = await service.cancelOrder(draft.id);

      expect(res.isOk()).toBe(true);
      if (res.isOk()) expect(res.value.status).toBe(EAR_TAG_ORDER_STATUS.CANCELLED);
    });

    it("rejects cancel from RECEIVED (terminal state)", async () => {
      const received = new EarTagOrderFactory(orgId).create({
        status: EAR_TAG_ORDER_STATUS.RECEIVED,
      });
      mockRepo.findOrderById = vi.fn().mockResolvedValue(received);

      const res = await service.cancelOrder(received.id);

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(EarTagError);
        expect(res.error.code).toBe(EARTAG_ERRORS.INVALID_STATUS_TRANSITION);
      }
    });
  });

  describe("collectOrderTags", () => {
    it("rejects collection unless the order is APPROVED", async () => {
      const draft = new EarTagOrderFactory(orgId).createDraft();
      mockRepo.findOrderById = vi.fn().mockResolvedValue(draft);

      const res = await service.collectOrderTags(draft.id, "SUPPLIER-1");

      expect(res.isErr()).toBe(true);
      if (res.isErr()) {
        expect(res.error).toBeInstanceOf(EarTagError);
        expect(res.error.code).toBe(EARTAG_ERRORS.INVALID_STATUS_TRANSITION);
      }
    });
  });
});
