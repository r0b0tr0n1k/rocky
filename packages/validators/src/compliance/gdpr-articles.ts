/**
 * GDPR (EU) <-> MK LPDP (North Macedonia) <-> AL Law 124 (Albania)
 * validated cross-walk -- an ENGINEERING REFERENCE, not legal advice.
 *
 * Homework artifact for ADR-0061 (GDPR Right-to-be-Forgotten vs Mandatory
 * Retention). It exists so Rocky's PII handling can cite canonical article IDs
 * for AUDIT / DOCUMENTATION only. It is never used to enforce anything.
 *
 * Source of truth for the validated set:
 *   graphgrc-main/mappings/golden_mappings.yaml
 *   (15 unified concepts, 100% validated per that project's own audit).
 *
 * ISO/IEC 27701 equivalences are INTENTIONALLY OMITTED: they live only in
 * the broader, partially-validated mapping set, not the golden subset. When a
 * lawyer competent in both technology and data-protection law reviews them,
 * extend `ValidatedCrossWalk.iso27701`. Until then: pending.
 */

export const GDPR_ARTICLES = {
  ART_04: "Definitions",
  ART_05: "Principles relating to processing of personal data",
  ART_06: "Lawfulness of processing",
  ART_07: "Conditions for consent",
  ART_09: "Processing of special categories of personal data",
  ART_12: "Transparent information, communication and modalities for the exercise of the rights of the data subject",
  ART_13: "Information to be provided where personal data are collected from the data subject",
  ART_14: "Information to be provided where personal data have not been obtained from the data subject",
  ART_15: "Right of access by the data subject",
  ART_16: "Right to rectification",
  ART_17: "Right to erasure (right to be forgotten)",
  ART_18: "Right to restriction of processing",
  ART_20: "Right to data portability",
  ART_21: "Right to object",
  ART_22: "Automated individual decision-making, including profiling",
  ART_25: "Data protection by design and by default",
  ART_28: "Processor",
  ART_30: "Records of processing activities",
  ART_32: "Security of processing",
  ART_33: "Notification of a personal data breach to the supervisory authority",
  ART_34: "Communication of a personal data breach to the data subject",
  ART_35: "Data protection impact assessment",
  ART_37: "Designation of the data protection officer",
  ART_44: "General principle for transfers",
  ART_82: "Compensation and liability",
} as const;

export type GdprArticleId = keyof typeof GDPR_ARTICLES;

export interface CrossWalkEntry {
  /** Human label for the unified concept the three articles express. */
  concept: string;
  gdpr: GdprArticleId;
  /** Macedonian LPDP article, e.g. "MK_LPDP_ART_21". */
  mkLpdp: string;
  /** Albanian Law 124 article, e.g. "AL_124_ART_17". */
  alLaw124: string;
  /** ISO/IEC 27701 clause -- pending expert review (see header). */
  iso27701?: string;
  validated: true;
}

/**
 * The validated subset. Each row is one "unified concept" with its three
 * legislative legs. Sourced verbatim from graphgrc-main golden_mappings.yaml.
 */
export const VALIDATED_CROSSWALK: CrossWalkEntry[] = [
  { concept: "Principles of Processing", gdpr: "ART_05", mkLpdp: "MK_LPDP_ART_09", alLaw124: "AL_124_ART_06", validated: true },
  { concept: "Lawfulness of Processing", gdpr: "ART_06", mkLpdp: "MK_LPDP_ART_10", alLaw124: "AL_124_ART_07", validated: true },
  { concept: "Conditions for Consent", gdpr: "ART_07", mkLpdp: "MK_LPDP_ART_11", alLaw124: "AL_124_ART_08", validated: true },
  { concept: "Transparent Information", gdpr: "ART_13", mkLpdp: "MK_LPDP_ART_17", alLaw124: "AL_124_ART_13", validated: true },
  { concept: "Right of Access", gdpr: "ART_15", mkLpdp: "MK_LPDP_ART_19", alLaw124: "AL_124_ART_15", validated: true },
  { concept: "Right to Erasure", gdpr: "ART_17", mkLpdp: "MK_LPDP_ART_21", alLaw124: "AL_124_ART_17", validated: true },
  { concept: "Privacy by Design", gdpr: "ART_25", mkLpdp: "MK_LPDP_ART_29", alLaw124: "AL_124_ART_21", validated: true },
  { concept: "Processor Obligations", gdpr: "ART_28", mkLpdp: "MK_LPDP_ART_32", alLaw124: "AL_124_ART_22", validated: true },
  { concept: "Records of Processing (RoPA)", gdpr: "ART_30", mkLpdp: "MK_LPDP_ART_34", alLaw124: "AL_124_ART_26", validated: true },
  { concept: "Security of Processing", gdpr: "ART_32", mkLpdp: "MK_LPDP_ART_36", alLaw124: "AL_124_ART_27", validated: true },
  { concept: "Breach Notification (Authority)", gdpr: "ART_33", mkLpdp: "MK_LPDP_ART_37", alLaw124: "AL_124_ART_28", validated: true },
  { concept: "DPIA (High Risk)", gdpr: "ART_35", mkLpdp: "MK_LPDP_ART_39", alLaw124: "AL_124_ART_29", validated: true },
  { concept: "DPO Designation", gdpr: "ART_37", mkLpdp: "MK_LPDP_ART_41", alLaw124: "AL_124_ART_31", validated: true },
  { concept: "International Transfers", gdpr: "ART_44", mkLpdp: "MK_LPDP_ART_48", alLaw124: "AL_124_ART_38", validated: true },
  { concept: "Liability & Compensation", gdpr: "ART_82", mkLpdp: "MK_LPDP_ART_101", alLaw124: "AL_124_ART_88", validated: true },
];

const BY_GDPR = new Map<GdprArticleId, CrossWalkEntry>(
  VALIDATED_CROSSWALK.map((e) => [e.gdpr, e]),
);

/** Look up the validated AL/MK equivalent for a GDPR article, if mapped. */
export function crossWalkFor(gdprId: GdprArticleId): CrossWalkEntry | undefined {
  return BY_GDPR.get(gdprId);
}
