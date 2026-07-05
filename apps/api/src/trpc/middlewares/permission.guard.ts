/**
 * Permission Guard — Action-level authorization for tRPC procedures
 *
 * Layer 3 of the 3-layer RBAC architecture:
 *   Layer 1: pgPolicy — row-level filtering (database)
 *   Layer 2: RLSMiddleware — SET LOCAL session vars
 *   Layer 3: @RequirePermission / PermissionGuard — action authorization
 *
 * RLS solves *which rows you can see*.
 * This guard solves *whether you can call this procedure at all*.
 *
 * Usage (factory pattern — nestjs-trpc @UseMiddlewares expects class constructors):
 * ```typescript
 * @Mutation({ input: placeOrderSchema })
 * @UseMiddlewares(createPermissionGuard("eartag:order"))
 * async placeOrder(@Input() input: PlaceOrderRequest) { ... }
 * ```
 */

import type { TRPCMiddleware, MiddlewareOptions } from "nestjs-trpc";
import { TRPCError } from "@trpc/server";
import type { AppContext } from "@rocky/trpc/context.js";

/**
 * Creates a permission guard middleware class with the required permission baked in.
 * This satisfies nestjs-trpc's `@UseMiddlewares()` which expects class constructors.
 */
export function createPermissionGuard(permission: string): new () => TRPCMiddleware {
  return class implements TRPCMiddleware {
    async use(opts: MiddlewareOptions<AppContext & { auth?: { userId: string; role: string; permissions: string[] } }>) {
      const { ctx, next } = opts;

      const permissions = ctx.auth?.permissions;

      if (!permissions) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required for this action.",
        });
      }

      if (!permissions.includes(permission)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Missing required permission: ${permission}`,
        });
      }

      return next(opts);
    }
  };
}

/**
 * Legacy class-based guard — kept for backward compatibility.
 * Prefer createPermissionGuard() for @UseMiddlewares() usage.
 */
export class PermissionGuard implements TRPCMiddleware {
  constructor(private readonly requiredPermission: string) { }

  async use(opts: MiddlewareOptions<AppContext & { auth?: { userId: string; role: string; permissions: string[] } }>) {
    const { ctx, next } = opts;

    const permissions = ctx.auth?.permissions;

    if (!permissions) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required for this action.",
      });
    }

    if (!permissions.includes(this.requiredPermission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing required permission: ${this.requiredPermission}`,
      });
    }

    return next(opts);
  }
}

/**
 * Decorator-style helper for cleaner router syntax.
 */
export function RequirePermission(permission: string): MethodDecorator {
  return (_target: object, _propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata("requiredPermission", permission, descriptor.value);
    return descriptor;
  };
}
