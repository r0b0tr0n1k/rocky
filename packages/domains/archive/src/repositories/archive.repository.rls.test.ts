import { afterAll, describe, expect, it } from "vitest";
import { closeDatabase, db } from "@rocky/database";
import type { DatabaseProvider } from "@rocky/database";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { ArchiveRepository } from "./archive.repository.js";
import { ArchiveDocumentFactory } from "@rocky/testing";

/**
 * WO-031 — Scenario C RLS test (real Postgres, dev only).
 * archive_documents is admin/vet-scoped ONLY (no FARMER branch by design —
 * archive docs are official records). Asserts: farmers (linked or not)
 * cannot read; SUPER_ADMIN can. Non-superuser `rocky_rls_test` for
 * assertions; superuser `tbot` (RLS_ADMIN_URL) for scaffolding.
 */
const DATABASE_URL = process.env.DATABASE_URL ?? "";
const ADMIN_URL = process.env.RLS_ADMIN_URL ?? "";
const FARM_ID = "95ce25b8-6132-465b-8cd7-5101db5a48e1";
const S1 = "11111111-1111-4111-8111-111111111111";
const S2 = "22222222-2222-4222-8222-222222222222";
const ADMIN = "00000000-0000-4000-8000-000000000000";
const FS_ID = "bbbbbbbb-0000-4000-8000-0000000000bb";
const D1 = "33333333-3333-4333-8333-333333333333";

const adminClient = postgres(ADMIN_URL);
const adminDb = drizzle({ client: adminClient });
const repoOn = (tx: unknown) => new ArchiveRepository({ client: tx } as unknown as DatabaseProvider);
async function setCtx(tx: any, userId: string, role: string) {
  await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
  await tx.execute(sql`SELECT set_config('app.current_role', ${role}, true)`);
  await tx.execute(sql`SELECT set_config('app.current_org_id', ${ADMIN}, true)`);
}

describe("ArchiveRepository — RLS admin/vet-only (Scenario C)", () => {
  it("farmers cannot read archive docs; SUPER_ADMIN can", async () => {
    if (DATABASE_URL.includes("prod") || ADMIN_URL.includes("prod")) throw new Error("REFUSING RLS TEST ON PRODUCTION DB");
    if (!ADMIN_URL) throw new Error("RLS_ADMIN_URL (superuser) required for scaffolding");
    await adminDb.execute(sql`INSERT INTO subjects (id, short_name, is_active, created_at) VALUES (${S1}, 'S1', true, now()) ON CONFLICT DO NOTHING`);
    await adminDb.execute(sql`INSERT INTO subjects (id, short_name, is_active, created_at) VALUES (${S2}, 'S2', true, now()) ON CONFLICT DO NOTHING`);
    await adminDb.execute(sql`INSERT INTO farm_subjects (id, farm_id, subject_id, role) VALUES (${FS_ID}, ${FARM_ID}, ${S1}, 'owner') ON CONFLICT DO NOTHING`);
    try {
      await db.transaction(async (tx: any) => {
        await setCtx(tx, ADMIN, "SUPER_ADMIN");
        const rec = new ArchiveDocumentFactory(FARM_ID).create({ id: D1 });
        expect(await repoOn(tx).create(rec as any)).not.toBeNull();
        // Farmers are denied archive docs by design (no FARMER branch).
        await setCtx(tx, S1, "FARMER");
        expect(await repoOn(tx).findById(rec.id)).toBeNull();
        await setCtx(tx, S2, "FARMER");
        expect(await repoOn(tx).findById(rec.id)).toBeNull();
        await setCtx(tx, ADMIN, "SUPER_ADMIN");
        expect(await repoOn(tx).findById(rec.id)).not.toBeNull();
      });
    } finally {
      await adminDb.execute(sql`DELETE FROM archive_documents WHERE id = ${D1}`);
      await adminDb.execute(sql`DELETE FROM farm_subjects WHERE id = ${FS_ID}`);
      await adminDb.execute(sql`DELETE FROM subjects WHERE id IN (${S1}, ${S2})`);
    }
  });
});
afterAll(async () => { await closeDatabase(); await adminClient.end(); });
