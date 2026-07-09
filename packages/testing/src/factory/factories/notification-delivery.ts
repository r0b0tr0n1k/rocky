// ── Notification Delivery Test Factory ──
// Links an outbox event → subscription → user (dedup via deliveryKey)
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { notificationDeliveriesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type NotificationDeliveryRecord =
  InferSelectSchema<typeof notificationDeliveriesSelectSchema>;

export class NotificationDeliveryFactory extends SchemaDataFactory<NotificationDeliveryRecord> {
  constructor(outboxEventId: string, subscriptionId: string, userId: string) {
    super(notificationDeliveriesSelectSchema, {
      id: faker.string.uuid(),
      outboxEventId,
      subscriptionId,
      userId,
      notificationId: null,
      deliveryKey: faker.string.alphanumeric({ length: 64 }),
      status: "pending",
      errorMessage: null,
      createdAt: faker.date.recent({ days: 30 }),
      deliveredAt: null,
    });
  }

  createPending(overrides?: Partial<NotificationDeliveryRecord>): NotificationDeliveryRecord {
    return this.create({ status: "pending", ...overrides });
  }

  createDelivered(overrides?: Partial<NotificationDeliveryRecord>): NotificationDeliveryRecord {
    return this.create({
      status: "delivered",
      deliveredAt: faker.date.recent({ days: 2 }),
      ...overrides,
    });
  }

  createFailed(overrides?: Partial<NotificationDeliveryRecord>): NotificationDeliveryRecord {
    return this.create({
      status: "failed",
      errorMessage: faker.lorem.sentence(),
      ...overrides,
    });
  }
}
