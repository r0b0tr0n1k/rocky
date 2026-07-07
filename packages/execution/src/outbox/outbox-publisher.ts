/**
 * Outbox Event Publisher
 *
 * @description Publishes domain events to the outbox_events table within the
 * current database transaction. If called inside an RLSStage transaction,
 * the event is committed atomically with the business data.
 *
 * Usage:
 *   await this.outboxPublisher.publish({
 *     type: "notifiable_disease.detected",
 *     aggregateType: "treatment",
 *     aggregateId: treatment.id,
 *     payload: { diseaseId, farmId, animalId },
 *     createdBy: user.id,
 *   });
 */

import { Injectable, NotFoundException } from "@nestjs/common";
import { db, TX_KEY } from "@rocky/database";
import { outboxEvents } from "@rocky/database";
import { ClsService } from "nestjs-cls";
import type { Tx } from "@rocky/database";

export interface PublishOutboxEventInput {
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  createdBy?: string;
}

@Injectable()
export class OutboxEventPublisher {
  constructor(private readonly cls: ClsService) {}

  /**
   * Publish an event to the outbox.
   * Uses the transactional connection from AsyncLocalStorage if available,
   * otherwise falls back to the regular db connection.
   */
  async publish(input: PublishOutboxEventInput): Promise<void> {
    const tx = this.cls.get<Tx>(TX_KEY);

    const [event] = await (tx ?? db)
      .insert(outboxEvents)
      .values({
        type: input.type,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        payload: input.payload,
        createdBy: input.createdBy,
      })
      .returning();

    if (!event) {
      throw new NotFoundException("Failed to publish outbox event");
    }
  }
}
