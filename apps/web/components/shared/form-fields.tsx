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
import { Input } from "@rocky/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rocky/ui/components/popover";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rocky/ui/components/form";
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
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
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
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
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
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
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
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
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
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
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
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
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
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
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
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
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
      render={({ field }) => (
        <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-3">
          <FormControl>
            <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
            {description ? <FormDescription>{description}</FormDescription> : null}
          </div>
          <FormMessage />
        </FormItem>
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
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
          <div className="space-y-1">
            <FormLabel>{label}</FormLabel>
            {description ? <FormDescription>{description}</FormDescription> : null}
          </div>
          <FormControl>
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          </FormControl>
          <FormMessage />
        </FormItem>
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
      render={({ field }) => {
        const raw = field.value as unknown;
        const selected: Date | undefined =
          raw instanceof Date ? raw : raw ? new Date(raw as string | number) : undefined;
        return (
          <FormItem className="flex flex-col gap-1">
            <FormLabel>{label}</FormLabel>
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
                <Calendar mode="single" selected={selected} onSelect={(d) => field.onChange(d ?? undefined)} />
              </PopoverContent>
            </Popover>
            {description ? <FormDescription>{description}</FormDescription> : null}
            <FormMessage />
          </FormItem>
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
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
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
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
