// ── Event Subscription Test Factory ──
// Subscribes a target (user/org/farm/role) to an outbox event type
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { eventSubscriptionsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type EventSubscriptionRecord =
  InferSelectSchema<typeof eventSubscriptionsSelectSchema>;

const EVENT_TYPES = [
  "animal.registered",
  "farm.verified",
  "inspection.due",
  "movement.submitted",
  "ear_tag_order.shipped",
  "correction.escalated",
] as const;

export class EventSubscriptionFactory extends SchemaDataFactory<EventSubscriptionRecord> {
  constructor() {
    super(eventSubscriptionsSelectSchema, {
      id: faker.string.uuid(),
      eventType: faker.helpers.arrayElement(EVENT_TYPES),
      targetType: "user",
      targetId: faker.string.uuid(),
      conditions: [],
      channels: { inApp: true, email: false, push: false },
      delayMinutes: 0,
      reminderEnabled: false,
      reminderOffsetDays: 0,
      reminderDurationHours: 1,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
    });
  }

  createActive(overrides?: Partial<EventSubscriptionRecord>): EventSubscriptionRecord {
    return this.create({ isActive: true, ...overrides });
  }

  createInactive(overrides?: Partial<EventSubscriptionRecord>): EventSubscriptionRecord {
    return this.create({ isActive: false, ...overrides });
  }

  createReminderEnabled(
    overrides?: Partial<EventSubscriptionRecord>,
  ): EventSubscriptionRecord {
    return this.create({
      reminderEnabled: true,
      reminderOffsetDays: 7,
      reminderDurationHours: 24,
      ...overrides,
    });
  }
}
