// ── tRPC AppContext ──
// Server-side context type for all tRPC procedures.
//
// Populated by ExecutionMiddleware (global middleware):
//   1. AuthResolver → Better Auth session → AuthResult
//   2. PrincipalResolver → SM user + RBAC → Principal
//   3. RuntimeBuilder → locale, traceId, tenant, clock
//   4. ExecutionPipeline → RLS, transaction
//
// The canonical actor is ctx.execution.principal.
// Old `user`/`session` fields kept for backwards compatibility.

import type { ExecutionContext } from "@rocky/execution";

export interface AppContext {
  /** HTTP headers from the incoming request */
  headers: Headers;

  /**
   * @deprecated Use `ctx.execution.principal` instead.
   * Populated by ExecutionMiddleware for backwards compat.
   */
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  } | null;

  /**
   * @deprecated Use `ctx.execution.principal` instead.
   * Populated by ExecutionMiddleware for backwards compat.
   */
  session?: {
    id: string;
    userId: string;
    expiresAt: Date;
  } | null;

  /** Full execution context — ALWAYS populated by ExecutionMiddleware (first global middleware) */
  execution?: ExecutionContext;

  /** Additional context properties (for transport adapters) */
  [key: string]: unknown;
}
