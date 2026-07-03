// ── zEnum Helper — Diamond Seal Enum Validator ──
// Only branded DbEnumValues arrays can produce Zod enums.
// This is the forge of the Diamond Seal pattern — no unbranded array
// may produce a Zod enum, for that would be a forgery of the Symbolic order.
//
// Flow: constants/_brand.ts (createEnumValues) → _enum-helper.ts (zEnum) → enums/domain.ts (zod schemas)

import { z } from "zod";
import type { DbEnumValues } from "@rocky/database/constants";

/**
 * Create a Zod enum from branded enum values.
 * Accepts ONLY DbEnumValues (the branded type from createEnumValues).
 * Unbranded arrays will fail type-check — this is by design.
 *
 * NOTE: The `const` generic preserves string literal types so that
 * `z.infer<typeof animalStatusSchema>` yields the exact union
 * (e.g. "alive" | "dead" | ...), not just `string`.
 * This is required for the Diamond Seal NoDrift guillotine to pass.
 */
export function zEnum<const T extends readonly string[]>(_values: DbEnumValues<T>) {
  type U = T[number];
  return z.enum([..._values] as unknown as [U, ...U[]]);
}
