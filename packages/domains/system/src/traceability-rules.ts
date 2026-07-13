// ── Traceability Rules Engine (ADR-0085) ──
// Implements the traceability obligations of **Commission Implementing Regulation (EU)
// 2021/520** (traceability of kept bovine, ovine, caprine and porcine animals) and
// **Commission Implementing Regulation (EU) 2021/963** (equine), as nationally
// transposed into Irish law by **S.I. No. 254 of 2023** (European Union (Animal
// Identification and Tracing) Regulations 2023). Each Article is a named, toggleable
// rule so a jurisdiction can enable/disable or re-parameterise it (choose what applies).
//
// Citation order (per Comrade directive): EU Commission regulation FIRST, then the local
// government transposition.
//   EU:    Commission Implementing Regulation (EU) 2021/520, Arts. 3, 12, 13, 14, 15, 17, 19
//           Commission Implementing Regulation (EU) 2021/963, Arts. 9, 14, 21 (equine)
//   Local:  S.I. No. 254 of 2023 — Reg. 11(5), 12(6), 13(5), 14(5), 17(2)(6)(7)
import type { RuleSetParamRow } from "./rule-set.js";

/** Species covered by the traceability framework (EU 2021/520 + 2021/963). */
export type TraceableSpecies =
  | "BOVINE"
  | "OVINE"
  | "CAPRINE"
  | "PORCINE"
  | "EQUINE";

/**
 * EU sovereignty floors for bovine birth I&R (R8, WO-120). Absolute MAXIMUMS: a RuleSet
 * may be stricter (<=) but NEVER looser. Delegated Reg (EU) 2019/2035 Art. 42 (tag <= 20
 * days of birth) + Implementing Reg (EU) 2021/520 Art. 14 (notify births/deaths/movements
 * <= 7 days). Named const — not inline.
 */
export const EU_BIRTH_DEADLINES = {
  taggingMaxDays: 20,
  notificationMaxDays: 7,
} as const;

/**
 * Implementing Reg (EU) 2021/520 — bovine/terrestrial-animal traceability floors
 * (Art. 3, 12, 13, 19). Absolute MAXIMUMS: a RuleSet may be stricter (<=) but never
 * looser. These are the regulatory ceilings the jurisdiction RuleSet must respect.
 */
export const EU_TRACEABILITY_FLOORS = {
  /** Art. 3 — max days to transmit a movement/birth/death to the database. */
  transmissionMaxDays: 7,
  /** Art. 13(1) — max days to apply the first means of identification after birth (bovine). */
  bovineTaggingMaxDays: 20,
  /** Art. 12(b) — max length of the unique animal code (numeric characters). */
  animalCodeMaxLength: 12,
  /** Art. 12(b) — the unique animal code is numeric only. */
  animalCodeNumericOnly: true,
} as const;

/**
 * Per-species first-identification (tagging) floors, in days. Source articles:
 *   BOVINE   — Implementing Reg (EU) 2021/520 Art. 13(1): 20 days or before leaving
 *               the holding of birth (whichever is earlier).
 *   OVINE    — Art. 14: 9 months (~270 days) or before leaving holding of birth.
 *   CAPRINE  — Art. 14: 9 months (~270 days) or before leaving holding of birth.
 *   PORCINE  — Art. 15: 9 months (~270 days).
 *   EQUINE    — Implementing Reg (EU) 2021/963 Art. 21: 12 months (~365 days) from birth
 *               or before leaving the establishment of birth. (Delegated Reg (EU) 2019/2035
 *               Art. 59(3)(b) sets a stricter 6-month floor for horses — a jurisdiction may
 *               apply that instead; the 365-day ceiling below is the 2021/963 maximum.)
 * Transposed: S.I. No. 254 of 2023 Reg. 11(5), 12(6), 13(5), 14(5).
 */
export const SPECIES_TAGGING_DEADLINES: Record<TraceableSpecies, number> = {
  BOVINE: 20,
  OVINE: 270,
  CAPRINE: 270,
  PORCINE: 270,
  EQUINE: 365,
};

/**
 * Per-species transmission/notification window floors, in days (Art. 3 of 2021/520 for
 * bovine/ovine/caprine/porcine; Art. 9 of 2021/963 for equine). All 7 days.
 * Transposed: S.I. No. 254 of 2023 Reg. 11(5)(a), 12(6)(a), 13(5)(a)(i), 14(5)(a).
 */
export const SPECIES_TRANSMISSION_DEADLINES: Record<TraceableSpecies, number> = {
  BOVINE: 7,
  OVINE: 7,
  CAPRINE: 7,
  PORCINE: 7,
  EQUINE: 7,
};

/** Max first-identification days for a species (EU floor). Default falls back to bovine 20. */
export function speciesTaggingMaxDays(
  species: TraceableSpecies,
  fallback: number = EU_BIRTH_DEADLINES.taggingMaxDays,
): number {
  return SPECIES_TAGGING_DEADLINES[species] ?? fallback;
}

/** Art. 3 — is a movement/birth/death event reported within the transmission window?
 *  `eventDate` = the movement/birth/death date; `reportedAt` = when it was entered
 *  (defaults to now). Returns true when |reportedAt - eventDate| <= maxDays. */
export function isWithinTransmissionWindow(
  eventDate: Date | string,
  reportedAt: Date | string,
  maxDays: number,
): boolean {
  const e = typeof eventDate === "string" ? new Date(eventDate) : eventDate;
  const r = typeof reportedAt === "string" ? new Date(reportedAt) : reportedAt;
  const days = Math.abs((r.getTime() - e.getTime()) / (1000 * 60 * 60 * 24));
  return days <= maxDays;
}

/** Art. 19(4) — does replacing the means of identification require BOTH the visual and the
 *  electronic code to be recorded? True when the jurisdiction mandates dual-code retention
 *  and the electronic ID cannot reproduce the visual code verbatim (technical limit). */
export function requiresDualCodeRecording(
  visualCode: string,
  electronicCode: string,
  requireDualCodeOnReplacement: boolean,
): boolean {
  if (!requireDualCodeOnReplacement) return false;
  return visualCode !== electronicCode;
}

export type TraceabilityRuleId =
  | "ART3_TRANSMISSION_WINDOW"
  | "ART12_NUMERIC_CODE"
  | "ART13_TAG_BEFORE_MOVE"
  | "ART13_BOVINE_TAGGING"
  | "ART14_OVINE_CAPRINE_TAGGING"
  | "ART15_PORCINE_TAGGING"
  | "ART21_EQUINE_TAGGING"
  | "ART19_DUAL_CODE_ON_REPLACEMENT";

/** Maps a species to its first-identification (tagging) rule id. */
export const SPECIES_TAGGING_RULE: Record<TraceableSpecies, TraceabilityRuleId> = {
  BOVINE: "ART13_BOVINE_TAGGING",
  OVINE: "ART14_OVINE_CAPRINE_TAGGING",
  CAPRINE: "ART14_OVINE_CAPRINE_TAGGING",
  PORCINE: "ART15_PORCINE_TAGGING",
  EQUINE: "ART21_EQUINE_TAGGING",
};

export interface TraceabilityRule {
  id: TraceabilityRuleId;
  article: string;
  title: string;
  description: string;
  enabled: boolean;
  params: Record<string, string | number | boolean>;
}

/**
 * The four implementing-Regulation Articles, plus per-species first-identification rules,
 * all ENABLED at their EU floors by default. Toggle/re-tune any of them via
 * `system_parameters` (`<RULE_ID>_ENABLED`, `<RULE_ID>_PARAM_<key>`).
 */
export const DEFAULT_TRACABILITY_RULES: TraceabilityRule[] = [
  {
    id: "ART3_TRANSMISSION_WINDOW",
    article: "Art. 3 (2021/520)",
    title: "Transmission window",
    description:
      "Operator must transmit movements/births/deaths to the database within 7 days. " +
      "Transposed: S.I. No. 254 of 2023 Reg. 11(5)(a), 12(6)(a), 13(5)(a)(i), 14(5)(a).",
    enabled: true,
    params: { transmissionDeadlineDays: EU_TRACEABILITY_FLOORS.transmissionMaxDays },
  },
  {
    id: "ART12_NUMERIC_CODE",
    article: "Art. 12 (2021/520)",
    title: "Numeric animal code",
    description:
      "Unique identification code = ISO 3166-1 alpha-2 or numeric country code + the animal's " +
      "own numeric code (max 12 characters). Enforced by the validators' makeEarTagSchema " +
      "(format from RuleSetTag.format).",
    enabled: true,
    params: {
      animalCodeMaxLength: EU_TRACEABILITY_FLOORS.animalCodeMaxLength,
      animalCodeNumericOnly: EU_TRACEABILITY_FLOORS.animalCodeNumericOnly,
    },
  },
  {
    id: "ART13_TAG_BEFORE_MOVE",
    article: "Art. 13(4) (2021/520)",
    title: "Tag before move (all kept terrestrial animals)",
    description:
      "No kept terrestrial animal may leave its holding until identified with an approved means " +
      "of identification. Transposed for all species: S.I. No. 254 of 2023 Reg. 17(6) & (7) " +
      "(possession/acquisition/move/sale/slaughter only if identified).",
    enabled: true,
    params: {},
  },
  {
    id: "ART13_BOVINE_TAGGING",
    article: "Art. 13(1) (2021/520)",
    title: "Bovine first identification",
    description:
      "Bovine identified within 20 days of birth or before leaving the holding of birth, " +
      "whichever is earlier. Transposed: S.I. No. 254 of 2023 Reg. 11(5)(b).",
    enabled: true,
    params: { taggingDays: SPECIES_TAGGING_DEADLINES.BOVINE },
  },
  {
    id: "ART14_OVINE_CAPRINE_TAGGING",
    article: "Art. 14 (2021/520)",
    title: "Ovine/Caprine first identification",
    description:
      "Ovine and caprine identified within 9 months of birth or before leaving the holding of " +
      "birth, whichever is earlier. Transposed: S.I. No. 254 of 2023 Reg. 12(6)(b).",
    enabled: true,
    params: { taggingDays: SPECIES_TAGGING_DEADLINES.OVINE },
  },
  {
    id: "ART15_PORCINE_TAGGING",
    article: "Art. 15 (2021/520)",
    title: "Porcine first identification",
    description:
      "Porcine identified within 9 months of birth or before leaving the holding of birth. " +
      "Transposed: S.I. No. 254 of 2023 Reg. 14(5)(b).",
    enabled: true,
    params: { taggingDays: SPECIES_TAGGING_DEADLINES.PORCINE },
  },
  {
    id: "ART21_EQUINE_TAGGING",
    article: "Art. 21 (2021/963)",
    title: "Equine first identification",
    description:
      "Equine identified within 12 months of birth or before leaving the establishment of birth. " +
      "(Delegated Reg (EU) 2019/2035 Art. 59(3)(b) sets a stricter 6-month alternative.) " +
      "Transposed: S.I. No. 254 of 2023 Reg. 13(5)(a)(v).",
    enabled: true,
    params: { taggingDays: SPECIES_TAGGING_DEADLINES.EQUINE },
  },
  {
    id: "ART19_DUAL_CODE_ON_REPLACEMENT",
    article: "Art. 19(4) (2021/520)",
    title: "Dual-code on replacement",
    description:
      "When an electronic identifier cannot reproduce the visual code, BOTH codes must be recorded " +
      "on replacement of the means of identification (replace within 7 days — S.I. No. 254 of 2023 " +
      "Reg. 17(2), Art. 19(1)). Armed in the engine; enforced when the ear-tag replacement " +
      "service flow exists.",
    enabled: true,
    params: {},
  },
];

/**
 * Merge seeded `system_parameters` over the defaults so a jurisdiction can enable/disable or
 * re-parameterise each Article independently. Convention:
 *   `<RULE_ID>_ENABLED`         = "true" | "false"
 *   `<RULE_ID>_PARAM_<KEY>`      = value (e.g. ART3_TRANSMISSION_WINDOW_PARAM_transmissionDeadlineDays=14)
 */
export function resolveTraceabilityRules(rows: readonly RuleSetParamRow[]): TraceabilityRule[] {
  return DEFAULT_TRACABILITY_RULES.map((rule) => {
    const base: TraceabilityRule = { ...rule, params: { ...rule.params } };
    const enabled = rows.find((r) => r.code === `${rule.id}_ENABLED`)?.value;
    if (enabled !== undefined) base.enabled = enabled !== "false";
    for (const key of Object.keys(rule.params)) {
      const override = rows
        .find((r) => r.code.toUpperCase() === `${rule.id}_PARAM_${key.toUpperCase()}`)
        ?.value;
      if (override !== undefined) {
        base.params[key] = Number.isNaN(Number(override)) ? override : Number(override);
      }
    }
    return base;
  });
}

/** Query helpers over the resolved rule registry. */
export const TraceabilityRuleEngine = {
  getRule(rules: TraceabilityRule[], id: TraceabilityRuleId): TraceabilityRule | undefined {
    return rules.find((r) => r.id === id);
  },
  isEnabled(rules: TraceabilityRule[], id: TraceabilityRuleId): boolean {
    return this.getRule(rules, id)?.enabled ?? false;
  },
  getParam<T extends string | number | boolean>(
    rules: TraceabilityRule[],
    id: TraceabilityRuleId,
    key: string,
    fallback: T,
  ): T {
    const rule = this.getRule(rules, id);
    const value = rule?.params[key];
    return value === undefined ? fallback : (value as T);
  },
};
