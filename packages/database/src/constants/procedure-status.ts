import { createEnumValues } from "./_brand.js";

/** Status of an individual disease-event procedure step (ADR-0095). */
export const PROCEDURE_STATUS = {
  PLANNED: "planned",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  WAIVED: "waived",
} as const;

export const PROCEDURE_STATUS_VALUES = createEnumValues([
  PROCEDURE_STATUS.PLANNED,
  PROCEDURE_STATUS.IN_PROGRESS,
  PROCEDURE_STATUS.DONE,
  PROCEDURE_STATUS.WAIVED,
] as const);
