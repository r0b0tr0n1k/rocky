/**
 * AnimalMovedEvent
 *
 * @description Published to the outbox when an animal is moved between farms.
 * Consumed by downstream systems: notifications, inspection flagging, audit.
 *
 * Event type: "animal.moved"
 * Aggregate: movement
 */

export interface AnimalMovedEventPayload {
  /** The movement record ID */
  movementId: string;
  /** The animal that was moved */
  animalId: string;
  /** Origin farm ID (null for birth registration) */
  fromFarmId?: string;
  /** Destination farm ID */
  toFarmId: string;
  /** Movement type: sale, purchase, transfer, etc. */
  movementType: string;
  /** Date the movement occurred */
  movementDate: string;
  /** User who recorded the movement */
  triggeredBy: string;
}

export const ANIMAL_MOVED_EVENT_TYPE = "animal.moved";
