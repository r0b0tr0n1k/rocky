import { afterAll, describe, expect, it } from "vitest";
import { closeDatabase, db } from "@rocky/database";
import type { DatabaseProvider } from "@rocky/database";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { AnimalRepository } from "./animal.repository.js";
import { AnimalFactory } from "@rocky/testing";

/**
 * WO-031 — Scenario C RLS test (real Postgres, dev only).
 *
 * RLS is enforced only for NON-superuser DB roles (superusers/owners bypass
 * it), so this test connects as `rocky_rls_test` (a constrained role, via
 * DATABASE_URL) for the assertions, and uses a superuser connection
 * (RLS_ADMIN_URL = `tbot`) ONLY to scaffold base rows whose own RLS would
 * otherwise deny them (subjects has RLS enabled w/o policy; farm_subjects is
 * admin/self scoped). The animals table policy: farmers READ animals linked
 * to them via `farm_subjects`, but WRITES are restricted (with_check allows
 * only SUPER_ADMIN / VD_* / VETERINARIAN) — registration is a vet/admin action.
 *
 * Never run against a production DB.
 */
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const ADMIN_URL = process.env.RLS_ADMIN_URL ?? "";
const FARM_ID = "95ce25b8-6132-465b-8cd7-5101db5a48e1"; // existing seeded farm
const S1 = "11111111-1111-4111-8111-111111111111"; // linked farmer
const S2 = "22222222-2222-4222-8222-222222222222"; // unlinked farmer
const ADMIN = "00000000-0000-4000-8000-000000000000";
const FS_ID = "aaaaaaaa-0000-4000-8000-0000000000aa";
const A1 = "33333333-3333-4333-8333-333333333333";
const A2 = "44444444-4444-4444-8444-444444444444";

const adminClient = postgres(ADMIN_URL);
const adminDb = drizzle({ client: adminClient });

const repoOn = (tx: unknown) => new AnimalRepository({ client: tx } as unknown as DatabaseProvider);

async function setCtx(tx: any, userId: string, role: string) {
  await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
  await tx.execute(sql`SELECT set_config('app.current_role', ${role}, true)`);
  await tx.execute(sql`SELECT set_config('app.current_org_id', ${ADMIN}, true)`);
}

describe("AnimalRepository — RLS farm-scoped isolation (Scenario C)", () => {
  it("lets linked farmers read but not write; isolates by farm_subjects", async () => {
    if (DATABASE_URL.includes("prod") || ADMIN_URL.includes("prod")) throw new Error("REFUSING RLS TEST ON PRODUCTION DB");
    if (!ADMIN_URL) throw new Error("RLS_ADMIN_URL (superuser) required for scaffolding");

    // Scaffold base rows as superuser (committed).
    await adminDb.execute(sql`INSERT INTO subjects (id, short_name, is_active, created_at) VALUES (${S1}, 'S1', true, now()) ON CONFLICT DO NOTHING`);
    await adminDb.execute(sql`INSERT INTO subjects (id, short_name, is_active, created_at) VALUES (${S2}, 'S2', true, now()) ON CONFLICT DO NOTHING`);
    await adminDb.execute(sql`INSERT INTO farm_subjects (id, farm_id, subject_id, role) VALUES (${FS_ID}, ${FARM_ID}, ${S1}, 'owner') ON CONFLICT DO NOTHING`);

    try {
      // 1) Read isolation: register as SUPER_ADMIN, then read as each role.
      await db.transaction(async (tx: any) => {
        await setCtx(tx, ADMIN, "SUPER_ADMIN");
        const rec = new AnimalFactory(FARM_ID).createAlive({ id: A1 });
        expect(await repoOn(tx).insert(rec as any)).not.toBeNull();

        await setCtx(tx, S1, "FARMER");
        expect(await repoOn(tx).findById(rec.id)).not.toBeNull(); // linked -> visible

        await setCtx(tx, S2, "FARMER");
        expect(await repoOn(tx).findById(rec.id)).toBeNull(); // unlinked -> hidden

        await setCtx(tx, ADMIN, "SUPER_ADMIN");
        expect(await repoOn(tx).findById(rec.id)).not.toBeNull(); // admin sees all
      });

      // 2) FARMER WRITE is blocked by the with_check clause (expected to throw).
      await expect(
        db.transaction(async (tx: any) => {
          await setCtx(tx, S2, "FARMER");
          await repoOn(tx).insert(new AnimalFactory(FARM_ID).createAlive({ id: A2 }) as any);
        }),
      ).rejects.toThrow();
    } finally {
      // Cleanup scaffold (committed rows).
      await adminDb.execute(sql`DELETE FROM animals WHERE id = ${A1}`);
      await adminDb.execute(sql`DELETE FROM farm_subjects WHERE id = ${FS_ID}`);
      await adminDb.execute(sql`DELETE FROM subjects WHERE id IN (${S1}, ${S2})`);
    }
  });
});

afterAll(async () => {
  await closeDatabase();
  await adminClient.end();
});
