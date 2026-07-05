// ── PrincipalResolver ──
// The boundary between authentication and authorization.
//
// Takes: AuthResult (from @rocky/auth) — identity only
// Produces: Principal — the canonical runtime actor for business code
//
// This is the ONLY place where:
//   - Better Auth user ID → SM user ID mapping happens
//   - RBAC tables are read (roles, permissions)
//   - Access level is computed
//   - Claims map is built
//
// Business code NEVER touches RBAC tables or SM users directly.
// It only sees Principal.

import { Injectable } from "@nestjs/common";
import type { AuthResult } from "@rocky/auth";
import {
  db,
  permissions as permTable,
  rolePermissions,
  roles,
  userRoles as smUserRoles,
  users as smUsers,
} from "@rocky/database";
import { ORG_SCOPED_ROLES, RLS_BYPASS_ROLES, ROLE_HIERARCHY } from "@rocky/database/constants";
import { eq } from "drizzle-orm";
import { type AccessLevel, Principal } from "./principal.js";
import { ANONYMOUS_PRINCIPAL } from "./principals.js";

@Injectable()
export class PrincipalResolver {
  /**
   * Resolve authentication result → full Principal with RBAC.
   *
   * @param authResult - Identity from @rocky/auth (may be null for anonymous)
   * @returns Fully resolved Principal
   */
  async resolve(authResult: AuthResult): Promise<Principal> {
    if (!authResult?.user) {
      return ANONYMOUS_PRINCIPAL;
    }

    const authUser = authResult.user;

    // Step 1: Find SM user linked to this Better Auth identity
    const [smUser] = await db.select().from(smUsers).where(eq(smUsers.authUserId, authUser.id)).limit(1);

    let smUserId: string;
    let username: string;
    let orgCtx: { id: string } | null = null;
    let roleNames: string[] = [];
    let permissionList: string[] = [];

    if (smUser) {
      smUserId = smUser.id;
      username = smUser.username ?? authUser.name;

      if (smUser.organizationId) {
        orgCtx = { id: smUser.organizationId };
      }

      // Step 2: Load roles + permissions via explicit joins
      const userRoles = await db
        .select({
          roleName: roles.name,
          permResource: permTable.resource,
          permAction: permTable.action,
        })
        .from(smUserRoles)
        .where(eq(smUserRoles.userId, smUser.id))
        .leftJoin(roles, eq(smUserRoles.roleId, roles.id))
        .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .leftJoin(permTable, eq(rolePermissions.permissionId, permTable.id));

      roleNames = [...new Set(userRoles.map((r) => r.roleName).filter((n): n is string => n != null))];

      permissionList = [
        ...new Set(
          userRoles
            .map((r) => (r.permResource && r.permAction ? `${r.permResource}:${r.permAction}` : null))
            .filter((s): s is string => s != null),
        ),
      ];
    } else {
      // No SM user record — use auth user as fallback
      smUserId = authUser.id;
      username = authUser.name;
    }

    // Step 3: Compute access level from highest role
    const highestRole =
      roleNames.length > 0
        ? roleNames.reduce((a, b) => ((ROLE_HIERARCHY[a] ?? 0) >= (ROLE_HIERARCHY[b] ?? 0) ? a : b))
        : "FARMER";

    const accessLevel: AccessLevel = RLS_BYPASS_ROLES.some((r) => r === highestRole)
      ? "all"
      : ORG_SCOPED_ROLES.some((r) => roleNames.includes(r))
        ? "organization"
        : "own";

    // Step 4: Build claims map
    const claims: Record<string, unknown> = {
      locale: smUser?.language ?? "MK",
      status: smUser?.status ?? "ACTIVE",
    };

    return Principal.create({
      id: smUserId,
      username,
      roles: roleNames,
      permissions: permissionList,
      organization: orgCtx,
      accessLevel,
      claims,
    });
  }
}
