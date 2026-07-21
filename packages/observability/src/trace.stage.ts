// ── TraceStage (WO-034) ──
// Composable execution stage (ExecutionStage) that opens a trace span around the
// handler. The scaffold emits structured span logs via console; wiring a real
// OpenTelemetry tracer is a later work-order and slots in behind `TraceSpanSink`.

import type { ExecutionStage, ExecutionContext } from "@rocky/execution";

export interface TraceSpanSink {
  start(span: { name: string; ctx: ExecutionContext; timestamp: number }): void;
  end(span: { name: string; ctx: ExecutionContext; durationMs: number; timestamp: number }): void;
}

const consoleSink: TraceSpanSink = {
  start: (s) => console.debug(`[trace:start] ${s.name}`),
  end: (s) => console.debug(`[trace:end] ${s.name} ${s.durationMs}ms`),
};

export interface TraceStageOptions {
  name?: string;
  sink?: TraceSpanSink;
}

export class TraceStage implements ExecutionStage {
  readonly name: string;
  private readonly sink: TraceSpanSink;

  constructor(options: TraceStageOptions = {}) {
    this.name = options.name ?? "trace";
    this.sink = options.sink ?? consoleSink;
  }

  async execute(ctx: ExecutionContext, next: () => Promise<void>): Promise<void> {
    const startedAt = Date.now();
    this.sink.start({ name: this.name, ctx, timestamp: startedAt });
    try {
      await next();
    } finally {
      this.sink.end({ name: this.name, ctx, durationMs: Date.now() - startedAt, timestamp: startedAt });
    }
  }
}
