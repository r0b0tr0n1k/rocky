// ── Type Bridge: Extract Drizzle-Zod Schema Output Types ──
//
// Problem: drizzle-zod's `BuildSchema` doesn't fully satisfy Zod 4's `ZodType`
// constraint, so `z.infer<typeof someSelectSchema>` fails at compile time.
//
// Solution: Extract the `_zod.output` property directly from the ZodObject
// instance type, bypassing the `z.infer<>` generic constraint entirely.
//
// The structural extraction reads `_zod.output` from any Zod-like object,
// falling back to the return type of `safeParse` for non-Zod schemas.

/**
 * Extract the output type from a drizzle-zod select/insert/update schema.
 *
 * Uses structural typing to read `_zod.output` from any Zod-like object,
 * falling back to the return type of `safeParse` for non-Zod schemas.
 */
export type InferSelectSchema<T> = T extends {
  readonly _zod: { readonly output: infer O };
}
  ? O
  : T extends {
        safeParse: (
          data: unknown,
          // biome-ignore lint/suspicious/noExplicitAny: OK in tests
        ) => { success: true; data: infer D } | { success: false; error: any };
      }
    ? D
    : never;
