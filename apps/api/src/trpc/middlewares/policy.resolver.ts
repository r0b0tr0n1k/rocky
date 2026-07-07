// -- Policy Resolver (tRPC Middleware) --
// Reads @Policy() metadata from router classes via PolicyRegistry
// and evaluates the policy against ctx.execution.principal.
//
// Applied globally to all routers. No @UseMiddlewares needed.

import { Inject, Injectable } from "@nestjs/common";
import { PolicyEngine, PolicyRegistry } from "@rocky/authorization/index.js";
import type { AppContext } from "@rocky/trpc/context.js";
import { TRPCError } from "@trpc/server";
import type { MiddlewareOptions } from "nestjs-trpc";

/**
  * Policy resolver middleware - applied as global middleware.
 *
 * Uses structural typing instead of `implements TRPCMiddleware`
 * because nestjs-trpc's MiddlewareResponse type is opaque and
 * the interface's generic constraints don't align with AppContext.
 */
@Injectable()
export class PolicyResolver {
  constructor(@Inject(PolicyEngine) private readonly policyEngine: PolicyEngine) {}

  /**
   * Standard tRPC middleware signature (matches TRPCMiddleware structurally).
   * Policy lookup via PolicyRegistry at runtime.
   */
  async use(opts: MiddlewareOptions<AppContext>) {
    const { ctx, next, path } = opts;
    const principal = ctx.execution?.principal;

    // Path format: "routerAlias.methodName" e.g. "farm.list"
    const policy = path ? PolicyRegistry.get(path) : undefined;

    if (!policy) {
      // No policy defined - RLS/pgPolicy still enforces row-level
      return next(opts);
    }

    if (!principal) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      });
    }

    const decision = await this.policyEngine.evaluate(principal, policy);

    if (!decision.allowed) {
      throw new TRPCError({
        code: policy.action ? "FORBIDDEN" : "UNAUTHORIZED",
        message: decision.reason ?? "Access denied",
      });
    }

    return next(opts);
  }
}
