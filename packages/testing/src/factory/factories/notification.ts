// ── Notification Test Factory ──
// Internal enums: NOTIFICATION_TYPE, NOTIFICATION_CATEGORY,
//                 NOTIFICATION_PRIORITY, NOTIFICATION_STATUS, EVENT_SOURCE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  EVENT_SOURCE,
  EVENT_SOURCE_VALUES,
  NOTIFICATION_CATEGORY,
  NOTIFICATION_CATEGORY_VALUES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_PRIORITY_VALUES,
  NOTIFICATION_STATUS,
  NOTIFICATION_STATUS_VALUES,
  NOTIFICATION_TYPE,
  NOTIFICATION_TYPE_VALUES,
} from "@rocky/database/constants";
import { notificationsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type NotificationRecord = InferSelectSchema<typeof notificationsSelectSchema>;

export class NotificationFactory extends SchemaDataFactory<NotificationRecord> {
  constructor(userId: string) {
    super(notificationsSelectSchema, {
      id: faker.string.uuid(),
      legacyId: null,
      userId,
      type: faker.helpers.arrayElement(NOTIFICATION_TYPE_VALUES),
      category: faker.helpers.arrayElement(NOTIFICATION_CATEGORY_VALUES),
      priority: faker.helpers.arrayElement(NOTIFICATION_PRIORITY_VALUES),
      status: faker.helpers.arrayElement(NOTIFICATION_STATUS_VALUES),
      subject: faker.lorem.sentence(),
      message: faker.lorem.paragraph(),
      data: null,
      emailAddress: faker.internet.email(),
      phoneNumber: faker.phone.number(),
      pushToken: null,
      webhookUrl: null,
      templateId: null,
      scheduledAt: null,
      sentAt: null,
      deliveredAt: null,
      acknowledgedAt: null,
      expiresAt: null,
      attempts: 0,
      maxAttempts: 3,
      lastError: null,
      lastAttemptAt: null,
      externalId: null,
      source: faker.helpers.arrayElement(EVENT_SOURCE_VALUES),
      tags: null,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createPending(overrides?: Partial<NotificationRecord>): NotificationRecord {
    return this.create({ status: NOTIFICATION_STATUS.PENDING, ...overrides });
  }

  createSent(overrides?: Partial<NotificationRecord>): NotificationRecord {
    return this.create({
      status: NOTIFICATION_STATUS.SENT,
      sentAt: faker.date.recent({ days: 5 }),
      ...overrides,
    });
  }

  createDelivered(overrides?: Partial<NotificationRecord>): NotificationRecord {
    return this.create({
      status: NOTIFICATION_STATUS.DELIVERED,
      sentAt: faker.date.recent({ days: 5 }),
      deliveredAt: faker.date.recent({ days: 2 }),
      attempts: 1,
      ...overrides,
    });
  }

  createFailed(overrides?: Partial<NotificationRecord>): NotificationRecord {
    return this.create({
      status: NOTIFICATION_STATUS.FAILED,
      attempts: 3,
      lastError: faker.lorem.sentence(),
      ...overrides,
    });
  }

  createCancelled(overrides?: Partial<NotificationRecord>): NotificationRecord {
    return this.create({ status: NOTIFICATION_STATUS.CANCELLED, ...overrides });
  }

  createEmail(overrides?: Partial<NotificationRecord>): NotificationRecord {
    return this.create({ type: NOTIFICATION_TYPE.EMAIL, ...overrides });
  }
}
