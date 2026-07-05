// ── Execution Middleware ──
// Wraps every tRPC request in the full execution pipeline:
//   AuthResolver → PrincipalResolver → RuntimeBuilder → ExecutionPipeline (RLS + events)
//
// This is the CENTRAL ENTRY POINT for the new architecture.
//
// Old middlewares (ProtectedMiddleware, RLSMiddleware, PermissionGuard) still
// work because ctx.user and ctx.session are still populated. But new code
// should use ctx.execution.principal instead.

import { Inject, Injectable } from "@nestjs/common";
import { AUTH_INSTANCE, type Auth, AuthResolver } from "@rocky/auth";
import type { PrincipalResolver } from "@rocky/authorization/index.js";
import type {
  ExecutionContext as ExecCtx,
  ExecutionPipeline,
  RequestContext,
  RuntimeBuilder,
} from "@rocky/execution/index.js";
import type { AppContext } from "@rocky/trpc/context.js";
import type { MiddlewareOptions, TRPCMiddleware } from "nestjs-trpc";

@Injectable()
export class ExecutionMiddleware implements TRPCMiddleware {
  constructor(
    @Inject(AUTH_INSTANCE) private readonly auth: ReturnType<typeof Auth.getInstance>,
    private readonly principalResolver: PrincipalResolver,
    private readonly pipeline: ExecutionPipeline,
    private readonly runtimeBuilder: RuntimeBuilder,
  ) {}

  async use(opts: MiddlewareOptions<AppContext>) {
    const { ctx, next } = opts;

    // 1. Resolve authentication from cookie
    const cookieHeader = ctx.headers?.get?.("cookie") ?? "";
    const authResult = await AuthResolver.resolve(this.auth, cookieHeader);

    // 2. Resolve principal (handles anonymous automatically)
    const principal = await this.principalResolver.resolve(authResult);

    // 3. Build request context
    const request: RequestContext = {
      headers: ctx.headers ?? new Headers(),
      ip: ctx.headers?.get?.("x-forwarded-for") ?? ctx.headers?.get?.("x-real-ip") ?? null,
      userAgent: ctx.headers?.get?.("user-agent") ?? null,
      transport: "trpc",
    };

    // 4. Run inside ExecutionPipeline (RLS transaction + events)
    return this.pipeline.run(principal, request, async (_principal) => {
      // Set execution context on the tRPC context for downstream middleware and routers
      const runtime = this.runtimeBuilder.resolve(request, _principal);
      ctx.execution = { principal: _principal, request, runtime } satisfies ExecCtx;

      return next({ ctx });
    });
  }
}
