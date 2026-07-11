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
export function buildRuleSet(
  jurisdiction: string,
  rows: ReadonlyArray<RuleSetParamRow>,
): RuleSet {
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

  return {
    jurisdiction,
    farmerCanAdminister: byCode.get("FARMER_CAN_ADMINISTER")?.value !== "false",
    retention: {
      cpc: num("RETENTION_YEARS_CPC"),
      vs: num("RETENTION_YEARS_VS"),
      vi: num("RETENTION_YEARS_VI"),
      bip: num("RETENTION_YEARS_BIP"),
    },
    roleVocab: (byCode.get("ROLE_VOCAB")?.value ?? "owner,keeper,veterinarian,trader,slaughterhouse_op,market_op,technician,guardian").split(","),
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
  };
}
