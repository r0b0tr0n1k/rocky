/**
 * Outbox Event Handlers
 *
 * @description Registry of handlers for outbox events.
 * Each handler receives the event payload and performs the side effect.
 *
 * Handlers are registered by domain modules and invoked by OutboxProcessorJob.
 */

import { Injectable, Logger } from "@nestjs/common";
import type { OutboxEventHandler } from "./outbox-processor.job.js";
import type { InspectionService } from "@rocky/domains-inspection";
import type { NotificationService } from "@rocky/domains-notification/index.js";
import { SubscriptionResolver, EVENT_TYPE_IDS } from "@rocky/domains-notification/index.js";

@Injectable()
export class OutboxEventHandlers {
  private readonly logger = new Logger(OutboxEventHandlers.name);
  private readonly handlers = new Map<string, OutboxEventHandler>();

  constructor(
    private readonly inspectionService: InspectionService,
    private readonly subscriptionResolver: SubscriptionResolver,
    private readonly notificationService?: NotificationService,
  ) {
    this.registerDefaultHandlers();
  }

  /** Get handler for a specific event type */
  get(type: string): OutboxEventHandler | undefined {
    return this.handlers.get(type);
  }

  /** Register built-in handlers */
  private registerDefaultHandlers(): void {
    this.register("notifiable_disease.detected", this.handleNotifiableDisease);
    this.register("animal.moved", this.handleAnimalMoved);

    // Subscription-resolved event types - matched against event_subscriptions table
    this.register(EVENT_TYPE_IDS.DISEASE_DETECTED, this.handleSubscriptionEvent);
    this.register(EVENT_TYPE_IDS.ANIMAL_REGISTERED, this.handleSubscriptionEvent);
    this.register(EVENT_TYPE_IDS.APPROVAL_REQUESTED, this.handleSubscriptionEvent);
    this.register(EVENT_TYPE_IDS.MOVEMENT_RECORDED, this.handleSubscriptionEvent);
    this.register(EVENT_TYPE_IDS.INSPECTION_SCHEDULED, this.handleSubscriptionEvent);
    this.register(EVENT_TYPE_IDS.FOREIGN_PASSPORT_EXPIRING, this.handleSubscriptionEvent);
  }

  /** Generic handler: delegate to SubscriptionResolver for matching + notification */
  private async handleSubscriptionEvent(event: {
    type: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    await this.subscriptionResolver.resolveAndNotify({
      eventType: event.type,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      data: event.payload,
      outboxEventId: event.aggregateId,
    });
  }

  /** Register a handler for a specific event type */
  private register(type: string, handler: OutboxEventHandler): void {
    this.handlers.set(type, handler);
    this.logger.log(`Registered handler for event type: ${type}`);
  }

  /** Handle notifiable disease detection - flag farm for inspection */
  private async handleNotifiableDisease(event: {
    type: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    this.logger.log(`Handling notifiable disease: ${event.payload.diseaseName} on farm ${event.payload.farmId}`);

    const result = await this.inspectionService.flagFarmForInspection({
      farmId: event.payload.farmId as string,
      riskScore: "HIGH",
      riskCriteria: `notifiable_disease:${event.payload.diseaseId}`,
      notes: `Notifiable disease "${event.payload.diseaseName}" detected in animal ${event.payload.animalId}. Auto-flagged via outbox event.`,
      triggeredBy: event.payload.createdBy as string | undefined,
    });

    if (result.isErr()) {
      this.logger.error(`Failed to flag farm for inspection: ${result.error}`);
      throw result.error;
    }

    this.logger.log(`Farm ${event.payload.farmId} flagged for inspection successfully`);
  }

  /** Handle animal movement - notify destination farm owner */
  private async handleAnimalMoved(event: {
    type: string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    this.logger.log(
      `Handling animal movement: animal ${event.payload.animalId} moved to farm ${event.payload.toFarmId}`,
    );

    // Placeholder for future notification logic:
    // - Notify destination farm owner
    // - Notify origin farm owner
    // - Trigger farm book update if needed
    // - Update inspection risk profile

    this.logger.debug(`Animal movement event details:`, {
      movementId: event.payload.movementId,
      animalId: event.payload.animalId,
      fromFarmId: event.payload.fromFarmId,
      toFarmId: event.payload.toFarmId,
      movementType: event.payload.movementType,
      movementDate: event.payload.movementDate,
    });
  }
}
