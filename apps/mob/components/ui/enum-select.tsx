import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { enumToOptions } from "@/lib/enum-options";

type EnumSelectProps<T extends Record<string, string>> = {
  /** Canonical enum dictionary from `@rocky/validators/enums` (single source of truth). */
  dict: T;
  /** Currently selected literal value, or undefined when nothing is chosen. */
  value: T[keyof T] | undefined;
  onValueChange: (value: T[keyof T] | undefined) => void;
  placeholder?: string;
};

/**
 * Select bound to a `@rocky/validators/enums` dictionary. Options are derived
 * via `enumToOptions`, so labels stay in lock-step with the canonical enum and
 * `value` is a literal union (type-safe downstream), never a bare string.
 */
export function EnumSelect<T extends Record<string, string>>({
  dict,
  value,
  onValueChange,
  placeholder = "Select...",
}: EnumSelectProps<T>) {
  const options = enumToOptions(dict);
  return (
    <Select
      value={value ? options.find((o) => o.value === value) : undefined}
      onValueChange={(option) => onValueChange(option?.value as T[keyof T] | undefined)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} label={option.label} value={option.value} />
        ))}
      </SelectContent>
    </Select>
  );
}
