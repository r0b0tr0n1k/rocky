// -- Principal Guard --
// Phase 3 migration: replace stacked middleware with Principal-based checks.
//
// Unlike the old ProtectedMiddleware (which checks ctx.user for Better Auth),
// this middleware checks ctx.execution.principal - the canonical runtime actor.
//
// Usage:
//   @Router({ alias: "farm" })
//   @UseMiddlewares(PrincipalGuard)
//   export class FarmRouter { ... }
//
// Or with permission check:
//   @UseMiddlewares(createPrincipalGuard("farm:create"))
//
// Eventually replaced by @Policy({ authenticated: true }) in Phase 4.

import type { AppContext } from "@rocky/trpc/context.js";
import { TRPCError } from "@trpc/server";
import type { MiddlewareOptions, TRPCMiddleware } from "nestjs-trpc";

/**
 * Guard that checks the request has an authenticated (non-anonymous) Principal.
  * Uses ctx.execution.principal - the canonical runtime actor.
 */
export class PrincipalGuard implements TRPCMiddleware {
  async use(opts: MiddlewareOptions<AppContext>) {
    const { ctx, next } = opts;

    if (!ctx.execution?.principal || ctx.execution.principal.id === "anonymous") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be signed in to perform this action.",
      });
    }

    return next(opts);
  }
}

/**
 * Create a Principal guard that checks a specific permission.
 * Uses ctx.execution.principal.hasPermission() instead of raw permissions array.
 *
 * @example
 * ```typescript
 * @UseMiddlewares(createPrincipalGuard("farm:create"))
 * async createFarm() { ... }
 * ```
 */
export function createPrincipalGuard(permission: string): new () => TRPCMiddleware {
  return class implements TRPCMiddleware {
    async use(opts: MiddlewareOptions<AppContext>) {
      const { ctx, next } = opts;

      if (!ctx.execution?.principal) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        });
      }

      if (!ctx.execution.principal.hasPermission(permission)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Missing required permission: ${permission}`,
        });
      }

      return next(opts);
    }
  };
}
