// ── Observability bootstrap (WO-036) ──
// Single entry point that assembles the Trace + Metrics stages and a shared
// Metrics registry. Kept minimal on purpose: this is the seam where a future
// work-order swaps the console/log sinks for OTel/Prometheus without touching
// the ExecutionPipeline or any domain service.

import { Metrics } from "./metrics.js";
import { MetricsStage } from "./metrics.stage.js";
import { TraceStage } from "./trace.stage.js";
import type { ExecutionStage } from "@rocky/execution";

export interface ObservabilityOptions {
  traceName?: string;
  metricName?: string;
  metrics?: Metrics;
}

export class Observability {
  readonly metrics: Metrics;
  readonly trace: TraceStage;
  readonly metricsStage: MetricsStage;
  readonly stages: ExecutionStage[];

  constructor(options: ObservabilityOptions = {}) {
    this.metrics = options.metrics ?? new Metrics();
    this.trace = new TraceStage({ name: options.traceName ?? "trace" });
    this.metricsStage = new MetricsStage({
      name: "metrics",
      metric: options.metricName ?? "execution.duration",
      metrics: this.metrics,
    });
    this.stages = [this.trace, this.metricsStage];
  }

  /** Snapshot of recorded counters/timings for health dashboards / tests. */
  snapshot() {
    return this.metrics.snapshot();
  }
}
