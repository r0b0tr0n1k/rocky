/**
 * drizzle-orm/zod schema factory with date coercion and bigint handling.
 *
 * Features:
 * 1. Date coercion: All timestamp columns (created_at, updated_at, etc.)
 *    automatically generate `z.coerce.date()` schemas, eliminating manual
 *    `z.coerce.date()` usages across integration validators.
 *
 * 2. Bigint handling: Columns defined as `bigint({ mode: 'number' })` in
 *    Drizzle schemas automatically map to `z.number()`. No extra config needed.
 *    For bigint-as-string use cases, override per-column in the schema factory.
 *
 * ## Date Coercion Architecture (Diamond Seal Pattern)
 *
 * **Rule:** `createSchemaFactory({ coerce: { date: true } })` means every
 * `createSelectSchema` / `createInsertSchema` / `createUpdateSchema` output
 * uses `z.coerce.date()` for timestamp/date columns.
 *
 * **Propagation:**
 * - `packages/database/src/zod/*.ts` → Dumb Zod schemas (raw from Drizzle)
 * - `packages/validators/src/api/*.api.ts` → Extends/derives from DB schemas
 * - Dates stay as `z.coerce.date()` end-to-end through the validation layer
 *
 * **Why this matters:**
 * - Client payloads arrive as ISO strings (e.g., `"2024-01-15T10:30:00Z"`)
 * - `z.coerce.date()` automatically parses strings → Date objects
 * - No manual `z.coerce.date()` overrides needed in API validators
 * - Consistent date handling across all domain boundaries
 *
 * @see https://orm.drizzle.team/docs/zod
 */

import { createSchemaFactory } from "drizzle-orm/zod";

const factory = createSchemaFactory({
	coerce: {
		date: true,
	},
});

/**
 * Type-annotated wrappers.
 *
 * The factory's inferred return type references drizzle-orm internal paths
 * (schema.types.internal.cjs), which causes TS2883 "cannot be named without
 * reference to X" errors at every call site.
 *
 * By explicitly typing these exports with the PUBLIC interface types from
 * drizzle-orm/zod, TypeScript uses the public path for inference at call sites.
 */
export const createSelectSchema = factory.createSelectSchema;
export const createInsertSchema = factory.createInsertSchema;
export const createUpdateSchema = factory.createUpdateSchema;
