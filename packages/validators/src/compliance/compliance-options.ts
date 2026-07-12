// ── Compliance Options — Diamond Seal ──
//
// Governance open questions modeled as TRI-STATE values (ADR-0081 §"governance
// as config"). Each question from ADR-0081 / ADR-0061 / ADR-0067 is no longer a
// free-floating "answer pending" item — it is a decision that can be SET per
// circumstance (jurisdiction / deployment / RuleSet):
//
//   BOOLEAN option:  true => ON,  false => OFF,  undefined => UNDECIDED
//   NUMERIC option:  number => SET (slider value),  undefined => UNDECIDED
//
// `undefined` is the default posture: the system captures the truth and emits a
// plausibility event, rather than refusing input whose governing rule is still
// undecided. This is the accept-and-flag doctrine applied to governance itself.
// Numeric options back UI sliders (e.g. transport-window hours, gestation days).

import { z } from "zod";

/** A single governance decision: decided (true/false) or undecided (undefined). */
export const complianceOptionSchema = z.boolean().optional();
export type ComplianceOption = z.infer<typeof complianceOptionSchema>;

/** A numeric tolerance (slider value): set (>=0) or undecided (undefined). */
export const complianceToleranceSchema = z.number().min(0).optional();
export type ComplianceTolerance = z.infer<typeof complianceToleranceSchema>;

/** Shape of the full compliance-options surface. All fields are tri-state. */
export interface ComplianceOptions {
  // ── ADR-0081: Accept-and-Flag Validation Doctrine (boolean gates) ──
  deadAnimalCannotMove?: boolean; // WO-124 (Tier-1 invariant)
  seizureLock?: boolean; // WO-124 (Tier-1 invariant)
  offSystemBuyerDiseaseTrace?: boolean; // WO-125
  notifySuspiciousEartag?: boolean; // WO-126
  enforceSlaughterTransportWindow?: boolean; // WO-127 (gate; threshold below)
  requireSlaughterhouseTagReturn?: boolean; // WO-128
  vetProcessesLostDestroyedTag?: boolean; // WO-129
  allowNullableToFarmId?: boolean; // WO-130
  trackCarcassMeat?: boolean; // WO-131
  takeoverFileDerivedFromOrder?: boolean; // WO-132
  // ── ADR-0061: GDPR Right-to-be-Forgotten (boolean gates) ──
  gdprApplies?: boolean; // WO-133 (may be false in non-EU markets)
  requireMkNationalActs?: boolean; // WO-134
  requireDsarIdentityVerification?: boolean; // WO-135
  allowBreakGlassAccess?: boolean; // WO-136
  requireSigningKeyCustody?: boolean; // WO-137 (ISO 27701, NOT law)
  rotatePseudonymOnErasure?: boolean; // WO-138
  physicallyDeleteOnErasure?: boolean; // WO-139 (default FALSE — never delete rows)
  requireFarmerConsent?: boolean; // WO-140 (consent fantasy; default FALSE)
  conformToIso27701?: boolean; // WO-141 (ISO standard, NOT law; default FALSE)
  // ── Numeric tolerances (sliders) ──
  slaughterTransportWindowHours?: number; // WO-127 (8h ratified; slider threshold)
  gestationToleranceDays?: number; // how long a cow may carry a calf; WO-071 (365 vs 120 divergence)
  calvingGapMinDays?: number; // WO-071 (lower bound of plausible calving gap)
  calvingGapMaxDays?: number; // WO-071 (upper bound of plausible calving gap)
}

export const complianceOptionsSchema: z.ZodType<ComplianceOptions> = z.object({
    deadAnimalCannotMove: complianceOptionSchema,
    seizureLock: complianceOptionSchema,
    offSystemBuyerDiseaseTrace: complianceOptionSchema,
    notifySuspiciousEartag: complianceOptionSchema,
    enforceSlaughterTransportWindow: complianceOptionSchema,
    requireSlaughterhouseTagReturn: complianceOptionSchema,
    vetProcessesLostDestroyedTag: complianceOptionSchema,
    allowNullableToFarmId: complianceOptionSchema,
    trackCarcassMeat: complianceOptionSchema,
    takeoverFileDerivedFromOrder: complianceOptionSchema,
    gdprApplies: complianceOptionSchema,
    requireMkNationalActs: complianceOptionSchema,
    requireDsarIdentityVerification: complianceOptionSchema,
    allowBreakGlassAccess: complianceOptionSchema,
    requireSigningKeyCustody: complianceOptionSchema,
    rotatePseudonymOnErasure: complianceOptionSchema,
    physicallyDeleteOnErasure: complianceOptionSchema,
    requireFarmerConsent: complianceOptionSchema,
    conformToIso27701: complianceOptionSchema,
    slaughterTransportWindowHours: complianceToleranceSchema,
    gestationToleranceDays: complianceToleranceSchema,
    calvingGapMinDays: complianceToleranceSchema,
    calvingGapMaxDays: complianceToleranceSchema,
});

/**
 * Default posture: EVERY option UNDECIDED (undefined) => accept-and-flag.
 * The four hard operational realities + the one ratified threshold are pre-set
 * so the system never drifts into the bureaucrat's fantasy:
 *   - physicallyDeleteOnErasure = false  → we never delete records; only cow *images* may go
 *   - requireFarmerConsent      = false  → universal farmer consent contracts are unrealistic
 *   - conformToIso27701         = false  → ISO/IEC 27701 is a voluntary standard, not law
 *   - requireSigningKeyCustody  = false  → Ed25519 custody is ISO best-practice, not a GDPR mandate
 *   - slaughterTransportWindowHours = 8  → WO-127 ratified max 8h live→slaughterhouse
 */
export const COMPLIANCE_OPTIONS_DEFAULTS: ComplianceOptions = {
  physicallyDeleteOnErasure: false,
  requireFarmerConsent: false,
  conformToIso27701: false,
  requireSigningKeyCustody: false,
  slaughterTransportWindowHours: 8,
};

/** Classification of a boolean option's decision state. */
export type OptionState = "on" | "off" | "undecided";

/** Classification of a numeric tolerance's decision state. */
export type ToleranceState = "set" | "undecided";

/**
 * Resolve a boolean option against a circumstance.
 * `undefined` => UNDECIDED => return `"undecided"` so the caller ACCEPTS the
 * input and FLAGS it (emits a plausibility event) instead of blocking. The
 * caller owns the flag/event; this helper only classifies the decision.
 */
export function resolveComplianceOption(value: ComplianceOption): OptionState {
  if (value === true) return "on";
  if (value === false) return "off";
  return "undecided";
}

/**
 * Resolve a numeric tolerance against a circumstance.
 * `undefined` => UNDECIDED => return `"undecided"` so the caller ACCEPTS and
 * FLAGS (e.g. an out-of-range transport time) rather than blocking.
 */
export function resolveComplianceTolerance(value: ComplianceTolerance): ToleranceState {
  return value === undefined ? "undecided" : "set";
}
