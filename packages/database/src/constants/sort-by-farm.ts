import { createEnumValues } from "./_brand.js";

/**
 * Farm Sort-By Columns — which field to sort the farm list by.
 */
export const SORT_BY_FARM = {
  NAME: "name",
  FARM_ID: "farmId",
  CREATED_AT: "createdAt",
} as const;

export const SORT_BY_FARM_VALUES = createEnumValues([
  SORT_BY_FARM.NAME,
  SORT_BY_FARM.FARM_ID,
  SORT_BY_FARM.CREATED_AT,
] as const);
