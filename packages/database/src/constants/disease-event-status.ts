import { createEnumValues } from "./_brand.js";

/** Lifecycle status of a disease event / outbreak (ADR-0095, 2020/687). */
export const DISEASE_EVENT_STATUS = {
  SUSPICION: "suspicion",
  CONFIRMED: "confirmed",
  CONTAINED: "contained",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

export const DISEASE_EVENT_STATUS_VALUES = createEnumValues([
  DISEASE_EVENT_STATUS.SUSPICION,
  DISEASE_EVENT_STATUS.CONFIRMED,
  DISEASE_EVENT_STATUS.CONTAINED,
  DISEASE_EVENT_STATUS.RESOLVED,
  DISEASE_EVENT_STATUS.CLOSED,
] as const);
