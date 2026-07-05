// ── Execution Event Emitter ──
// In-process pub/sub for execution lifecycle events.
// Subscribers are registered once at startup, not in the hot path.

import { Injectable } from "@nestjs/common";
import type { ExecutionEvent } from "./execution-events.js";

export type ExecutionEventHandler = (event: ExecutionEvent) => void;

@Injectable()
export class ExecutionEventEmitter {
  private readonly subscribers: ExecutionEventHandler[] = [];

  emit(event: ExecutionEvent): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(event);
      } catch (err) {
        console.error("Execution event subscriber error:", err);
      }
    }
  }

  subscribe(handler: ExecutionEventHandler): void {
    this.subscribers.push(handler);
  }

  unsubscribe(handler: ExecutionEventHandler): void {
    const idx = this.subscribers.indexOf(handler);
    if (idx >= 0) {
      this.subscribers.splice(idx, 1);
    }
  }
}
