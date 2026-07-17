import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, permissions, rolePermissions, roles, userRoles, users } from "@rocky/database";
import { account, session, user as baUser, verification } from "@rocky/database/schema/auth";
import { LANGUAGE, ROLE_PRIORITY, USER_ROLE, USER_STATUS } from "@rocky/database/constants";
import { AuthResolver } from "@rocky/auth";
import { PrincipalResolver } from "./principal.resolver.js";

// ── E2E auth-flow test (Better Auth Test Utils) ──
// Drives the REAL session path: a session is created via better-auth's official
// `testUtils()` plugin (no HTTP server needed), the session cookie is handed to
// AuthResolver (which calls auth.api.getSession) and then to PrincipalResolver
// (the 4-table SM RBAC join). This is the full cookie → principal flow that
// ExecutionMiddleware runs on every /trpc request — exercised without Nest.
//
// Self-skips when DATABASE_URL is not routable (e.g. a Dockerised VM that cannot
// reach the LAN DB). Runs + guards wherever the DB is up.

const testAuth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8000",
  secret: process.env.BETTER_AUTH_SECRET ?? "test-insecure-secret-for-tests-only-32chars",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: baUser, session, account, verification },
  }),
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:8000"],
  advanced: { cookiePrefix: "rocky", generateId: false },
  emailAndPassword: { enabled: true },
  // testUtils() is the ONLY addition over the production config; it exposes
  // ctx.test (factories, saveUser, getAuthHeaders) and creates no public routes.
  plugins: [testUtils()],
});

const stubCache = { get: () => undefined, set: () => {} } as any;
let dbAvailable = false;
let baUserId: string | null = null;
let fx: {
  smUserId: string;
  roleId: string;
  permId: string;
  roleName: string;
  permResource: string;
  permAction: string;
} | null = null;

async function seedSmFixture(authUserId: string) {
  const s = Math.random().toString(36).slice(2, 10);
  const roleName = `AUTHFLOW_${s}`;
  const permResource = `authflow${s}`;
  const permAction = "read";

  const roleRows = await db
    .insert(roles)
    .values({
      name: roleName,
      description: "temp auth-flow e2e role",
      priority: ROLE_PRIORITY.NORMAL,
      isSystem: false,
    })
    .returning();
  const role = roleRows[0];
  if (!role) throw new Error("fixture: roles insert returned no row");
  const permRows = await db
    .insert(permissions)
    .values({
      resource: permResource,
      action: permAction,
    })
    .returning();
  const perm = permRows[0];
  if (!perm) throw new Error("fixture: permissions insert returned no row");
  await db.insert(rolePermissions).values({ roleId: role.id, permissionId: perm.id });
  const userRows = await db
    .insert(users)
    .values({
      authUserId,
      username: `authflow_${s}`,
      language: LANGUAGE.MK,
      status: USER_STATUS.ACTIVE,
      role: USER_ROLE.FARMER,
    })
    .returning();
  const smUser = userRows[0];
  if (!smUser) throw new Error("fixture: sm_users insert returned no row");
  await db.insert(userRoles).values({ userId: smUser.id, roleId: role.id });

  return { smUserId: smUser.id, roleId: role.id, permId: perm.id, roleName, permResource, permAction };
}

async function cleanup(f: NonNullable<typeof fx>, baId: string) {
  await db.delete(userRoles).where(eq(userRoles.userId, f.smUserId));
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, f.roleId));
  await db.delete(users).where(eq(users.authUserId, baId));
  await db.delete(permissions).where(eq(permissions.id, f.permId));
  await db.delete(roles).where(eq(roles.id, f.roleId));
  const ctx = await testAuth.$context;
  await ctx.test.deleteUser(baId);
}

beforeAll(async () => {
  try {
    await db.execute(sql`select 1`);
    dbAvailable = true;
    const ctx = await testAuth.$context;
    const u = ctx.test.createUser({ email: `authflow-${Math.random().toString(36).slice(2, 8)}@example.com` });
    await ctx.test.saveUser(u);
    baUserId = u.id;
    fx = await seedSmFixture(baUserId);
  } catch {
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (dbAvailable && fx && baUserId) await cleanup(fx, baUserId);
});

describe("auth flow e2e (testUtils session → AuthResolver → PrincipalResolver)", () => {
  it("resolves RBAC from a real Better Auth session cookie", async (tc) => {
    if (!dbAvailable) return tc.skip();

    const ctx = await testAuth.$context;
    const headers = await ctx.test.getAuthHeaders({ userId: baUserId! });
    const cookie = headers.get("cookie");
    expect(cookie).toBeTruthy();

    // AuthResolver reads the cookie and calls auth.api.getSession
    const authResult = await AuthResolver.resolve(
      testAuth as unknown as Parameters<typeof AuthResolver.resolve>[0],
      cookie!,
    );
    expect(authResult?.user?.id).toBe(baUserId);

    // PrincipalResolver runs the SM RBAC join
    const principal = await new PrincipalResolver(stubCache).resolve(authResult);
    expect(principal.roles).toContain(fx!.roleName);
    expect(principal.permissions).toContain(`${fx!.permResource}:${fx!.permAction}`);
    expect(principal.claims.locale).toBe("MK");
    expect(principal.claims.status).toBe("active");
    // A non-system, non-org, non-bypass role resolves to least-privilege "own"
    expect(principal.accessLevel).toBe("own");
  });
});
