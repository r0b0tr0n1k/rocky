// ── @rocky/observability (WO-034 / WO-035 / WO-036) ──
// Observability scaffold: composable Trace + Metrics execution stages and a
// dependency-free Metrics registry. The ExecutionEventEmitter (packages/execution)
// is retained for backward compatibility but is no longer on the DoD critical
// path — telemetry flows through these stages instead.

export { Metrics, defaultMetrics } from "./metrics.js";
export type { MetricTiming } from "./metrics.js";
export { TraceStage } from "./trace.stage.js";
export type { TraceSpanSink, TraceStageOptions } from "./trace.stage.js";
export { MetricsStage } from "./metrics.stage.js";
export type { MetricsStageOptions } from "./metrics.stage.js";
export { Observability } from "./observability.js";
export type { ObservabilityOptions } from "./observability.js";
