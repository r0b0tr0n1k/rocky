// ── Execution Lifecycle Events ──
// Events emitted during pipeline execution.
// Subscribers (audit, trace, metrics) react to these without coupling.

import type { ExecutionContext } from "../execution-context.js";

export interface ExecutionStarted {
  type: "execution:started";
  ctx: ExecutionContext;
  timestamp: Date;
}

export interface ExecutionCompleted {
  type: "execution:completed";
  ctx: ExecutionContext;
  result: unknown;
  durationMs: number;
  timestamp: Date;
}

export interface ExecutionFailed {
  type: "execution:failed";
  ctx: ExecutionContext;
  error: Error;
  durationMs: number;
  timestamp: Date;
}

/**
 * Emitted whenever a document is generated (inspection-form, passport, movement,
 * ched-a, ...). Provides the audit trail for regulated outputs such as the CHED-A
 * (WO-121) — a lawful, logged PII disclosure per ADR-0061.
 */
export interface DocumentGenerated {
  type: "document:generated";
  documentType: string;
  refId: string;
  format: string;
  timestamp: Date;
}

export type ExecutionEvent = ExecutionStarted | ExecutionCompleted | ExecutionFailed | DocumentGenerated;
