import { createEnumValues } from "./_brand.js";

/**
 * Movement Sort-By Columns - which field to sort the movement list by.
 */
export const SORT_BY_MOVEMENT = {
  MOVEMENT_DATE: "movementDate",
  CREATED_AT: "createdAt",
} as const;

export const SORT_BY_MOVEMENT_VALUES = createEnumValues([
  SORT_BY_MOVEMENT.MOVEMENT_DATE,
  SORT_BY_MOVEMENT.CREATED_AT,
] as const);
