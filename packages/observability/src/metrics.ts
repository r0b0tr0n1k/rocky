// ── Metrics Registry (WO-035) ──
// In-process, append-only counters/timers. Intentionally dependency-free: this
// is the seam where a real exporter (Prometheus/OTel) would be plugged in. The
// scaffold keeps state in memory so the MetricsStage has somewhere to write
// without dragging a telemetry SDK into the hot path.

export interface MetricTiming {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
}

export class Metrics {
  private readonly counters = new Map<string, number>();
  private readonly timings = new Map<string, MetricTiming>();

  inc(name: string, by = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + by);
  }

  recordTiming(name: string, ms: number): void {
    const prev = this.counters.get(name);
    const existing = this.timings.get(name);
    if (existing) {
      existing.count += 1;
      existing.totalMs += ms;
      existing.minMs = Math.min(existing.minMs, ms);
      existing.maxMs = Math.max(existing.maxMs, ms);
    } else {
      this.timings.set(name, { count: 1, totalMs: ms, minMs: ms, maxMs: ms });
    }
  }

  getCounter(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  getTiming(name: string): MetricTiming | undefined {
    return this.timings.get(name);
  }

  snapshot(): { counters: Record<string, number>; timings: Record<string, MetricTiming> } {
    return {
      counters: Object.fromEntries(this.counters),
      timings: Object.fromEntries(this.timings),
    };
  }
}

// Module-level default registry so stages can be constructed without DI plumbing
// in tests; the Observability bootstrap may substitute a scoped instance.
export const defaultMetrics = new Metrics();
