// ── zEnum Helper — Branded Enum Schema Creator ──
// Only accepts branded DbEnumValues arrays from @prasici/database/constants

import { z } from "zod";
import type { DbEnumValues } from "@prasici/database/constants/_brand";

/**
 * Create a Zod enum schema from branded DbEnumValues.
 * Only createEnumValues() output is accepted — plain string[] is rejected at compile time.
 */
export function zEnum<T extends readonly string[]>(values: DbEnumValues<T>) {
	return z.enum([...values] as [T[number], ...T[number][]]);
}
