import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { db, permissions, rolePermissions, roles, userRoles, users } from "@rocky/database";
import { LANGUAGE, ROLE_PRIORITY, USER_ROLE, USER_STATUS } from "@rocky/database/constants";
import { PrincipalResolver } from "./principal.resolver.js";

// ── Authenticated-branch integration test ──
// Exercises the real 4-table RBAC JOIN (sm_users → user_roles → roles →
// role_permissions → permissions) against a reachable Postgres.
//
// Self-skips when DATABASE_URL is not routable (e.g. inside a Dockerised VM
// that cannot reach the LAN DB). Runs + guards in any env where the DB is up.
// Inserts a uniquely-named fixture and deletes it in afterAll so the shared
// dev DB stays clean.

const stubCache = { get: () => undefined, set: () => {} } as any;
let dbAvailable = false;
let fx: {
  baId: string;
  roleName: string;
  permResource: string;
  permAction: string;
  smUserId: string;
  roleId: string;
  permId: string;
} | null = null;

async function seedFixture() {
  const s = Math.random().toString(36).slice(2, 10);
  const baId = `authflow-ba-${s}`;
  const roleName = `AUTHFLOW_${s}`;
  const permResource = `authflow${s}`;
  const permAction = "read";

  const roleRows = await db
    .insert(roles)
    .values({
      name: roleName,
      description: "temp auth-flow test role",
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
      authUserId: baId,
      username: `authflow_${s}`,
      language: LANGUAGE.MK,
      status: USER_STATUS.ACTIVE,
      role: USER_ROLE.FARMER,
    })
    .returning();
  const smUser = userRows[0];
  if (!smUser) throw new Error("fixture: sm_users insert returned no row");
  await db.insert(userRoles).values({ userId: smUser.id, roleId: role.id });

  return {
    baId,
    roleName,
    permResource,
    permAction,
    smUserId: smUser.id,
    roleId: role.id,
    permId: perm.id,
  };
}

async function cleanupFixture(f: NonNullable<typeof fx>) {
  await db.delete(userRoles).where(eq(userRoles.userId, f.smUserId));
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, f.roleId));
  await db.delete(users).where(eq(users.authUserId, f.baId));
  await db.delete(permissions).where(eq(permissions.id, f.permId));
  await db.delete(roles).where(eq(roles.id, f.roleId));
}

beforeAll(async () => {
  try {
    await db.execute(sql`select 1`);
    dbAvailable = true;
    fx = await seedFixture();
  } catch {
    dbAvailable = false;
  }
});

afterAll(async () => {
  if (dbAvailable && fx) await cleanupFixture(fx);
});

describe("PrincipalResolver.resolve (authenticated branch, integration)", () => {
  it("resolves roles + permissions + claims from the SM RBAC join", async (tc) => {
    if (!dbAvailable) return tc.skip();
    const resolver = new PrincipalResolver(stubCache);
    const principal = await resolver.resolve({
      session: { token: "x", userId: fx!.baId } as any,
      user: { id: fx!.baId, name: "AuthFlow" } as any,
    });

    expect(principal.roles).toContain(fx!.roleName);
    expect(principal.permissions).toContain(`${fx!.permResource}:${fx!.permAction}`);
    expect(principal.claims.locale).toBe("MK");
    // USER_STATUS.ACTIVE is the lowercase Postgres enum value "active"
    expect(principal.claims.status).toBe("active");
    // A non-system, non-org, non-bypass role resolves to least-privilege "own"
    expect(principal.accessLevel).toBe("own");
  });
});
