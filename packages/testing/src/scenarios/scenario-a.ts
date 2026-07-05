// ── Scenario A: Testing API Validators in Absolute Isolation ──
//
// What you test: That your API schema correctly strips secrets
//   (like tenantId or passwordHash) from database rows.
//
// What you do NOT need: A database, a router, or any infrastructure.
//
// The approach: Use the Factory to generate the "Brute Reality"
//   (a raw database row), and force it through the API Checkpoint!

import type { z } from "zod";

/**
 * Test that an API response schema correctly transforms a database row.
 *
 * ## Usage
 *
 * ```typescript
 * import { test, expect } from "vitest";
 * import { EarTagOrderFactory, scenarioA_validatorTest } from "@rocky/testing";
 *
 * test("API strips internal fields", () => {
 *   const order = new EarTagOrderFactory("org_123").createDraft();
 *   const { success } = scenarioA_validatorTest(apiResponseSchema, order, {
 *     forbidden: ["organizationId", "internalNotes"],
 *   });
 *   expect(success).toBe(true);
 * });
 * ```
 *
 * @param apiSchema — The API response Zod schema (with `.omit()`, `.extend()`, `.strict()`)
 * @param dbRow — A factory-generated database row
 * @param options.forbidden — Array of field names that must NOT appear in the API response
 * @param options.required — Array of field names that MUST appear in the API response
 */
export function scenarioA_validatorTest<TSchema extends z.ZodType>(
  apiSchema: TSchema,
  dbRow: unknown,
  options: {
    forbidden?: string[];
    required?: string[];
  } = {},
): { success: boolean; data?: z.infer<TSchema>; error?: z.ZodError } {
  const result = apiSchema.safeParse(dbRow);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const apiResponse = result.data as Record<string, unknown>;

  // Verify forbidden fields are stripped
  for (const field of options.forbidden ?? []) {
    if (field in apiResponse) {
      throw new Error(
        `Scenario A: Field '${field}' should have been stripped by API schema but was present.\n` +
        `Value: ${JSON.stringify(apiResponse[field])}`,
      );
    }
  }

  // Verify required fields survived
  for (const field of options.required ?? []) {
    if (!(field in apiResponse)) {
      throw new Error(`Scenario A: Field '${field}' should be in API response but was missing.`);
    }
  }

  return { success: true, data: result.data };
}
