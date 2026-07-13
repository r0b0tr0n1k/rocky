import { createEnumValues } from "./_brand.js";

/**
 * Regulated procedure steps for a disease event, drawn from Reg (EU) 2020/687
 * (suspicion → confirmation → restricted zone → culling → disinfection →
 * repopulation) and AHL Part II (surveillance / eradication programmes /
 * disease-free status). ADR-0095.
 */
export const PROCEDURE_TYPE = {
  SUSPICION_REPORT: "suspicion_report",
  INVESTIGATION: "investigation",
  SAMPLING: "sampling",
  TRACING: "tracing",
  PRELIM_RESTRICTION: "prelim_restriction",
  PRELIM_DISINFECTION: "prelim_disinfection",
  OFFICIAL_CONFIRMATION: "official_confirmation",
  LAB_DIAGNOSIS: "lab_diagnosis",
  NOTIFY_COMMISSION: "notify_commission",
  ESTABLISH_RESTRICTED_ZONE: "establish_restricted_zone",
  PROTECTION_ZONE: "protection_zone",
  SURVEILLANCE_ZONE: "surveillance_zone",
  MOVEMENT_RESTRICTION: "movement_restriction",
  CULLING: "culling",
  CARCASS_DISPOSAL: "carcass_disposal",
  CLEANING_DISINFECTION: "cleaning_disinfection",
  FALLOWING: "fallowing",
  REPOPULATION: "repopulation",
  SURVEILLANCE_PROGRAMME: "surveillance_programme",
  ERADICATION_PROGRAMME: "eradication_programme",
  DISEASE_FREE_STATUS: "disease_free_status",
} as const;

export const PROCEDURE_TYPE_VALUES = createEnumValues([
  PROCEDURE_TYPE.SUSPICION_REPORT,
  PROCEDURE_TYPE.INVESTIGATION,
  PROCEDURE_TYPE.SAMPLING,
  PROCEDURE_TYPE.TRACING,
  PROCEDURE_TYPE.PRELIM_RESTRICTION,
  PROCEDURE_TYPE.PRELIM_DISINFECTION,
  PROCEDURE_TYPE.OFFICIAL_CONFIRMATION,
  PROCEDURE_TYPE.LAB_DIAGNOSIS,
  PROCEDURE_TYPE.NOTIFY_COMMISSION,
  PROCEDURE_TYPE.ESTABLISH_RESTRICTED_ZONE,
  PROCEDURE_TYPE.PROTECTION_ZONE,
  PROCEDURE_TYPE.SURVEILLANCE_ZONE,
  PROCEDURE_TYPE.MOVEMENT_RESTRICTION,
  PROCEDURE_TYPE.CULLING,
  PROCEDURE_TYPE.CARCASS_DISPOSAL,
  PROCEDURE_TYPE.CLEANING_DISINFECTION,
  PROCEDURE_TYPE.FALLOWING,
  PROCEDURE_TYPE.REPOPULATION,
  PROCEDURE_TYPE.SURVEILLANCE_PROGRAMME,
  PROCEDURE_TYPE.ERADICATION_PROGRAMME,
  PROCEDURE_TYPE.DISEASE_FREE_STATUS,
] as const);
