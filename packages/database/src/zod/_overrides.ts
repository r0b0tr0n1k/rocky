/**
 * ⛔ JSONB OVERRIDE REGISTRY — Hand-written, never overwritten by the generator.
 *
 * Export constants named exactly `{tableName}InsertOverride` or
 * `{tableName}SelectOverride` to override specific columns in the Dumb Zod.
 *
 * The generator detects these exports via AST and injects them as the
 * second argument to `createInsertSchema` / `createSelectSchema`.
 *
 * Example:
 *   export const messagingChannelsInsertOverride = {
 *     credentials: z.record(z.string(), z.unknown()),
 *   };
 *
 * When to use this: ONLY when a Drizzle column uses `$type<>()` or
 * `jsonb()` that needs a more specific Zod type than the factory default.
 * For normal date/enum/string columns, use the API validator L1 layer.
 */


// ── No overrides currently needed ──
// Populate this file as needed when tables with JSONB $type<>() are added.
