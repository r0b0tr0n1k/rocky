import { describe, expect, it, vi } from "vitest";
import { Observability } from "../observability.js";
import { Metrics, defaultMetrics } from "../metrics.js";
import { MetricsStage } from "../metrics.stage.js";
import { TraceStage } from "../trace.stage.js";

// Minimal ExecutionContext-shaped fixture (only `principal` is touched by stages).
function ctx() {
  return { principal: { id: "u1" }, request: {}, runtime: {} } as unknown as import("@rocky/execution").ExecutionContext;
}

describe("Observability scaffold (WO-034/035/036)", () => {
  it("assembles trace + metrics stages", () => {
    const obs = new Observability();
    expect(obs.trace).toBeInstanceOf(TraceStage);
    expect(obs.metricsStage).toBeInstanceOf(MetricsStage);
    expect(obs.stages).toHaveLength(2);
  });

  it("MetricsStage records timing + ok/error counters and rethrows", async () => {
    const metrics = new Metrics();
    const stage = new MetricsStage({ metric: "test.duration", metrics });
    const okCtx = ctx();

    await stage.execute(okCtx, async () => {});
    expect(metrics.getCounter("test.duration.ok")).toBe(1);
    expect(metrics.getTiming("test.duration")).toBeDefined();

    await expect(
      stage.execute(okCtx, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(metrics.getCounter("test.duration.error")).toBe(1);
  });

  it("TraceStage opens + closes a span around the handler", async () => {
    const sink = {
      start: vi.fn(),
      end: vi.fn(),
    };
    const stage = new TraceStage({ name: "op", sink });
    await stage.execute(ctx(), async () => {});
    expect(sink.start).toHaveBeenCalledTimes(1);
    expect(sink.end).toHaveBeenCalledTimes(1);
  });

  it("wires stages into the pipeline run path without polluting global registry", async () => {
    const obs = new Observability();
    const calls: string[] = [];
    const handler = async () => {
      calls.push("handler");
    };
    // run the full stage chain (trace -> metrics) around the handler
    await obs.stages[0]!.execute(ctx(), () => obs.stages[1]!.execute(ctx(), handler));
    // both stages run the single handler exactly once
    expect(calls).toEqual(["handler"]);
    expect(obs.snapshot().counters["execution.duration.ok"]).toBe(1);
  });
});
