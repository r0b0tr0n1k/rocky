import { Injectable } from "@nestjs/common";
import type { AppContext } from "@rocky/trpc/context.js";
import { TRPCError } from "@trpc/server";
import type { MiddlewareOptions, TRPCMiddleware } from "nestjs-trpc";

/**
 * Protected middleware - ensures user is authenticated
 *
 * Extends context with authenticated user info for downstream procedures.
 *
 * Usage:
 * ```typescript
 * @Router({ alias: "farm" })
 * @UseMiddlewares(ProtectedMiddleware)
 * export class FarmRouter {
 *   @Query({ output: FarmSchema })
 *   async getFarm(@Ctx() ctx: ProtectedMiddlewareContext) {
 *     // ctx.auth.userId is available here
 *     return this.farmService.findById(ctx.auth.userId);
 *   }
 * }
 * ```
 */
@Injectable()
export class ProtectedMiddleware implements TRPCMiddleware {
  async use(opts: MiddlewareOptions<AppContext>) {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be signed in to perform this action.",
      });
    }

    // Merge auth context into ctx for downstream procedures
    return next({
      ctx: {
        ...ctx,
        auth: {
          userId: ctx.user.id,
          role: ctx.user.role,
          permissions: ctx.user.permissions,
        },
      },
    });
  }
}

/**
 * Extended context type after ProtectedMiddleware
 * Use this as the type for @Ctx() in protected procedures
 */
export interface ProtectedMiddlewareContext extends AppContext {
  auth: {
    userId: string;
    role: string;
    permissions: string[];
  };
}
