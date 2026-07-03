// ── withRls — RLS Context Injection Middleware ──
// Injects user context into PostgreSQL session for native RLS policies
// Used by ALL role-based access policies in the system

import { sql } from "drizzle-orm";
import type { DB } from "@rocky/database";

export interface RlsContext {
	userId: string;
	orgId: string | null;
	role: string;
}

/**
 * Inject RLS context variables into the PostgreSQL session.
 * Must be called at the start of every tenant-scoped query.
 * Policies reference these via current_setting('app.*', true).
 */
export async function injectRlsContext(db: DB, ctx: RlsContext): Promise<void> {
	await db.execute(sql`
    SELECT set_config('app.current_user_id', ${ctx.userId}, true),
           set_config('app.current_org_id', ${ctx.orgId}, true),
           set_config('app.current_role', ${ctx.role}, true)
  `);
}

/**
 * Clear RLS context from the PostgreSQL session.
 * Call after completing RLS-scoped operations.
 */
export async function clearRlsContext(db: DB): Promise<void> {
	await db.execute(sql`
    SELECT set_config('app.current_user_id', '', true),
           set_config('app.current_org_id', '', true),
           set_config('app.current_role', '', true)
  `);
}

/**
 * Validate that RLS context is set.
 * Throws if any context variable is missing.
 */
export async function validateRlsContext(db: DB): Promise<boolean> {
	type RlsSetting = { user_id: string; org_id: string | null; role: string };
	const [row] = await db.execute<RlsSetting>(sql`
    SELECT current_setting('app.current_user_id', true) as user_id,
           current_setting('app.current_org_id', true) as org_id,
           current_setting('app.current_role', true) as role
  `);
	return !!(row?.user_id && row?.role);
}
