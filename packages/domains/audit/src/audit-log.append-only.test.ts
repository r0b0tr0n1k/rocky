import { type SQL, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// WO-159 Part 1 — append-only enforcement on audit_log (real Postgres, dev only).
// Verifies the DB trigger blocks UPDATE/DELETE and allows the GUC-gated retention
// delete path. Skips when DATABASE_URL is absent or points at production.

const DATABASE_URL = process.env.DATABASE_URL ?? "";
const hasEnv = DATABASE_URL.length > 0 && !DATABASE_URL.includes("prod");

const TEST_ID = "f9d1c0de-0000-4000-8000-0000000000cc";
const TEST_RESOURCE = "wo159-append-only-test";

const client = hasEnv ? postgres(DATABASE_URL, { max: 1 }) : null;
const db = client ? drizzle({ client }) : null;

async function armAndDelete() {
  if (!db) return;
  await db.execute(sql`SET app.audit_retention = 'on'`);
  await db.execute(sql`DELETE FROM audit_log WHERE id = ${TEST_ID}::uuid`);
  await db.execute(sql`SET app.audit_retention = 'off'`);
}

async function seed() {
  if (!db) return;
  await armAndDelete(); // idempotent: clear any prior leftover
  await db.execute(sql`
    INSERT INTO audit_log (id, action, resource, resource_id, source, success)
    VALUES (${TEST_ID}::uuid, 'UPDATE', ${TEST_RESOURCE}, ${TEST_RESOURCE}, 'API', true)
  `);
}

describe.skipIf(!hasEnv)("audit_log append-only trigger (WO-159 Part 1)", () => {
  beforeAll(seed);
  afterAll(async () => {
    await armAndDelete();
    await client?.end();
  });

  // The trigger raises SQLSTATE 42501 (insufficient_privilege). drizzle-orm
  // wraps the PostgresError in a DrizzleQueryError, so the code lives on .cause.
  const expectDenied = (query: SQL) => expect(db!.execute(query)).rejects.toMatchObject({ cause: { code: "42501" } });

  it("blocks UPDATE on audit_log (immutable records)", async () => {
    await expectDenied(sql`UPDATE audit_log SET success = false WHERE id = ${TEST_ID}::uuid`);
  });

  it("blocks DELETE on audit_log without the retention GUC", async () => {
    await expectDenied(sql`DELETE FROM audit_log WHERE id = ${TEST_ID}::uuid`);
  });

  it("allows DELETE when app.audit_retention = 'on' (retention job path, WO-159 Part 3)", async () => {
    await db!.execute(sql`SET app.audit_retention = 'on'`);
    await expect(db!.execute(sql`DELETE FROM audit_log WHERE id = ${TEST_ID}::uuid`)).resolves.toBeDefined();
    await db!.execute(sql`SET app.audit_retention = 'off'`);
  });
});
