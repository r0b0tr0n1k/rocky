// ── MetricsStage (WO-035) ──
// Composable execution stage that records wall-clock duration of the wrapped
// handler into the Metrics registry. Pairs with TraceStage to give every
// execution a span + a timing histogram without coupling business code to a
// telemetry SDK.

import type { ExecutionStage, ExecutionContext } from "@rocky/execution";
import { type Metrics, defaultMetrics } from "./metrics.js";

export interface MetricsStageOptions {
  name?: string;
  metric?: string;
  metrics?: Metrics;
}

export class MetricsStage implements ExecutionStage {
  readonly name: string;
  private readonly metric: string;
  private readonly metrics: Metrics;

  constructor(options: MetricsStageOptions = {}) {
    this.name = options.name ?? "metrics";
    this.metric = options.metric ?? "execution.duration";
    this.metrics = options.metrics ?? defaultMetrics;
  }

  async execute(ctx: ExecutionContext, next: () => Promise<void>): Promise<void> {
    const startedAt = performance.now();
    this.metrics.inc(`${this.metric}.started`);
    try {
      await next();
      this.metrics.inc(`${this.metric}.ok`);
    } catch (error) {
      this.metrics.inc(`${this.metric}.error`);
      throw error;
    } finally {
      this.metrics.recordTiming(this.metric, performance.now() - startedAt);
    }
  }
}
