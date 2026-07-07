import type { FieldOption } from "#components/shared/form-fields";

/** "alive" -> "Alive"; "MK" -> "MK" (short codes kept uppercase). */
function titleCase(value: string): string {
  if (value.length <= 2) return value.toUpperCase();
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/** Turn a Diamond Seal enum value array into <Select>/<Combobox> options. */
export function enumToOptions(values: readonly string[]): FieldOption[] {
  return values.map((v) => ({ value: v, label: titleCase(v) }));
}
