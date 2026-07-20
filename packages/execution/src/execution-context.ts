// ── ExecutionContext — Single Canonical Context ──
// Three immutable value objects assembled per pipeline execution.

import type { Principal } from "@rocky/authorization";

/**
 * CLS key under which the full ExecutionContext is stored during a pipeline run
 * (set by the RLS stage). Services such as AuditService read it to capture
 * request context (ip / userAgent / trace id) without threading it through every
 * call site (WO-159 Remediation B).
 */
export const EXECUTION_CONTEXT_CLS_KEY = "rocky.executionContext";

/**
 * Transport protocol of the incoming request.
 */
export type TransportProtocol = "trpc" | "rest" | "graphql" | "rabbitmq" | "cron" | "cli";

/**
 * Request context — information about the incoming request.
 */
export interface RequestContext {
  readonly headers: Headers;
  readonly ip: string | null;
  readonly userAgent: string | null;
  readonly transport: TransportProtocol;
}

/**
 * Runtime context — environment information set up per execution.
 */
export interface RuntimeContext {
  readonly traceId: string;
  readonly requestId: string;
  readonly locale: string;
  readonly tenant: string | null;
  readonly clock: Date;
}

/**
 * ExecutionContext — the single canonical context object.
 *
 * Everything a downstream service might need to know:
 *   - Who is this?     → principal
 *   - How did they get here? → request
 *   - What's the environment? → runtime
 */
export interface ExecutionContext {
  readonly principal: Principal;
  readonly request: RequestContext;
  readonly runtime: RuntimeContext;
}
