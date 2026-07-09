/**
 * Typed helpers for consuming @rocky/validators/enums dictionaries in the
 * mobile UI. They keep select option lists and their labels in lock-step with
 * the canonical enum source of truth — no hand-maintained literal arrays and
 * no `as` casts at the data boundary.
 */

/** Convert an enum value to a human-readable label (e.g. "single" -> "Single"). */
export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Build `{ value, label }` option lists from a keyed enum dictionary.
 * `T[keyof T]` preserves the literal union so values stay type-safe downstream
 * (e.g. `value` is `sexType`, not `string`).
 */
export function enumToOptions<T extends Record<string, string>>(
  dict: T,
): { value: T[keyof T]; label: string }[] {
  return (Object.values(dict) as T[keyof T][]).map((value) => ({
    value,
    label: titleCase(value),
  }));
}
