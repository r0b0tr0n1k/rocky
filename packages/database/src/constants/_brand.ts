// ── Enum SSOT Branding — Diamond Seal Pattern ──
// Prevents forgery: zEnum() only accepts branded arrays

/** Unique symbol for brand checking */
declare const ENUM_BRAND: unique symbol;

/** Branded enum value array — only createEnumValues() can produce this */
export type DbEnumValues<T extends readonly string[]> = T & {
  readonly [ENUM_BRAND]: true;
};

/** Create a branded enum values array (the only way to produce DbEnumValues) */
export function createEnumValues<T extends readonly string[]>(
  values: T,
): DbEnumValues<T> {
  return Object.freeze([...values]) as unknown as DbEnumValues<T>;
}

/** Convert branded values to pgEnum-friendly string array */
export function toPgEnumValues<T extends readonly string[]>(
  _values: DbEnumValues<T>,
): [string, ...string[]] {
  // Return the raw values as a tuple (pgEnum requires at least one string)
  const raw = [..._values] as string[];
  return raw as [string, ...string[]];
}

/** Check if a values array is properly branded */
export function isDbEnumValues<T extends readonly string[]>(
  values: readonly string[],
): values is DbEnumValues<T> {
  return ENUM_BRAND in (values as object);
}
