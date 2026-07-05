// ── @rocky/testing ──
// Diamond Seal Testing Doctrine — The Material Base of Testing
//
// Because of the Diamond Seal (Drizzle → Dumb Zod → Factory), your test data
// perfectly satisfies BOTH the Drizzle `$inferSelect` type AND the Zod schema.
//
// Three Testing Stages:
//   Scenario A: API Validators — Factory + `.safeParse()`, no DB
//   Scenario B: Domain Services — Mock Repository + Factory, no DB
//   Scenario C: E2E Routers — Real DB + Factory + full pipeline
//
// Never mock `@rocky/database`. Always use factories.
/** biome-ignore-all assist/source/organizeImports: Sort fail */

export { SchemaDataFactory } from "./factory/base.js";
export {
  EarTagOrderFactory, FarmFactory, type EarTagOrderRecord, type FarmRecord
} from "./factory/index.js";

export {
  createE2EContext, mockRepoReturn,
  mockRepoThrow,
  scenarioA_validatorTest, type E2EContext
} from "./scenarios/index.js";

