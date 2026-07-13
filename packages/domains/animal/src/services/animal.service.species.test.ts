import { describe, expect, it, vi } from "vitest";
import { AnimalService } from "./animal.service.js";
import type { AnimalRepository } from "../repositories/animal.repository.js";
import { ok } from "neverthrow";
import type { SystemService } from "@rocky/domains-system";
import { DEFAULT_TRACABILITY_RULES } from "@rocky/domains-system";
import { ANIMAL_ERRORS } from "../errors/animal.errors.js";
import { AnimalFactory } from "@rocky/testing";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString().split("T")[0];

/** RuleSet with ALL per-species tagging rules ENABLED (the default jurisdiction state). */
function enabledRuleSet() {
  return ok({
    jurisdiction: "MK",
    farmerCanAdminister: true,
    retention: { cpc: 3, vs: 3, vi: 3, bip: 3 },
    roleVocab: ["owner", "keeper", "veterinarian"],
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
    welfare: { unweanedMaxAgeDays: 120, maxSingleLegDays: 1, multiDayMaxDays: 2, restStopAfterDays: 1 },
    tag: { format: "MK_8", prefix: "807" },
    traceability: { maxDepth: 10, retentionYears: 2 },
    // All 8 traceability rules enabled at EU floors (default jurisdiction state).
    traceabilityRules: DEFAULT_TRACABILITY_RULES.map((r) => ({ ...r })),
    fsma: { cteExportFormat: "json", responseSlaHours: 24 },
    euAligned: true,
  });
}

function disabledSpeciesRuleSet() {
  const rs = enabledRuleSet();
  if (rs.isOk()) {
    rs.value.traceabilityRules = rs.value.traceabilityRules.map((r) =>
      r.id.startsWith("ART") && r.id.includes("TAGGING")
        ? { ...r, enabled: false }
        : { ...r },
    );
  }
  return rs;
}

describe("AnimalService — per-species first-identification (Art. 13/14/15/21, ADR-0085)", () => {
  const farmId = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";

  function buildService(ruleSet: ReturnType<typeof enabledRuleSet>) {
    const base = new AnimalFactory(farmId).create();
    const repo = {
      findById: vi.fn(),
      findByTag: vi.fn().mockResolvedValue(null),
      listFiltered: vi.fn(),
      insert: vi.fn().mockResolvedValue(base),
      update: vi.fn(),
      findLastCalfByMother: vi.fn(),
    } as unknown as AnimalRepository;
    const system = { getRuleSet: vi.fn().mockResolvedValue(ruleSet) } as unknown as SystemService;
    return { service: new AnimalService(repo, system), base, repo };
  }

  function input(base: ReturnType<AnimalFactory["create"]>, over: Record<string, unknown>) {
    return {
      earTagNumber: base.earTagNumber,
      stateCode: base.stateCode,
      birthDate: base.birthDate,
      sex: base.sex,
      currentFarmId: farmId,
      ...over,
    };
  }

  it("BOVINE: rejects registration >20 days after birth (no taggingDate)", async () => {
    const { service, base } = buildService(enabledRuleSet());
    const res = await service.create(input(base, { species: "BOVINE", birthDate: daysAgo(30) }) as never);
    expect(res.isErr()).toBe(true);
    if (res.isErr()) expect((res.error as Error).message).toContain(ANIMAL_ERRORS.TAGGING_DEADLINE_EXCEEDED);
  });

  it("BOVINE: allows registration tagged within the 20-day window", async () => {
    const { service, base } = buildService(enabledRuleSet());
    const res = await service.create(
      input(base, { species: "BOVINE", birthDate: daysAgo(30), taggingDate: daysAgo(15) }) as never,
    );
    expect(res.isOk()).toBe(true);
  });

  it("OVINE: rejects registration >9 months (270d) after birth", async () => {
    const { service, base } = buildService(enabledRuleSet());
    const res = await service.create(input(base, { species: "OVINE", birthDate: daysAgo(300) }) as never);
    expect(res.isErr()).toBe(true);
    if (res.isErr()) expect((res.error as Error).message).toContain(ANIMAL_ERRORS.TAGGING_DEADLINE_EXCEEDED);
  });

  it("EQUINE: allows registration up to 12 months (365d) after birth", async () => {
    const { service, base } = buildService(enabledRuleSet());
    const res = await service.create(input(base, { species: "EQUINE", birthDate: daysAgo(360) }) as never);
    expect(res.isOk()).toBe(true);
  });

  it("disabling the species tagging rule suspends the guillotine", async () => {
    const { service, base } = buildService(disabledSpeciesRuleSet());
    const res = await service.create(input(base, { species: "BOVINE", birthDate: daysAgo(120) }) as never);
    expect(res.isOk()).toBe(true);
  });

  it("falls back to BOVINE when species is omitted", async () => {
    const { service, base } = buildService(enabledRuleSet());
    const res = await service.create(input(base, { birthDate: daysAgo(60) }) as never);
    expect(res.isErr()).toBe(true);
    if (res.isErr()) expect((res.error as Error).message).toContain(ANIMAL_ERRORS.TAGGING_DEADLINE_EXCEEDED);
  });
});
