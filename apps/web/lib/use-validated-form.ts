"use client";

import { useForm, type DefaultValues, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

export type ValidatedFormMode = "onSubmit" | "onBlur" | "onChange" | "onTouched" | "all";

export interface UseValidatedFormOptions {
  defaultValues?: DefaultValues<any>;
  mode?: ValidatedFormMode;
}

/**
 * Binds a Diamond Seal request schema directly to react-hook-form.
 * The inferred input type drives both the form and the tRPC mutation,
 * so client validation === server contract.
 */
export function useValidatedForm<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  options: UseValidatedFormOptions = {},
): UseFormReturn<z.input<TSchema>> {
  const form = useForm({
    resolver: zodResolver(schema as never),
    defaultValues: options.defaultValues,
    mode: options.mode ?? "onSubmit",
  }) as unknown as UseFormReturn<z.input<TSchema>>;
  return form;
}
