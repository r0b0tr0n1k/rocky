import { describe, expect, it } from "vitest";
import {
  buildRuleSet,
  TraceabilityRuleEngine,
  isWithinTransmissionWindow,
  requiresDualCodeRecording,
  speciesTaggingMaxDays,
  SPECIES_TAGGING_DEADLINES,
  EU_TRACEABILITY_FLOORS,
  EU_BIRTH_DEADLINES,
  DEFAULT_TRACABILITY_RULES,
  type RuleSetParamRow,
} from "./rule-set.js";

/** Minimal valid parameter rows so buildRuleSet does not throw on missing codes. */
function baseRows(): RuleSetParamRow[] {
  return [
    { code: "ORDER_INTERVAL_DAYS", value: "30" },
    { code: "MAX_ORDERS_PER_YEAR", value: "12" },
    { code: "MIN_VACCINATION_AGE_DAYS", value: "30" },
    { code: "SLAUGHTER_MIN_AGE_DAYS", value: "25" },
    { code: "STILLBORN_THRESHOLD_DAYS", value: "25" },
    { code: "ARRIVAL_CORRECTION_DAYS", value: "2" },
    { code: "MIN_MOTHER_AGE_MONTHS", value: "17" },
    { code: "CALVING_PERIOD_DAYS", value: "365" },
    { code: "SELECTION_PERCENTAGE", value: "10" },
    { code: "FARM_SIZE_WEIGHT", value: "0.3" },
    { code: "HISTORY_WEIGHT", value: "0.3" },
    { code: "SPECIES_WEIGHT", value: "0.2" },
    { code: "REGION_WEIGHT", value: "0.2" },
    { code: "RETENTION_YEARS_CPC", value: "3" },
    { code: "RETENTION_YEARS_VS", value: "3" },
    { code: "RETENTION_YEARS_VI", value: "3" },
    { code: "RETENTION_YEARS_BIP", value: "3" },
  ];
}

describe("buildRuleSet — traceability rules engine (ADR-0085)", () => {
  it("activates all four Article rules at their EU floors by default", () => {
    const rs = buildRuleSet("MK", baseRows());
    expect(rs.traceabilityRules).toHaveLength(DEFAULT_TRACABILITY_RULES.length);
    for (const rule of DEFAULT_TRACABILITY_RULES) {
      expect(TraceabilityRuleEngine.isEnabled(rs.traceabilityRules, rule.id)).toBe(true);
    }
    expect(
      TraceabilityRuleEngine.getParam(rs.traceabilityRules, "ART3_TRANSMISSION_WINDOW", "transmissionDeadlineDays", 0),
    ).toBe(EU_TRACEABILITY_FLOORS.transmissionMaxDays);
    expect(TraceabilityRuleEngine.getParam(rs.traceabilityRules, "ART12_NUMERIC_CODE", "animalCodeMaxLength", 0)).toBe(
      EU_TRACEABILITY_FLOORS.animalCodeMaxLength,
    );
  });

  it("honours per-Article enable/disable + re-parameterisation via system_parameters", () => {
    const rs = buildRuleSet("MK", [
      ...baseRows(),
      { code: "ART3_TRANSMISSION_WINDOW_ENABLED", value: "false" },
      { code: "ART3_TRANSMISSION_WINDOW_PARAM_transmissionDeadlineDays", value: "14" },
      { code: "ART13_TAG_BEFORE_MOVE_ENABLED", value: "false" },
    ]);
    expect(TraceabilityRuleEngine.isEnabled(rs.traceabilityRules, "ART3_TRANSMISSION_WINDOW")).toBe(false);
    expect(TraceabilityRuleEngine.isEnabled(rs.traceabilityRules, "ART13_TAG_BEFORE_MOVE")).toBe(false);
    expect(TraceabilityRuleEngine.isEnabled(rs.traceabilityRules, "ART12_NUMERIC_CODE")).toBe(true);
    expect(
      TraceabilityRuleEngine.getParam(rs.traceabilityRules, "ART3_TRANSMISSION_WINDOW", "transmissionDeadlineDays", 0),
    ).toBe(14);
  });
});

describe("buildRuleSet — per-species first-identification rules (multi-species)", () => {
  it("registers a toggleable tagging rule for every traceable species at its EU floor", () => {
    const rs = buildRuleSet("MK", baseRows());
    const bovine = TraceabilityRuleEngine.getRule(rs.traceabilityRules, "ART13_BOVINE_TAGGING");
    const ovine = TraceabilityRuleEngine.getRule(rs.traceabilityRules, "ART14_OVINE_CAPRINE_TAGGING");
    const porcine = TraceabilityRuleEngine.getRule(rs.traceabilityRules, "ART15_PORCINE_TAGGING");
    const equine = TraceabilityRuleEngine.getRule(rs.traceabilityRules, "ART21_EQUINE_TAGGING");
    for (const rule of [bovine, ovine, porcine, equine]) {
      expect(rule).toBeDefined();
      expect(rule!.enabled).toBe(true);
    }
    expect(bovine!.params.taggingDays).toBe(SPECIES_TAGGING_DEADLINES.BOVINE);
    expect(ovine!.params.taggingDays).toBe(SPECIES_TAGGING_DEADLINES.OVINE);
    expect(porcine!.params.taggingDays).toBe(SPECIES_TAGGING_DEADLINES.PORCINE);
    expect(equine!.params.taggingDays).toBe(SPECIES_TAGGING_DEADLINES.EQUINE);
  });

  it("speciesTaggingMaxDays returns the EU floor per species", () => {
    expect(speciesTaggingMaxDays("BOVINE")).toBe(20);
    expect(speciesTaggingMaxDays("OVINE")).toBe(270);
    expect(speciesTaggingMaxDays("CAPRINE")).toBe(270);
    expect(speciesTaggingMaxDays("PORCINE")).toBe(270);
    expect(speciesTaggingMaxDays("EQUINE")).toBe(365);
  });

  it("sovereign guard rejects a loosened per-species tagging deadline at build time", () => {
    expect(() =>
      buildRuleSet("MK", [...baseRows(), { code: "ART21_EQUINE_TAGGING_PARAM_taggingDays", value: "999" }]),
    ).toThrow(/Sovereign limit violated/);
  });
});

describe("isWithinTransmissionWindow (Art. 3)", () => {
  it("passes within the window and fails beyond it", () => {
    const event = "2026-07-01";
    expect(isWithinTransmissionWindow(event, "2026-07-03", 7)).toBe(true);
    expect(isWithinTransmissionWindow(event, "2026-07-10", 7)).toBe(false);
    expect(isWithinTransmissionWindow(event, "2026-06-20", 7)).toBe(false);
  });
});

describe("requiresDualCodeRecording (Art. 19(4))", () => {
  it("is false when codes match or jurisdiction disables it", () => {
    expect(requiresDualCodeRecording("12345678", "12345678", true)).toBe(false);
    expect(requiresDualCodeRecording("12345678", "87654321", false)).toBe(false);
  });
  it("is true when electronic ID differs and jurisdiction mandates dual-code", () => {
    expect(requiresDualCodeRecording("12345678", "87654321", true)).toBe(true);
  });
});

describe("EU_TRACEABILITY_FLOORS", () => {
  it("records the regulatory ceilings from Art. 3 / 12 / 13", () => {
    expect(EU_TRACEABILITY_FLOORS.transmissionMaxDays).toBe(7);
    expect(EU_TRACEABILITY_FLOORS.bovineTaggingMaxDays).toBe(20);
    expect(EU_TRACEABILITY_FLOORS.animalCodeMaxLength).toBe(12);
    expect(EU_TRACEABILITY_FLOORS.animalCodeNumericOnly).toBe(true);
    expect(EU_BIRTH_DEADLINES.notificationMaxDays).toBe(7);
  });
});

describe("buildRuleSet — RuleSet.features (WO-060 IoT gate)", () => {
  it("defaults features.iot = true when IOT_ENABLED is absent (backward-safe)", () => {
    const rs = buildRuleSet("MK", baseRows());
    expect(rs.features.iot).toBe(true);
  });

  it("honours IOT_ENABLED = false", () => {
    const rs = buildRuleSet("MK", [...baseRows(), { code: "IOT_ENABLED", value: "false" }]);
    expect(rs.features.iot).toBe(false);
  });

  it("honours IOT_ENABLED = true", () => {
    const rs = buildRuleSet("MK", [...baseRows(), { code: "IOT_ENABLED", value: "true" }]);
    expect(rs.features.iot).toBe(true);
  });
});
