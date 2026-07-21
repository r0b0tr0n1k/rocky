import { describe, expect, it, vi } from "vitest";
import { ok, err } from "neverthrow";
import { EarTagService } from "./eartag.service.js";
import type { EarTagRepository } from "../repositories/eartag.repository.js";
import { EarTagError, EARTAG_ERRORS } from "../errors/eartag.errors.js";
import type { SystemService } from "@rocky/domains-system";
import { DEFAULT_TRACABILITY_RULES } from "@rocky/domains-system";
import { replaceTagResponseSchema } from "@rocky/validators/api";

/**
 * WS3.1 — ART 19(4) replacement-tag dual-code guard.
 * Pure unit test (Diamond Seal Testing Doctrine Scenario B): mock the
 * repository + SystemService, assert Result + error code, and re-parse the
 * success value against earTagResponseSchema (the service validates it).
 */

function buildRuleSet(toggle: boolean) {
  const rules = DEFAULT_TRACABILITY_RULES.map((r) =>
    r.id === "ART19_DUAL_CODE_ON_REPLACEMENT" ? { ...r, enabled: toggle } : r,
  );
  return {
    jurisdiction: "MK",
    tag: { format: "MK_8", prefix: "807" },
    traceabilityRules: rules,
  };
}

const animalId = "018fbe2c-7a3d-4c9e-8b1a-2c3d4e5f6a7b";
const appliedTag = {
  id: "018fbe2c-7a3d-4c9e-8b1a-2c3d4e5f6a7c",
  legacyId: null,
  stateCode: "MK",
  tagNumber: "12345678",
  typeId: "018fbe2c-7a3d-4c9e-8b1a-2c3d4e5f6a7d",
  status: "applied",
  orderId: null,
  allocationId: null,
  animalId,
  appliedDate: "2026-01-01",
  isDefective: false,
  defectReason: null,
  qualityChecked: true,
  qualityCheckedBy: null,
  qualityCheckedAt: null,
  batchNumber: null,
  manufactureDate: null,
  expiryDate: null,
  notes: null,
  createdAt: new Date(),
  createdBy: null,
  updatedAt: new Date("2026-07-20T00:00:00Z"),
  validTo: null,
};

function makeService(ruleToggle: boolean, repoOverride: Partial<EarTagRepository> = {}) {
  const mockRepo = {
    replaceTagForAnimal: vi.fn().mockResolvedValue(appliedTag),
    ...repoOverride,
  } as unknown as EarTagRepository;
  const mockSystem = {
    getRuleSet: vi.fn().mockResolvedValue(ok(buildRuleSet(ruleToggle))),
  } as unknown as SystemService;
  return { service: new EarTagService(mockRepo, mockSystem), repo: mockRepo };
}

// MK_8 valid codes (8 digits, valid check digit): 12345678 / 76543212.
const validVisual = "12345678";
const validElectronic = "76543212";

describe("EarTagService.replaceTag — ART 19(4) dual-code guard", () => {
  it("passes when both codes supplied and the rule is enabled (visual ≠ electronic)", async () => {
    const { service } = makeService(true);
    const res = await service.replaceTag({
      animalId,
      newVisualCode: validVisual,
      newElectronicCode: validElectronic,
    });
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      const parsed = replaceTagResponseSchema.parse(res.value);
      expect(parsed.animalId).toBe(animalId);
      expect(parsed.visualCode).toBe(validVisual);
      expect(parsed.electronicCode).toBe(validElectronic);
      expect(parsed.replacedAt).toBeInstanceOf(Date);
    }
  });

  it("passes when the rule is disabled even with differing codes", async () => {
    const { service } = makeService(false);
    const res = await service.replaceTag({
      animalId,
      newVisualCode: validVisual,
      newElectronicCode: validElectronic,
    });
    expect(res.isOk()).toBe(true);
  });

  it("rejects a malformed visual code (format validation)", async () => {
    const { service } = makeService(true);
    const res = await service.replaceTag({
      animalId,
      newVisualCode: "ABC", // not a valid MK_8 tag
      newElectronicCode: validElectronic,
    });
    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error).toBeInstanceOf(EarTagError);
      expect(res.error.code).toBe(EARTAG_ERRORS.INVALID_INPUT);
    }
  });

  it("rejects a malformed electronic code (format validation)", async () => {
    const { service } = makeService(true);
    const res = await service.replaceTag({
      animalId,
      newVisualCode: validVisual,
      newElectronicCode: "XX",
    });
    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error).toBeInstanceOf(EarTagError);
      expect(res.error.code).toBe(EARTAG_ERRORS.INVALID_INPUT);
    }
  });

  it("returns NOT_FOUND when the animal has no applied tag", async () => {
    const { service } = makeService(true, { replaceTagForAnimal: vi.fn().mockResolvedValue(null) });
    const res = await service.replaceTag({
      animalId,
      newVisualCode: validVisual,
      newElectronicCode: validElectronic,
    });
    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error).toBeInstanceOf(EarTagError);
      expect(res.error.code).toBe(EARTAG_ERRORS.NOT_FOUND);
    }
  });

  it("propagates a getRuleSet failure as an Err (no business logic runs)", async () => {
    const mockRepo = {} as unknown as EarTagRepository;
    const mockSystem = {
      getRuleSet: vi.fn().mockResolvedValue(err(new Error("boom"))),
    } as unknown as SystemService;
    const service = new EarTagService(mockRepo, mockSystem);
    const res = await service.replaceTag({
      animalId,
      newVisualCode: validVisual,
      newElectronicCode: validElectronic,
    });
    expect(res.isErr()).toBe(true);
  });
});
