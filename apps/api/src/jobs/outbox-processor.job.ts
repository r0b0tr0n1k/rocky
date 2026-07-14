/**
 * Outbox Processor Job
 *
 * @description Polls outbox_events table every 5 seconds for pending events,
 * processes them via registered handlers, and marks them as completed/failed.
 * Implements exactly-once delivery semantics with retry and dead-letter queue.
 *
 * Pattern: Transactional Outbox - events are inserted in the same DB transaction
 * as business data, then polled and dispatched asynchronously.
 */

import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { db } from "@rocky/database/index.js";
import { outboxEvents } from "@rocky/database/schema/sm/index.js";
import { and, eq, lt, sql } from "drizzle-orm";
import { OutboxEventHandlers } from "./outbox-handlers.js";

export type OutboxEventHandler = (event: {
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
}) => Promise<void>;

@Injectable()
export class OutboxProcessorJob {
  private readonly logger = new Logger(OutboxProcessorJob.name);
  private readonly batchSize = 50;
  private readonly maxRetries = 3;

  constructor(private readonly handlers: OutboxEventHandlers) {
    this.logger.log("OutboxProcessorJob initialized");
  }

  /** Main processing loop - runs every 5 seconds */
  @Cron("*/5 * * * * *")
  async processOutbox(): Promise<void> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const startedAt = Date.now();

        await db.transaction(async (tx) => {
          const events = await tx
            .select()
            .from(outboxEvents)
            .where(
              and(
                eq(outboxEvents.status, "pending"),
                eq(outboxEvents.deliveryAttempts, 0),
                lt(outboxEvents.nextAttemptAt, new Date()),
              ),
            )
            .orderBy(outboxEvents.createdAt)
            .limit(this.batchSize)
            .for("update", { skipLocked: true });

          if (events.length === 0) {
            return;
          }

          this.logger.debug(`Processing ${events.length} outbox events...`);

          let processed = 0;
          let failed = 0;

          for (const event of events) {
            try {
              await tx
                .update(outboxEvents)
                .set({
                  status: "processing",
                  deliveryAttempts: sql`${outboxEvents.deliveryAttempts} + 1`,
                  nextAttemptAt: new Date(Date.now() + 60000),
                })
                .where(eq(outboxEvents.id, event.id));

              const handler = this.handlers.get(event.type);
              if (!handler) {
                throw new Error(`No handler registered for event type: ${event.type}`);
              }

              await handler({
                type: event.type,
                aggregateType: event.aggregateType,
                aggregateId: event.aggregateId,
                payload: event.payload as Record<string, unknown>,
              });

              await tx
                .update(outboxEvents)
                .set({
                  status: "completed",
                  processedAt: new Date(),
                })
                .where(eq(outboxEvents.id, event.id));

              processed++;
            } catch (error) {
              this.logger.error(`Failed to process outbox event ${event.id}: ${error}`);
              const newAttempts = event.deliveryAttempts + 1;

              if (newAttempts >= this.maxRetries) {
                await tx
                  .update(outboxEvents)
                  .set({
                    status: "dead_letter",
                    processedAt: new Date(),
                    errorMessage: error instanceof Error ? error.message : String(error),
                  })
                  .where(eq(outboxEvents.id, event.id));

                this.logger.warn(`Event ${event.id} moved to dead-letter queue after ${newAttempts} attempts`);
              } else {
                await tx
                  .update(outboxEvents)
                  .set({
                    status: "pending",
                    deliveryAttempts: newAttempts,
                    nextAttemptAt: new Date(Date.now() + 2 ** (newAttempts - 1) * 60000),
                  })
                  .where(eq(outboxEvents.id, event.id));
              }

              failed++;
            }
          }

          const durationMs = Date.now() - startedAt;
          this.logger.log(`Outbox processing complete: ${processed} processed, ${failed} failed in ${durationMs}ms`);
        });

        return;
      } catch (error) {
        const isConnection =
          error instanceof Error &&
          (error.message.includes("ECONNREFUSED") ||
            error.message.includes("connection") ||
            error.message.includes("ENOTFOUND"));

        if (isConnection && attempt < maxAttempts) {
          this.logger.warn(`Outbox DB connection failed (attempt ${attempt}/${maxAttempts}), retrying in 2s...`);
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        this.logger.error(`Outbox processing failed after ${attempt} attempts`, error as Error);
        throw error;
      }
    }
  }
}
