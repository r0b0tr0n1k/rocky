import { afterAll, describe, expect, it } from "vitest";
import { closeDatabase, db } from "@rocky/database";
import type { DatabaseProvider } from "@rocky/database";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { FarmRepository } from "./farm.repository.js";
import { FarmFactory } from "@rocky/testing";

/**
 * WO-031 - Scenario C RLS test (real Postgres, dev only).
 *
 * Farm RLS (farm_access_policy): admins see all farms; FARM_READ_ROLES see
 * farms linked to them via farm_subjects (farmOwnedByUser); writes are
 * restricted to adminAndVetWrite. Superusers bypass RLS, so the assertions
 * connect as the constrained `rocky_rls_test` role and use a superuser
 * scaffold connection (RLS_ADMIN_URL) only to seed base rows. Never run on
 * production.
 */
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const ADMIN_URL = process.env.RLS_ADMIN_URL ?? "";
// Scenario C needs a real Postgres + superuser scaffold. Skip when env is
// absent or points at production. Runs in CI where DATABASE_URL/RLS_ADMIN_URL
// are provided.
const hasRLSEnv =
  DATABASE_URL.length > 0 &&
  ADMIN_URL.length > 0 &&
  DATABASE_URL.includes("prod") === false &&
  ADMIN_URL.includes("prod") === false;

const FARM_ID = "95ce25b8-6132-465b-8cd7-5101db5a48e1"; // seeded farm
const ADDRESS_ID = "565927ec-4a20-44ec-a435-68e8a3c53f34"; // seeded address
const S1 = "11111111-1111-4111-8111-111111111111"; // linked farmer
const S2 = "22222222-2222-4222-8222-222222222222"; // unlinked farmer
const ADMIN = "00000000-0000-4000-8000-000000000000";
const FS_ID = "bbbbbbbb-0000-4000-8000-0000000000bb";
const NEW_FARM = "cccccccc-0000-4000-8000-0000000000cc";

const adminClient = hasRLSEnv ? postgres(ADMIN_URL) : null;
const adminDb = hasRLSEnv ? drizzle({ client: adminClient as NonNullable<typeof adminClient> }) : null;
const adb = adminDb as NonNullable<typeof adminDb>;

const repoOn = (tx: unknown) => new FarmRepository({ client: tx } as unknown as DatabaseProvider);

async function setCtx(tx: any, userId: string, role: string, org: string = ADMIN) {
  await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
  await tx.execute(sql`SELECT set_config('app.current_role', ${role}, true)`);
  await tx.execute(sql`SELECT set_config('app.current_org_id', ${org}, true)`);
}

describe.skipIf(hasRLSEnv === false)("FarmRepository - RLS farm-scoped isolation (Scenario C)", () => {
  it("linked farmer reads own farm; isolates by farm_subjects; farmer write blocked", async () => {
    await adb.execute(sql`INSERT INTO subjects (id, short_name, is_active, created_at) VALUES (${S1}, 'S1', true, now()) ON CONFLICT DO NOTHING`);
    await adb.execute(sql`INSERT INTO subjects (id, short_name, is_active, created_at) VALUES (${S2}, 'S2', true, now()) ON CONFLICT DO NOTHING`);
    await adb.execute(sql`INSERT INTO farm_subjects (id, farm_id, subject_id, role) VALUES (${FS_ID}, ${FARM_ID}, ${S1}, 'owner') ON CONFLICT DO NOTHING`);

    try {
      await db.transaction(async (tx: any) => {
        await setCtx(tx, S1, "FARMER");
        expect(await repoOn(tx).findById(FARM_ID)).not.toBeNull(); // linked -> visible
        await setCtx(tx, S2, "FARMER");
        expect(await repoOn(tx).findById(FARM_ID)).toBeNull(); // unlinked -> hidden
        await setCtx(tx, ADMIN, "SUPER_ADMIN");
        expect(await repoOn(tx).findById(FARM_ID)).not.toBeNull(); // admin sees all
      });

      // FARMER write is blocked by the withCheck adminAndVetWrite clause.
      await expect(
        db.transaction(async (tx: any) => {
          await setCtx(tx, S2, "FARMER");
          await repoOn(tx).insert(new FarmFactory(ADDRESS_ID).createActive({ id: NEW_FARM }) as any);
        }),
      ).rejects.toThrow();
    } finally {
      await adb.execute(sql`DELETE FROM farms WHERE id = ${NEW_FARM}`);
      await adb.execute(sql`DELETE FROM farm_subjects WHERE id = ${FS_ID}`);
      await adb.execute(sql`DELETE FROM subjects WHERE id IN (${S1}, ${S2})`);
    }
  });
});

afterAll(async () => {
  await closeDatabase();
  await adminClient?.end();
});
