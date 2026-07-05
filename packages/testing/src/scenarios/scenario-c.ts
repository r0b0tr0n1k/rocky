// ── Scenario C: True E2E Router Tests (Real Database) ──
//
// What you test: The full request/response pipeline.
//   tRPC Router → Service → Repository → Drizzle → PostgreSQL → Zod validation → Response
//
// What you need: A real (or ephemeral) Postgres database.
//
// The approach: Spin up a real database, seed it with Factory data, and
//   prove the entire Drizzle/Postgres/Zod pipeline works end-to-end!
//
// For E2E tests, use testcontainers to spin up an ephemeral Postgres.
// The test file must have `drizzle-orm` and `pg` in its devDependencies.
//
// ```typescript
// import { test, expect, beforeAll, afterAll } from "vitest";
// import { PostgreSqlContainer } from "@testcontainers/postgresql";
// import { createE2EContext } from "@rocky/testing/scenarios";
//
// let ctx: E2EContext;
//
// beforeAll(async () => {
//   const container = await new PostgreSqlContainer("postgres:16")
//     .withDatabase("rocky_test")
//     .start();
//   ctx = await createE2EContext(container.getConnectionUri());
// });
//
// afterAll(() => ctx.cleanup());
// ```

/**
 * E2E test context — holds a database connection and cleanup hooks.
 */
export interface E2EContext {
  /** A drizzle-orm database client connected to the test database */
  db: unknown;
  /** Cleanup function — call in afterAll() */
  cleanup: () => Promise<void>;
}

/**
 * Create an E2E test context connected to the given database URL.
 *
 * Runs Drizzle migrations and returns a ready-to-use database client.
 *
 * ⚠️ IMPORTANT: This function dynamically imports drizzle-orm/node-postgres and pg.
 * The importing test file must have these in its devDependencies.
 *
 * @param databaseUrl — A test database URL (never production!)
 * @returns E2EContext with db client and cleanup function
 */
export async function createE2EContext(databaseUrl: string): Promise<E2EContext> {
  // Safety check — refuse to connect to production
  if (databaseUrl.includes("prod")) {
    throw new Error("REFUSING TO RUN E2E TESTS AGAINST PRODUCTION DATABASE.\n" + "Use a dedicated test database.");
  }

  // Dynamic imports at runtime — TypeScript skips module resolution for eval'd import()
  // biome-ignore lint/suspicious/noExplicitAny: acceptable in testing
  const drizzleOrm: any = await Function('return import("drizzle-orm/node-postgres")')();
  // biome-ignore lint/suspicious/noExplicitAny: acceptable in testing
  const pgMod: any = await Function('return import("pg")')();
  // biome-ignore lint/suspicious/noExplicitAny: acceptable in testing
  const migrateMod: any = await Function('return import("drizzle-orm/node-postgres/migrator")')();

  const pool = new pgMod.Pool({ connectionString: databaseUrl, max: 5 });
  const db = drizzleOrm.drizzle({ client: pool });

  await migrateMod.migrate(db, {
    migrationsFolder: "./packages/database/drizzle",
  });

  return {
    db,
    cleanup: async () => {
      await pool.end();
    },
  };
}
