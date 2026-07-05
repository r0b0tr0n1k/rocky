// ── Execution Pipeline — Composable Execution Stages ──
// Pipeline stages wrap business logic in cross-cutting concerns:
//   RLS → SET LOCAL on transactional connection
//   Policy → Evaluate @Policy decorator
//   Trace → Start OpenTelemetry span
//   Metrics → Record timing
//   Audit → Record audit trail (via events)
//   Events → Emit lifecycle events
//
// Pipeline configured once, runs for every request (tRPC, cron, RabbitMQ, CLI).

import { Injectable } from "@nestjs/common";
import type { Principal } from "@rocky/authorization";
import { SYSTEM_PRINCIPAL } from "@rocky/authorization";
import type { ClsService } from "nestjs-cls";
import type { ExecutionEventEmitter } from "./events/event-emitter.js";
import type { ExecutionCompleted, ExecutionFailed, ExecutionStarted } from "./events/execution-events.js";
import type { ExecutionContext, RequestContext } from "./execution-context.js";
import type { RLSStage } from "./rls/rls.stage.js";
import type { RuntimeBuilder } from "./runtime.builder.js";

export interface ExecutionStage {
  name: string;
  execute(ctx: ExecutionContext, next: () => Promise<void>): Promise<void>;
}

/**
 * Options for creating an ExecutionPipeline.
 */
export interface PipelineOptions {
  stages?: ExecutionStage[];
}

/**
 * ExecutionPipeline — composes stages into a runnable chain.
 *
 * Usage (tRPC middleware):
 * ```typescript
 * const pipeline = new ExecutionPipeline(cls, runtimeBuilder, rlsStage, eventEmitter);
 * await pipeline.run(ctx.execution, () => next(opts));
 * ```
 *
 * Usage (cron job):
 * ```typescript
 * const ctx = makeSystemExecutionContext();
 * await pipeline.run(ctx, () => riskAnalysisService.run());
 * ```
 */
@Injectable()
export class ExecutionPipeline {
  constructor(readonly _cls: ClsService,
    private readonly runtimeBuilder: RuntimeBuilder,
    private readonly rlsStage: RLSStage,
    private readonly eventEmitter: ExecutionEventEmitter,
  ) { }

  /**
   * Run the execution pipeline: resolve runtime, wrap in RLS transaction,
   * execute handler, emit lifecycle events.
   *
   * @param principal - Resolved principal (from PrincipalResolver)
   * @param request - Request context (from transport adapter)
   * @param handler - Business logic to execute
   * @returns The handler's return value
   */
  async run<T>(
    principal: Principal,
    request: RequestContext,
    handler: (principal: Principal) => Promise<T>,
  ): Promise<T> {
    // 1. Build runtime context
    const runtime = this.runtimeBuilder.resolve(request, principal);

    const executionCtx: ExecutionContext = { principal, request, runtime };

    // 2. Emit execution:started
    this.eventEmitter.emit({
      type: "execution:started",
      ctx: executionCtx,
      timestamp: new Date(),
    } satisfies ExecutionStarted);

    const startTime = Date.now();

    try {
      // 3. Run business logic inside RLS-scoped transaction
      const result = await this.rlsStage.run({ ctx: executionCtx }, async (_tx) => {
        return handler(principal);
      });

      // 4. Emit execution:completed
      const durationMs = Date.now() - startTime;
      this.eventEmitter.emit({
        type: "execution:completed",
        ctx: executionCtx,
        result,
        durationMs,
        timestamp: new Date(),
      } satisfies ExecutionCompleted);

      return result;
    } catch (error) {
      // 5. Emit execution:failed
      const durationMs = Date.now() - startTime;
      this.eventEmitter.emit({
        type: "execution:failed",
        ctx: executionCtx,
        error: error instanceof Error ? error : new Error(String(error)),
        durationMs,
        timestamp: new Date(),
      } satisfies ExecutionFailed);

      throw error;
    }
  }

  /**
   * Create a system execution context for cron jobs and CLI commands.
   */
  static makeSystemContext(): {
    principal: Principal;
    request: RequestContext;
  } {
    return {
      principal: SYSTEM_PRINCIPAL,
      request: {
        headers: new Headers(),
        ip: null,
        userAgent: null,
        transport: "cron",
      },
    };
  }
}
