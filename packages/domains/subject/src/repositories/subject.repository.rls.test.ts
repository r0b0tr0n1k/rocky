import { afterAll, describe, expect, it } from "vitest";
import { closeDatabase, db } from "@rocky/database";
import type { DatabaseProvider } from "@rocky/database";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { SubjectRepository } from "./subject.repository.js";
import { SubjectFactory } from "@rocky/testing";

/**
 * WO-031 - Scenario C RLS test (real Postgres, dev only).
 *
 * Subject RLS (subject_access_policy): admins + VETERINARIAN see all subjects;
 * other roles see subjects linked via farm_subjects to a farm in their org area
 * (farmInOrgArea); writes are restricted to adminWrite. Connects as the
 * constrained `rocky_rls_test` role; a superuser (RLS_ADMIN_URL) only scaffolds.
 * Never run on production.
 */
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const ADMIN_URL = process.env.RLS_ADMIN_URL ?? "";
const hasRLSEnv =
  DATABASE_URL.length > 0 &&
  ADMIN_URL.length > 0 &&
  DATABASE_URL.includes("prod") === false &&
  ADMIN_URL.includes("prod") === false;

const S1 = "11111111-1111-4111-8111-111111111111";
const S2 = "22222222-2222-4222-8222-222222222222";
const ADMIN = "00000000-0000-4000-8000-000000000000";
const SUBJ = "dddddddd-0000-4000-8000-0000000000dd";
const SUBJ2 = "eeeeeeee-0000-4000-8000-0000000000ee";

const adminClient = hasRLSEnv ? postgres(ADMIN_URL) : null;
const adminDb = hasRLSEnv ? drizzle({ client: adminClient as NonNullable<typeof adminClient> }) : null;
const adb = adminDb as NonNullable<typeof adminDb>;

const repoOn = (tx: unknown) => new SubjectRepository({ client: tx } as unknown as DatabaseProvider);

async function setCtx(tx: any, userId: string, role: string, org: string = ADMIN) {
  await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
  await tx.execute(sql`SELECT set_config('app.current_role', ${role}, true)`);
  await tx.execute(sql`SELECT set_config('app.current_org_id', ${org}, true)`);
}

describe.skipIf(hasRLSEnv === false)("SubjectRepository - RLS admin/vet see all, unlinked farmer sees none (Scenario C)", () => {
  it("admin + vet read all; unlinked farmer reads none; farmer write blocked", async () => {
    const subj = new SubjectFactory().createIndividual({ id: SUBJ });
    try {
      await db.transaction(async (tx: any) => {
        await setCtx(tx, ADMIN, "SUPER_ADMIN");
        expect(await repoOn(tx).insert(subj as any)).not.toBeNull();
        expect(await repoOn(tx).findById(SUBJ)).not.toBeNull(); // admin sees own insert
        await setCtx(tx, S1, "VETERINARIAN");
        expect(await repoOn(tx).findById(SUBJ)).not.toBeNull(); // vet in read set
        await setCtx(tx, S2, "FARMER");
        expect(await repoOn(tx).findById(SUBJ)).toBeNull(); // unlinked farmer hidden
      });

      // FARMER write is blocked by the withCheck adminWrite clause.
      await expect(
        db.transaction(async (tx: any) => {
          await setCtx(tx, S2, "FARMER");
          await repoOn(tx).insert(new SubjectFactory().createIndividual({ id: SUBJ2 }) as any);
        }),
      ).rejects.toThrow();
    } finally {
      await adb.execute(sql`DELETE FROM subjects WHERE id IN (${SUBJ}, ${SUBJ2})`);
    }
  });
});

afterAll(async () => {
  await closeDatabase();
  await adminClient?.end();
});
