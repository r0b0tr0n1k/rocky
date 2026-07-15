/**
 * GDPR (EU) <-> MK LPDP (North Macedonia) <-> AL Law 124 (Albania) <-> ISO/IEC 27701:2025
 * validated cross-walk -- an ENGINEERING REFERENCE, not legal advice.
 *
 * Homework artifact for ADR-0061 (GDPR Right-to-be-Forgotten vs Mandatory
 * Retention) and ADR-0067 (ISMS Posture & ISO 27001/27701 Conformity Roadmap).
 * It exists so Rocky's PII handling can cite canonical article/control IDs for
 * AUDIT / DOCUMENTATION only. It is never used to enforce anything.
 *
 * Sourced:
 *   - GDPR <-> MK LPDP <-> AL Law 124: graphgrc-main/mappings/golden_mappings.yaml
 *     (15 unified concepts, validated per that project's own audit) -> the `validated: true` core.
 *   - ISO/IEC 27701:2025 control refs: graphgrc-main/iso27701_2025.json `gdprMapping`
 *     (per-control, normative Tables A.1/A.2/A.3) -> the `iso27701` array.
 *
 * ISO/IEC 27701 equivalences were previously OMITTED (the broader mapping set
 * was only partially validated). They are now POPULATED from iso27701_2025.json, but
 * remain PENDING EXPERT REVIEW: those `gdprMapping` fields are machine-derived
 * and unverified. Two GDPR articles (ART_37 DPO, ART_82 liability) have NO
 * normative ISO 27701:2025 control mapping in the source -- left absent rather
 * than fabricated.
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
  /** ISO/IEC 27701:2025 normative control refs (Tables A.1/A.2/A.3) -- PENDING EXPERT REVIEW. */
  iso27701?: string[];
  validated: true;
}

/**
 * The validated subset. Each row is one "unified concept" with its three
 * legislative legs + the ISO 27701:2025 controls that serve it.
 * GDPR<->MK<->AL legs: verbatim from graphgrc-main golden_mappings.yaml.
 * iso27701: from iso27701_2025.json gdprMapping (pending review).
 */
export const VALIDATED_CROSSWALK: CrossWalkEntry[] = [
    { concept: "Principles of Processing",
      gdpr: "ART_05", mkLpdp: "MK_LPDP_ART_09", alLaw124: "AL_124_ART_06",
      iso27701: ["A.1.2.2", "A.1.2.3", "A.1.2.7", "A.1.2.9", "A.1.3.7", "A.1.4.10", "A.1.4.2", "A.1.4.4", "A.1.4.5", "A.1.4.6", "A.1.4.7", "A.1.4.9", "A.2.2.3", "A.3.10", "A.3.11", "A.3.13", "A.3.14", "A.3.18", "A.3.19", "A.3.20", "A.3.21", "A.3.22", "A.3.23", "A.3.24", "A.3.25", "A.3.28", "A.3.31", "A.3.5", "A.3.6", "A.3.7", "A.3.9"],
      validated: true },
    { concept: "Lawfulness of Processing",
      gdpr: "ART_06", mkLpdp: "MK_LPDP_ART_10", alLaw124: "AL_124_ART_07",
      iso27701: ["A.1.2.3", "A.1.4.6"],
      validated: true },
    { concept: "Conditions for Consent",
      gdpr: "ART_07", mkLpdp: "MK_LPDP_ART_11", alLaw124: "AL_124_ART_08",
      iso27701: ["A.1.2.5", "A.1.3.5", "A.2.2.4"],
      validated: true },
    { concept: "Transparent Information",
      gdpr: "ART_13", mkLpdp: "MK_LPDP_ART_17", alLaw124: "AL_124_ART_13",
      iso27701: ["A.1.3.11", "A.1.3.3", "A.1.3.4", "A.1.3.5", "A.1.3.6", "A.1.3.7", "A.1.4.8"],
      validated: true },
    { concept: "Right of Access",
      gdpr: "ART_15", mkLpdp: "MK_LPDP_ART_19", alLaw124: "AL_124_ART_15",
      iso27701: ["A.1.3.10", "A.1.3.3", "A.1.3.9", "A.1.5.2", "A.1.5.3", "A.2.3.2"],
      validated: true },
    { concept: "Right to Erasure",
      gdpr: "ART_17", mkLpdp: "MK_LPDP_ART_21", alLaw124: "AL_124_ART_17",
      iso27701: ["A.1.2.3", "A.1.3.7", "A.2.3.2"],
      validated: true },
    { concept: "Privacy by Design",
      gdpr: "ART_25", mkLpdp: "MK_LPDP_ART_29", alLaw124: "AL_124_ART_21",
      iso27701: ["A.1.4.3", "A.3.27", "A.3.29"],
      validated: true },
    { concept: "Processor Obligations",
      gdpr: "ART_28", mkLpdp: "MK_LPDP_ART_32", alLaw124: "AL_124_ART_22",
      iso27701: ["A.1.2.7", "A.2.2.2", "A.2.2.3", "A.2.2.5", "A.2.2.6", "A.2.3.2", "A.3.10", "A.3.13", "A.3.18"],
      validated: true },
    { concept: "Records of Processing (RoPA)",
      gdpr: "ART_30", mkLpdp: "MK_LPDP_ART_34", alLaw124: "AL_124_ART_26",
      iso27701: ["A.1.2.9", "A.1.5.3", "A.1.5.4", "A.1.5.5", "A.2.2.7", "A.3.10", "A.3.13"],
      validated: true },
    { concept: "Security of Processing",
      gdpr: "ART_32", mkLpdp: "MK_LPDP_ART_36", alLaw124: "AL_124_ART_27",
      iso27701: ["A.1.2.2", "A.1.4.6", "A.2.2.3", "A.3.10", "A.3.13", "A.3.15", "A.3.16", "A.3.20", "A.3.24", "A.3.26", "A.3.28", "A.3.5"],
      validated: true },
    { concept: "Breach Notification (Authority)",
      gdpr: "ART_33", mkLpdp: "MK_LPDP_ART_37", alLaw124: "AL_124_ART_28",
      iso27701: ["A.3.11", "A.3.12"],
      validated: true },
    { concept: "DPIA (High Risk)",
      gdpr: "ART_35", mkLpdp: "MK_LPDP_ART_39", alLaw124: "AL_124_ART_29",
      iso27701: ["A.1.2.6", "A.2.2.2"],
      validated: true },
    { concept: "DPO Designation",
      gdpr: "ART_37", mkLpdp: "MK_LPDP_ART_41", alLaw124: "AL_124_ART_31",
      validated: true },
    { concept: "International Transfers",
      gdpr: "ART_44", mkLpdp: "MK_LPDP_ART_48", alLaw124: "AL_124_ART_38",
      iso27701: ["A.1.5.2"],
      validated: true },
    { concept: "Liability & Compensation",
      gdpr: "ART_82", mkLpdp: "MK_LPDP_ART_101", alLaw124: "AL_124_ART_88",
      validated: true },

    // --- Code-enforced controls folded into the SoA (ADR-0067 Phase 1 harvest) ---
    // These are ENGINEERING-EVIDENCE rows, not GDPR<->MK<->AL legislative mappings.
    // `gdpr` is the GDPR article each control primarily serves; `mkLpdp`/`alLaw124`
    // reuse the corresponding MK/AL article for that GDPR article (verbatim from the
    // validated rows above). `iso27701` records the ISO/IEC 27001:2022 Annex A control(s)
    // the running code implements; the ISO/IEC 27701:2025 equivalence remains PENDING
    // EXPERT REVIEW (per the file header) -- these rows are leads, not authority.
    { concept: "Tamper-evident audit log (ADR-0007)",
      gdpr: "ART_30", mkLpdp: "MK_LPDP_ART_34", alLaw124: "AL_124_ART_26",
      iso27701: ["A.5.28"],
      validated: true },
    { concept: "RBAC / PolicyEngine access control (ADR-0022)",
      gdpr: "ART_32", mkLpdp: "MK_LPDP_ART_36", alLaw124: "AL_124_ART_27",
      iso27701: ["A.5.15"],
      validated: true },
    { concept: "Offline signed-QR credentials (ADR-0084)",
      gdpr: "ART_25", mkLpdp: "MK_LPDP_ART_29", alLaw124: "AL_124_ART_21",
      iso27701: ["A.5.28", "A.8.24"],
      validated: true },
    { concept: "Geofence access lockdown (ADR-0092)",
      gdpr: "ART_32", mkLpdp: "MK_LPDP_ART_36", alLaw124: "AL_124_ART_27",
      iso27701: ["A.8.20", "A.8.22", "A.5.15"],
      validated: true },

];

const BY_GDPR = new Map<GdprArticleId, CrossWalkEntry>(
  VALIDATED_CROSSWALK.map((e) => [e.gdpr, e]),
);

/** Look up the validated AL/MK/ISO equivalences for a GDPR article, if mapped. */
export function crossWalkFor(gdprId: GdprArticleId): CrossWalkEntry | undefined {
  return BY_GDPR.get(gdprId);
}
