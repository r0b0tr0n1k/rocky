import { createEnumValues } from "./_brand.js";

/**
 * Animal Sort-By Columns — which field to sort the animal list by.
 *
 * These match the database column names for ORDER BY clauses.
 */
export const SORT_ANIMAL_BY = {
	BIRTH_DATE: "birthDate",
	CREATED_AT: "createdAt",
	EAR_TAG_NUMBER: "earTagNumber",
} as const;

export const SORT_ANIMAL_BY_VALUES = createEnumValues([
	SORT_ANIMAL_BY.BIRTH_DATE,
	SORT_ANIMAL_BY.CREATED_AT,
	SORT_ANIMAL_BY.EAR_TAG_NUMBER,
] as const);
