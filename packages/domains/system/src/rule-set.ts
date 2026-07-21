// ── RuleSet Resolver (ADR-0030) ──
//
// Aggregates the seeded `system_parameters` (MK defaults) into the structured
// RuleSet that domain services consume in WO-012, replacing hardcoded
// module-level constants (the B2 gap). No new table: the flat `system_parameters`
// store + `modules` (features) + `codeTables` (vocab) already constitute the
// RuleSet; this is the typed view over them. `features`/`vocab`/`retention`
// dimensions are added as WO-014 / WO-060 land.

export interface RuleSetThresholds {
  orderIntervalDays: number;
  maxOrdersPerYear: number;
  minVaccinationAgeDays: number;
  slaughterMinAgeDays: number;
  stillbornThresholdDays: number;
  arrivalCorrectionDays: number;
  minMotherAgeMonths: number;
  calvingPeriodDays: number;
  /** Birth-tagging deadline in days (WO-022 / R8). EU floor 20; jurisdiction may be stricter. */
  taggingDays: number;
  /** Birth-notification deadline in days (WO-022 / R8). EU floor 7; jurisdiction may be stricter. */
  notificationDays: number;
  /** Disease-zone restriction radii (WO-119, AHL 2016/429 Art.21-22). Protection zone around infected premises. EU floor 3 km. */
  protectionZoneKm: number;
  /** Surveillance zone radius in km (EU floor 10). Concentric with the protection zone. */
  surveillanceZoneKm: number;
  /** Whether the disease-zone spatial block is enforced (WO-119). Default true. */
  diseaseZoneEnabled: boolean;
}

export interface RuleSetRetention {
  /** Retention years per archive tier (ADR-0030): cpc / vs / vi / bip. Default 3. */
  cpc: number;
  vs: number;
  vi: number;
  bip: number;
}

export interface RuleSetWeights {
  /** Annual risk-analysis farm selection percentage (default 10). */
  selectionPercentage: number;
  /** Risk weight: farm size (default 0.3). */
  farmSize: number;
  /** Risk weight: inspection history (default 0.3). */
  history: number;
  /** Risk weight: species diversity (default 0.2). */
  species: number;
  /** Risk weight: regional random factor (default 0.2). */
  region: number;
}

export interface RuleSetTraceability {
  /** Max BFS depth for the lineage graph (R6, EC 178/2002). Bounds parent/offspring recursion. */
  maxDepth: number;
  /** Traceability record retention years (R3, FSMA + R6). Default 2. */
  retentionYears: number;
}

export interface RuleSetFsma {
  /** CTE KDE export format (R3, FSMA 204). Default json. */
  cteExportFormat: string;
  /** Response SLA for KDE export in hours (R3, FSMA 204 <= 24h). Default 24. */
  responseSlaHours: number;
}

export interface RuleSetImsoc {
  /** Whether CHED-A generation is enabled for this jurisdiction (WO-121 / R9 IMSOC 2019/1715). */
  enabled: boolean;
  /** TRACES NT import format for the CHED document. Default xml. */
  chedFormat: string;
  /** CHED schema version served to TRACES NT. */
  schemaVersion: string;
  /** Default EU Border Control Post the consignment enters (TRACES NT). */
  destinationBcp: string;
  /** Block CHED if the animal has an active treatment withdrawal period (ties WO-113). */
  requireWithdrawalClear: boolean;
  /** Block CHED if the animal has no passport. */
  requirePassport: boolean;
  /** Block CHED if required vaccinations are missing. */
  requireVaccinations: boolean;
  /** Block CHED if the animal / source holding is under an active disease hold (ties WO-119). */
  requireDiseaseClear: boolean;
}

/** EUDR 2023/1115 due-diligence config (WO-115, R1). */
export interface RuleSetEudr {
  /** Whether EUDR due-diligence is enforced for this jurisdiction. */
  enabled: boolean;
  /** Deforestation cutoff — land deforested after this date fails the EUDR overlay. Default 2020-12-31. */
  deforestationCutoffDate: string;
}

/** Per-jurisdiction feature flags (WO-060 IoT gate, etc.). Defaults are
 *  backward-safe (true) so existing behaviour is preserved until a jurisdiction
 *  opts out. Each flag can be toggled via a `system_parameters` row
 *  (`<FEATURE>_ENABLED` = "true" | "false"). */
export interface RuleSetFeatures {
  /** IoT device-registry + sensor-readings surfaces (WO-060). Default true. */
  iot: boolean;
}

export interface RuleSetTag {
  /** Ear-tag format for the jurisdiction (WO-118, R2): ISO_11784_15 (15-digit ISO 11784/11785) or MK_8 (8-digit MK national). */
  format: string;
  /** ISO 3166-1 numeric country prefix for ISO_11784_15 (e.g. "840" = USA, "807" = MK). */
  prefix: string;
}

export interface RuleSetWelfare {
  /** Calves younger than this (days) are treated as unweaned for transport branching (EC 1/2005). */
  unweanedMaxAgeDays: number;
  /** A single transport leg spanning >= this many days exceeds the species single-leg max (14h adult / 9h unweaned). */
  maxSingleLegDays: number;
  /** A journey spanning >= this many days exceeds the 28h ceiling (14h+rest+14h) without rest legs. */
  multiDayMaxDays: number;
  /** A journey spanning >= this many days requires a rest-stop leg (parentMovementId). */
  restStopAfterDays: number;
}

export interface RuleSet {
  /** Jurisdiction code this RuleSet represents (MK = seeded default). */
  jurisdiction: string;
  /** Per-jurisdiction farmer-administer flag (ADR-0030). Default true when absent. */
  farmerCanAdminister: boolean;
  /** Per-tier retention years (ADR-0030 WO-014). Default 3 when absent. */
  retention: RuleSetRetention;
  /** Subject-role vocabulary for the jurisdiction (ADR-0030 WO-014). */
  roleVocab: string[];
  /** Roles permitted to administer (vaccinate/register) — overridable per jurisdiction (B3 VI). */
  administerRoles: string[];
  thresholds: RuleSetThresholds;
  weights: RuleSetWeights;
  /** Transport-welfare maxima (WO-114, EC 1/2005 Ch.V). Day-granular; hour-precise needs timestamps. */
  welfare: RuleSetWelfare;
  /** Ear-tag format config (WO-118, R2 USDA APHIS ADT). */
  tag: RuleSetTag;
  /** Traceability graph config (WO-116, R6 EC 178/2002). */
  traceability: RuleSetTraceability;
  /** Named, toggleable traceability rules (ADR-0085, Implementing Reg (EU) 2021/520).
   *  Each Article (Art. 3 / 12 / 13 / 19) is a registry entry the jurisdiction can
   *  enable/disable or re-parameterise via `system_parameters`. */
  traceabilityRules: TraceabilityRule[];
  /** FSMA 204 KDE export config (WO-116, R3). */
  fsma: RuleSetFsma;
  /** IMSOC / CHED-A config (WO-121, R9). */
  imsoc: RuleSetImsoc;
  /** EUDR 2023/1115 due-diligence config (WO-115, R1). */
  eudr: RuleSetEudr;
  /** Per-jurisdiction feature flags (WO-060 IoT gate, etc.). Default-on, opt-out. */
  features: RuleSetFeatures;
  /** Whether this jurisdiction aligns with EU cattle I&R mandates (R8). When true, birth deadlines may not be loosened below the EU floor. */
  euAligned: boolean;
}

/** WO-114 default transport-welfare maxima (EC 1/2005 Ch.V, day-granular).
 *  Overridable per jurisdiction via system_parameters; these are only fallback
 *  defaults when a jurisdiction has not seeded the WELFARE_* params. Not inline. */
export const WELFARE_DEFAULTS = {
  unweanedMaxAgeDays: 120,
  maxSingleLegDays: 1,
  multiDayMaxDays: 2,
  restStopAfterDays: 1,
} as const;

/** MK ISO 3166-1 numeric country code (North Macedonia). Used as the default ISO prefix for MK_8 tags. */
export const MK_ISO_COUNTRY_CODE = "807" as const;

// ── Traceability rules engine (ADR-0085) ──
// The four Implementing Reg (EU) 2021/520 Articles are a named, toggleable rule
// registry so a jurisdiction can enable/disable or re-parameterise each one. The
// symbols below are defined in `traceability-rules.ts`; re-exported here so existing
// importers (tests, services) are unaffected.
import {
  EU_BIRTH_DEADLINES,
  resolveTraceabilityRules,
  SPECIES_TAGGING_DEADLINES,
  SPECIES_TAGGING_RULE,
  type TraceableSpecies,
  type TraceabilityRule,
} from "./traceability-rules.js";

export {
  EU_BIRTH_DEADLINES,
  EU_TRACEABILITY_FLOORS,
  isWithinTransmissionWindow,
  requiresDualCodeRecording,
  resolveTraceabilityRules,
  TraceabilityRuleEngine,
  DEFAULT_TRACABILITY_RULES,
  SPECIES_TAGGING_DEADLINES,
  SPECIES_TAGGING_RULE,
  SPECIES_TRANSMISSION_DEADLINES,
  speciesTaggingMaxDays,
  type TraceableSpecies,
  type TraceabilityRule,
  type TraceabilityRuleId,
} from "./traceability-rules.js";

/** Minimal shape of a `system_parameters` row needed to build a RuleSet. */
export interface RuleSetParamRow {
  code: string;
  value: string;
}

/** Codes that MUST be present for a valid RuleSet; absence is a defect. */
export const REQUIRED_RULESET_CODES = [
  "ORDER_INTERVAL_DAYS",
  "MAX_ORDERS_PER_YEAR",
  "MIN_VACCINATION_AGE_DAYS",
  "SLAUGHTER_MIN_AGE_DAYS",
  "STILLBORN_THRESHOLD_DAYS",
  "ARRIVAL_CORRECTION_DAYS",
  "MIN_MOTHER_AGE_MONTHS",
  "CALVING_PERIOD_DAYS",
  "SELECTION_PERCENTAGE",
  "FARM_SIZE_WEIGHT",
  "HISTORY_WEIGHT",
  "SPECIES_WEIGHT",
  "REGION_WEIGHT",
] as const;

/**
 * Build a typed RuleSet from seeded parameter rows. Pure + synchronous so it can
 * be unit-tested without a DB. Throws on any missing or non-numeric required code.
 */
export function buildRuleSet(jurisdiction: string, rows: ReadonlyArray<RuleSetParamRow>): RuleSet {
  const byCode = new Map(rows.map((r) => [r.code, r]));
  const num = (code: string): number => {
    const row = byCode.get(code);
    if (!row) throw new Error(`RuleSet missing required system parameter: ${code}`);
    const n = Number(row.value);
    if (Number.isNaN(n)) {
      throw new Error(`RuleSet parameter ${code} is not numeric: ${row.value}`);
    }
    return n;
  };

  const wParam = (code: string, fallback: number): number => {
    const row = byCode.get(code);
    if (!row) return fallback;
    const n = Number(row.value);
    return Number.isNaN(n) ? fallback : n;
  };

  const ruleSet: RuleSet = {
    jurisdiction,
    farmerCanAdminister: byCode.get("FARMER_CAN_ADMINISTER")?.value !== "false",
    retention: {
      cpc: num("RETENTION_YEARS_CPC"),
      vs: num("RETENTION_YEARS_VS"),
      vi: num("RETENTION_YEARS_VI"),
      bip: num("RETENTION_YEARS_BIP"),
    },
    roleVocab: (
      byCode.get("ROLE_VOCAB")?.value ??
      "owner,keeper,veterinarian,trader,slaughterhouse_op,market_op,technician,guardian"
    ).split(","),
    administerRoles: (byCode.get("ADMINISTER_ROLES")?.value ?? "veterinarian").split(","),
    thresholds: {
      orderIntervalDays: num("ORDER_INTERVAL_DAYS"),
      maxOrdersPerYear: num("MAX_ORDERS_PER_YEAR"),
      minVaccinationAgeDays: num("MIN_VACCINATION_AGE_DAYS"),
      slaughterMinAgeDays: num("SLAUGHTER_MIN_AGE_DAYS"),
      stillbornThresholdDays: num("STILLBORN_THRESHOLD_DAYS"),
      arrivalCorrectionDays: num("ARRIVAL_CORRECTION_DAYS"),
      minMotherAgeMonths: num("MIN_MOTHER_AGE_MONTHS"),
      calvingPeriodDays: num("CALVING_PERIOD_DAYS"),
      taggingDays: wParam("BIRTH_TAGGING_DAYS", EU_BIRTH_DEADLINES.taggingMaxDays),
      notificationDays: wParam("BIRTH_NOTIFICATION_DAYS", EU_BIRTH_DEADLINES.notificationMaxDays),
      protectionZoneKm: wParam("PROTECTION_ZONE_KM", 3),
      surveillanceZoneKm: wParam("SURVEILLANCE_ZONE_KM", 10),
      diseaseZoneEnabled: byCode.get("DISEASE_ZONE_ENABLED")?.value !== "false",
    },
    weights: {
      selectionPercentage: num("SELECTION_PERCENTAGE"),
      farmSize: num("FARM_SIZE_WEIGHT"),
      history: num("HISTORY_WEIGHT"),
      species: num("SPECIES_WEIGHT"),
      region: num("REGION_WEIGHT"),
    },
    welfare: {
      unweanedMaxAgeDays: wParam("WELFARE_UNWEANED_MAX_AGE_DAYS", WELFARE_DEFAULTS.unweanedMaxAgeDays),
      maxSingleLegDays: wParam("WELFARE_MAX_SINGLE_LEG_DAYS", WELFARE_DEFAULTS.maxSingleLegDays),
      multiDayMaxDays: wParam("WELFARE_MULTI_DAY_MAX_DAYS", WELFARE_DEFAULTS.multiDayMaxDays),
      restStopAfterDays: wParam("WELFARE_REST_STOP_AFTER_DAYS", WELFARE_DEFAULTS.restStopAfterDays),
    },
    tag: {
      format: byCode.get("TAG_FORMAT")?.value ?? "MK_8",
      prefix: byCode.get("TAG_PREFIX")?.value ?? MK_ISO_COUNTRY_CODE,
    },
    euAligned: byCode.get("EU_ALIGNED")?.value !== "false",
    traceability: {
      maxDepth: wParam("TRACEABILITY_MAX_DEPTH", 10),
      retentionYears: wParam("TRACEABILITY_RETENTION_YEARS", 2),
    },
    traceabilityRules: resolveTraceabilityRules(rows),
    fsma: {
      cteExportFormat: byCode.get("FSMA_CTE_EXPORT_FORMAT")?.value ?? "json",
      responseSlaHours: wParam("FSMA_RESPONSE_SLA_HOURS", 24),
    },
    imsoc: {
      enabled: byCode.get("IMSOC_ENABLED")?.value !== "false",
      chedFormat: byCode.get("IMSOC_CHED_FORMAT")?.value ?? "xml",
      schemaVersion: byCode.get("IMSOC_SCHEMA_VERSION")?.value ?? "1.0",
      destinationBcp: byCode.get("IMSOC_DESTINATION_BCP")?.value ?? "",
      requireWithdrawalClear: byCode.get("IMSOC_REQUIRE_WITHDRAWAL_CLEAR")?.value !== "false",
      requirePassport: byCode.get("IMSOC_REQUIRE_PASSPORT")?.value !== "false",
      requireVaccinations: byCode.get("IMSOC_REQUIRE_VACCINATIONS")?.value !== "false",
      requireDiseaseClear: byCode.get("IMSOC_REQUIRE_DISEASE_CLEAR")?.value !== "false",
    },
    eudr: {
      enabled: byCode.get("EUDR_ENABLED")?.value !== "false",
      deforestationCutoffDate: byCode.get("EUDR_DEFORESTATION_CUTOFF_DATE")?.value ?? "2020-12-31",
    },
    features: {
      // WO-060: IoT surfaces. Default true (backward-safe) so existing behaviour
      // is preserved; a jurisdiction opts out via IOT_ENABLED = "false". The IOT
      // `modules` seed row (isActive=false) drives this flag via the
      // IOT_ENABLED system parameter in production.
      iot: byCode.get("IOT_ENABLED")?.value !== "false",
    },
  };
  validateSovereignLimits(ruleSet);
  return ruleSet;
}

/**
 * WO-120 — Sovereign RuleSet guard (R8). When a jurisdiction aligns with EU cattle
 * I&R mandates, birth-tagging / birth-notification deadlines may be STRICTER than the
 * EU floor but NEVER looser. A config that loosens them is a sovereignty violation and
 * is rejected at RuleSet build time (the Elixir SovereignRuleValidator, translated to TS).
 */
export function validateSovereignLimits(ruleSet: RuleSet): void {
  if (!ruleSet.euAligned) return;
  if (ruleSet.thresholds.taggingDays > EU_BIRTH_DEADLINES.taggingMaxDays) {
    throw new Error(
      `Sovereign limit violated: taggingDays ${ruleSet.thresholds.taggingDays} > EU floor ${EU_BIRTH_DEADLINES.taggingMaxDays} (Delegated Reg (EU) 2019/2035 Art. 42)`,
    );
  }
  if (ruleSet.thresholds.notificationDays > EU_BIRTH_DEADLINES.notificationMaxDays) {
    throw new Error(
      `Sovereign limit violated: notificationDays ${ruleSet.thresholds.notificationDays} > EU floor ${EU_BIRTH_DEADLINES.notificationMaxDays} (Implementing Reg (EU) 2021/520 Art. 14)`,
    );
  }
  // Per-species first-identification (tagging) floors (2021/520 Art. 13/14/15, 2021/963 Art. 21).
  // A jurisdiction may be stricter (<=) but never loosen a species deadline.
  for (const species of Object.keys(SPECIES_TAGGING_DEADLINES) as TraceableSpecies[]) {
    const ruleId = SPECIES_TAGGING_RULE[species];
    const rule = ruleSet.traceabilityRules.find((r) => r.id === ruleId);
    if (!rule) continue;
    const param = rule.params.taggingDays;
    const floor = SPECIES_TAGGING_DEADLINES[species];
    if (typeof param === "number" && param > floor) {
      throw new Error(
        `Sovereign limit violated: ${species} taggingDays ${param} > EU floor ${floor} ` +
          `(Implementing Reg (EU) 2021/520 Art. 13/14/15, 2021/963 Art. 21)`,
      );
    }
  }
}
