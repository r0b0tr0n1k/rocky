import { createEnumValues } from "./_brand.js";

/**
 * User Sort-By Columns - which field to sort the user list by.
 */
export const SORT_BY_USER = {
  USERNAME: "username",
  CREATED_AT: "createdAt",
  LAST_LOGIN_AT: "lastLoginAt",
} as const;

export const SORT_BY_USER_VALUES = createEnumValues([
  SORT_BY_USER.USERNAME,
  SORT_BY_USER.CREATED_AT,
  SORT_BY_USER.LAST_LOGIN_AT,
] as const);
