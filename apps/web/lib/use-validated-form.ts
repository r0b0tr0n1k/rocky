"use client";

import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

export type ValidatedFormMode = "onSubmit" | "onBlur" | "onChange" | "onTouched" | "all";

export interface UseValidatedFormOptions<TInput extends FieldValues> {
  defaultValues?: DefaultValues<TInput>;
  mode?: ValidatedFormMode;
}

/**
 * Binds a Diamond Seal request schema directly to react-hook-form.
 * The inferred input type drives both the form and the tRPC mutation,
 * so client validation === server contract. No `any`: TInput is a
 * FieldValues object, and the only cast is the zod resolver, which
 * carries the schema's transformed (Date) output type.
 */
export function useValidatedForm<TInput extends FieldValues>(
  schema: z.ZodType<unknown, TInput>,
  options: UseValidatedFormOptions<TInput> = {},
): UseFormReturn<TInput> {
  const resolver = zodResolver(schema) as unknown as Resolver<TInput>;
  return useForm<TInput>({
    resolver,
    defaultValues: options.defaultValues,
    mode: options.mode ?? "onSubmit",
  });
}
