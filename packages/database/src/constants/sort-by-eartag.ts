import { createEnumValues } from "./_brand.js";

/**
 * Ear-Tag Sort-By Columns - which field to sort the eartag list by.
 */
export const SORT_BY_EARTAG = {
  CREATED_AT: "createdAt",
  APPLIED_DATE: "appliedDate",
  MANUFACTURE_DATE: "manufactureDate",
} as const;

export const SORT_BY_EARTAG_VALUES = createEnumValues([
  SORT_BY_EARTAG.CREATED_AT,
  SORT_BY_EARTAG.APPLIED_DATE,
  SORT_BY_EARTAG.MANUFACTURE_DATE,
] as const);
