// ── Testing Scenarios ──
/** biome-ignore-all assist/source/organizeImports: Sort fail */
// Pre-built compositions of factories for common test setup patterns.
//
// Scenario A: API Validators — Factory + `.safeParse()`, no DB
// Scenario B: Domain Services — Mock Repository + Factory, no DB
// Scenario C: E2E Routers — Real DB + Factory + full pipeline

export { scenarioA_validatorTest } from "./scenario-a.js";
export { mockRepoReturn, mockRepoThrow } from "./scenario-b.js";
export { createE2EContext } from "./scenario-c.js";
export type { E2EContext } from "./scenario-c.js";

