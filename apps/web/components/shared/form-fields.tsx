"use client";

import * as React from "react";
import { type Control, type FieldValues, type Path } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@rocky/ui/lib/utils";
import { Button } from "@rocky/ui/components/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@rocky/ui/components/combobox";
import { Calendar } from "@rocky/ui/components/calendar";
import { Checkbox } from "@rocky/ui/components/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@rocky/ui/components/field";
import { FormControl, FormField } from "@rocky/ui/components/form";
import { Input } from "@rocky/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rocky/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rocky/ui/components/select";
import { Switch } from "@rocky/ui/components/switch";
import { Textarea } from "@rocky/ui/components/textarea";

export interface FieldOption {
  label: string;
  value: string;
}

interface BaseProps<TValues extends FieldValues> {
  control: Control<TValues>;
  name: Path<TValues>;
  label: string;
  description?: string;
  placeholder?: string;
}

export function TextField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  type = "text",
}: BaseProps<TValues> & { type?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.error ? true : undefined}>
          <FieldLabel>{label}</FieldLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function TextareaField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
}: BaseProps<TValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.error ? true : undefined}>
          <FieldLabel>{label}</FieldLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function NumberField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
}: BaseProps<TValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.error ? true : undefined}>
          <FieldLabel>{label}</FieldLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={placeholder}
              value={field.value ?? ""}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              onChange={(e) =>
                field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
              }
            />
          </FormControl>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function SelectField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  options,
}: BaseProps<TValues> & { options: FieldOption[] }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.error ? true : undefined}>
          <FieldLabel>{label}</FieldLabel>
          <Select value={field.value ?? ""} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function CheckboxField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
}: BaseProps<TValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.error ? true : undefined}
          orientation="horizontal"
          className="items-start gap-3 rounded-md border p-3"
        >
          <FormControl>
            <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          </FormControl>
          <FieldContent>
            <FieldLabel>{label}</FieldLabel>
            {description ? <FieldDescription>{description}</FieldDescription> : null}
          </FieldContent>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function SwitchField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
}: BaseProps<TValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.error ? true : undefined}
          orientation="horizontal"
          className="items-center justify-between gap-3 rounded-md border p-3"
        >
          <FieldContent>
            <FieldLabel>{label}</FieldLabel>
            {description ? <FieldDescription>{description}</FieldDescription> : null}
          </FieldContent>
          <FormControl>
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          </FormControl>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/**
 * Date picker. Emits a Date object (superjson round-trips it across the
 * wire). This satisfies z.date() request inputs and is also accepted by
 * z.coerce.date<string>() fields (coercion passes a Date through).
 */
export function DateField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
}: BaseProps<TValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const raw = field.value as unknown;
        const selected: Date | undefined =
          raw instanceof Date ? raw : raw ? new Date(raw as string | number) : undefined;
        return (
          <Field
            data-invalid={fieldState.error ? true : undefined}
            className="flex flex-col gap-1"
          >
            <FieldLabel>{label}</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {selected ? format(selected, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon data-icon="inline-start" className="ml-auto opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selected}
                  onSelect={(d) => field.onChange(d ?? undefined)}
                />
              </PopoverContent>
            </Popover>
            {description ? <FieldDescription>{description}</FieldDescription> : null}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}

/**
 * Type-ahead select backed by the @rocky/ui Base UI Combobox. Used for
 * foreign-key fields (farm, parent animal). Options are passed in (the
 * page fetches them via tRPC); clearing sets the value to undefined.
 */
export function ComboboxField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  options,
}: BaseProps<TValues> & { options: FieldOption[] }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.error ? true : undefined}>
          <FieldLabel>{label}</FieldLabel>
          <FormControl>
            <Combobox
              value={(field.value as string | undefined) ?? null}
              onValueChange={(v) => field.onChange(v ?? undefined)}
            >
              <ComboboxInput placeholder={placeholder ?? "Search…"} showTrigger showClear />
              <ComboboxContent>
                <ComboboxList>
                  {options.map((o) => (
                    <ComboboxItem key={o.value} value={o.value}>
                      {o.label}
                    </ComboboxItem>
                  ))}
                  <ComboboxEmpty>No results.</ComboboxEmpty>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </FormControl>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
