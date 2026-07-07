export const EVENT_TYPE_IDS = {
  DISEASE_DETECTED: "disease_detected",
  ANIMAL_REGISTERED: "animal_registered",
  APPROVAL_REQUESTED: "approval_requested",
  INSPECTION_SCHEDULED: "inspection_scheduled",
  TAG_ORDER_APPROVED: "tag_order_approved",
  PASSPORT_ISSUED: "passport_issued",
  MOVEMENT_RECORDED: "movement_recorded",
  PASTURE_RETURNED: "pasture_returned",
  SLAUGHTER_RECORDED: "slaughter_recorded",
  BIRTH_NOTIFICATION_CREATED: "birth_notification_created",
  ERROR_CORRECTION_REQUIRED: "error_correction_required",
  VACCINATION_OVERDUE: "vaccination_overdue",
  QUARANTINE_EXPIRING: "quarantine_expiring",
  FOREIGN_PASSPORT_EXPIRING: "foreign_passport_expiring",
} as const;

export type EventTypeId = (typeof EVENT_TYPE_IDS)[keyof typeof EVENT_TYPE_IDS];
