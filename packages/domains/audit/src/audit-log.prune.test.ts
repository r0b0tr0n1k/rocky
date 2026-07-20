import { auditLog, type DatabaseProvider, db } from "@rocky/database";
import { inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AuditRepository } from "./repositories/audit.repository.js";

// WO-159 Part 3 — retention prune (real Postgres, dev only).
// Seeds an old row (8y) and a recent row (6y), prunes with a 7y cutoff, and
// asserts the old row is deleted while the recent row is retained.
// Skips when DATABASE_URL is absent or points at production.

const DATABASE_URL = process.env.DATABASE_URL ?? "";
const hasEnv = DATABASE_URL.length > 0 && !DATABASE_URL.includes("prod");

const OLD_ID = "aaaaaaa0-0000-4000-8000-0000000000aa";
const RECENT_ID = "bbbbbbb0-0000-4000-8000-0000000000bb";
const RESOURCE = "wo159-prune-test";

const repo = new AuditRepository({ client: db } as unknown as DatabaseProvider);

async function armAndDelete() {
  if (!hasEnv) return;
  await db.execute(sql`SET app.audit_retention = 'on'`);
  await db.execute(sql`DELETE FROM audit_log WHERE id IN (${OLD_ID}::uuid, ${RECENT_ID}::uuid)`);
  await db.execute(sql`SET app.audit_retention = 'off'`);
}

async function seed() {
  if (!hasEnv) return;
  await armAndDelete(); // idempotent clear

  const eightYearsAgo = new Date();
  eightYearsAgo.setFullYear(eightYearsAgo.getFullYear() - 8);
  const sixYearsAgo = new Date();
  sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);

  await db.execute(sql`
    INSERT INTO audit_log (id, action, resource, resource_id, source, success, created_at)
    VALUES (${OLD_ID}::uuid, 'UPDATE', ${RESOURCE}, ${OLD_ID}, 'API', true, ${eightYearsAgo.toISOString()}::timestamptz)
  `);
  await db.execute(sql`
    INSERT INTO audit_log (id, action, resource, resource_id, source, success, created_at)
    VALUES (${RECENT_ID}::uuid, 'UPDATE', ${RESOURCE}, ${RECENT_ID}, 'API', true, ${sixYearsAgo.toISOString()}::timestamptz)
  `);
}

describe.skipIf(!hasEnv)("audit_log retention prune (WO-159 Part 3)", () => {
  beforeAll(seed);
  afterAll(armAndDelete);

  it("prunes rows older than the 7y cutoff but keeps recent rows", async () => {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 7);

    const deleted = await repo.pruneRetained(cutoff);
    expect(deleted).toBe(1); // only the 8-year-old row qualifies

    const remaining = await db
      .select({ id: auditLog.id })
      .from(auditLog)
      .where(inArray(auditLog.id, [OLD_ID, RECENT_ID]));
    const ids = remaining.map((r) => r.id);

    expect(ids).toContain(RECENT_ID);
    expect(ids).not.toContain(OLD_ID);
  });
});
