import { afterAll, describe, expect, it } from "vitest";
import { closeDatabase, db } from "@rocky/database";
import type { DatabaseProvider } from "@rocky/database";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { PassportRepository } from "./passport.repository.js";
import { CattlePassportFactory } from "@rocky/testing";

/**
 * WO-031 — Scenario C RLS test (real Postgres, dev only).
 * Passports are farm-scoped via farm_id. Non-superuser `rocky_rls_test`
 * for assertions; superuser `tbot` (RLS_ADMIN_URL) for scaffolding.
 * animal_id is NOT NULL, so we reuse an existing animal id.
 */
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const ADMIN_URL = process.env.RLS_ADMIN_URL ?? "";
// Scenario C needs a real Postgres + a superuser scaffold connection. Skip when
// the required env is absent (local) or points at production (safety). The suite
// still runs in CI where DATABASE_URL / RLS_ADMIN_URL are provided.
const hasRLSEnv =
  DATABASE_URL.length > 0 &&
  ADMIN_URL.length > 0 &&
  !DATABASE_URL.includes("prod") &&
  !ADMIN_URL.includes("prod");
const FARM_ID = "95ce25b8-6132-465b-8cd7-5101db5a48e1";
const S1 = "11111111-1111-4111-8111-111111111111";
const S2 = "22222222-2222-4222-8222-222222222222";
const ADMIN = "00000000-0000-4000-8000-000000000000";
const FS_ID = "bbbbbbbb-0000-4000-8000-0000000000bb";
const P1 = "33333333-3333-4333-8333-333333333333";

const adminClient = hasRLSEnv ? postgres(ADMIN_URL) : null;
const adminDb = hasRLSEnv ? drizzle({ client: adminClient! }) : null;
const repoOn = (tx: unknown) => new PassportRepository({ client: tx } as unknown as DatabaseProvider);
async function setCtx(tx: any, userId: string, role: string) {
  await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
  await tx.execute(sql`SELECT set_config('app.current_role', ${role}, true)`);
  await tx.execute(sql`SELECT set_config('app.current_org_id', ${ADMIN}, true)`);
}

describe.skipIf(!hasRLSEnv)("PassportRepository — RLS farm-scoped isolation (Scenario C)", () => {
  it("linked farmer sees own-farm passports; unlinked sees none", async () => {
    if (DATABASE_URL.includes("prod") || ADMIN_URL.includes("prod")) throw new Error("REFUSING RLS TEST ON PRODUCTION DB");
    if (!ADMIN_URL) throw new Error("RLS_ADMIN_URL (superuser) required for scaffolding");
    await adminDb.execute(sql`INSERT INTO subjects (id, short_name, is_active, created_at) VALUES (${S1}, 'S1', true, now()) ON CONFLICT DO NOTHING`);
    await adminDb.execute(sql`INSERT INTO subjects (id, short_name, is_active, created_at) VALUES (${S2}, 'S2', true, now()) ON CONFLICT DO NOTHING`);
    await adminDb.execute(sql`INSERT INTO farm_subjects (id, farm_id, subject_id, role) VALUES (${FS_ID}, ${FARM_ID}, ${S1}, 'owner') ON CONFLICT DO NOTHING`);
    try {
      await db.transaction(async (tx: any) => {
        await setCtx(tx, ADMIN, "SUPER_ADMIN");
        const rows = (await tx.execute(sql`SELECT id FROM animals LIMIT 1`)) as any;
        const animalId = rows[0]?.id;
        expect(animalId).toBeTruthy();
        const rec = new CattlePassportFactory(animalId, FARM_ID).create({ id: P1, status: "active" });
        expect(await repoOn(tx).create(rec as any)).not.toBeNull();

        await setCtx(tx, S1, "FARMER");
        expect(await repoOn(tx).findById(rec.id)).not.toBeNull();
        await setCtx(tx, S2, "FARMER");
        expect(await repoOn(tx).findById(rec.id)).toBeNull();
        await setCtx(tx, ADMIN, "SUPER_ADMIN");
        expect(await repoOn(tx).findById(rec.id)).not.toBeNull();
      });
    } finally {
      await adminDb.execute(sql`DELETE FROM cattle_passports WHERE id = ${P1}`);
      await adminDb.execute(sql`DELETE FROM farm_subjects WHERE id = ${FS_ID}`);
      await adminDb.execute(sql`DELETE FROM subjects WHERE id IN (${S1}, ${S2})`);
    }
  });
});
afterAll(async () => { await closeDatabase(); await adminClient.end(); });
