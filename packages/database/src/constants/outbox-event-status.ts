import { createEnumValues } from "./_brand.js";

export const OUTBOX_EVENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  DEAD_LETTER: "dead_letter",
} as const;

export const OUTBOX_EVENT_STATUS_VALUES = createEnumValues([
  OUTBOX_EVENT_STATUS.PENDING,
  OUTBOX_EVENT_STATUS.PROCESSING,
  OUTBOX_EVENT_STATUS.COMPLETED,
  OUTBOX_EVENT_STATUS.FAILED,
  OUTBOX_EVENT_STATUS.DEAD_LETTER,
] as const);
