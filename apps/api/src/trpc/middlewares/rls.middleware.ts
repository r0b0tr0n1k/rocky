/**
 * Row-Level Security (RLS) Middleware
 *
 * 1. Reads the enriched Better Auth session (populated by customSession)
 * 2. Executes SET LOCAL app.current_user_id / current_role / current_org_id
 *    so PostgreSQL pgPolicy USING clauses evaluate against the correct user
 * 3. Injects rls context for application-level filtering
 *
 * Usage:
 * ```typescript
 * @Router({ alias: "animal" })
 * @UseMiddlewares(RLSMiddleware)
 * export class AnimalRouter {
 *   @Query({ output: AnimalListSchema })
 *   async getAnimals(@Ctx() ctx: RLSMiddlewareContext) {
 *     return this.animalService.list(ctx.rls);
 *   }
 * }
 * ```
 */

import { Injectable } from "@nestjs/common";
import { ORG_SCOPED_ROLES, RLS_BYPASS_ROLES, ROLE_HIERARCHY } from "@rocky/database/constants/index.js";
import { db } from "@rocky/database/index.js";
import type { AppContext } from "@rocky/trpc/context.js";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";
import type { MiddlewareOptions, TRPCMiddleware } from "nestjs-trpc";

/** Extended user type after customSession enrichment */
interface EnrichedUser {
  id: string;
  smUserId: string | null;
  role: string;
  roles: string[];
  permissions: string[];
  organizationId: string | null;
  districtId: string | null;
  username: string | null;
  language: string;
  status: string;
  email: string;
  name: string;
}

@Injectable()
export class RLSMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions<AppContext>) {
    const { ctx, next } = opts;

    const user = ctx.user as unknown as EnrichedUser | undefined;
    if (!user?.smUserId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required for RLS enforcement.",
      });
    }

    const primaryRole = user.role;
    const orgId = user.organizationId;
    const highestRole =
      user.roles.length > 0
        ? user.roles.reduce((a, b) => ((ROLE_HIERARCHY[a] ?? 0) >= (ROLE_HIERARCHY[b] ?? 0) ? a : b))
        : primaryRole;

    // -- Calculate access level ---------------------------------
    const accessLevel = RLS_BYPASS_ROLES.some((r: string) => r === highestRole)
      ? ("all" as const)
      : ORG_SCOPED_ROLES.some((r: string) => user.roles.includes(r))
        ? ("organization" as const)
        : ("own" as const);

    // -- Execute PostgreSQL SET LOCAL - this is what makes pgPolicy work --
    await db.execute(sql`
      SELECT set_config('app.current_user_id', ${user.smUserId}, true);
      SELECT set_config('app.current_role', ${highestRole}, true);
      SELECT set_config('app.current_org_id', ${orgId ?? ""}, true);
    `);

    // -- Inject rls context for application-level filtering -----
    return next({
      ctx: {
        ...ctx,
        rls: {
          userId: user.smUserId,
          role: highestRole,
          roles: user.roles,
          districtId: user.districtId,
          organizationId: orgId,
          accessLevel,
        },
      },
    });
  }
}

/** Extended context after RLSMiddleware */
export interface RLSMiddlewareContext extends AppContext {
  rls: {
    userId: string;
    role: string;
    roles: string[];
    districtId: string | null;
    organizationId: string | null;
    accessLevel: "all" | "organization" | "own";
  };
}
