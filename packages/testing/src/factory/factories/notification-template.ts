// ── Notification Template Test Factory ──
// Internal enums: NOTIFICATION_CATEGORY, NOTIFICATION_TYPE, NOTIFICATION_PRIORITY
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_CATEGORY_VALUES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_PRIORITY_VALUES,
  NOTIFICATION_TYPE,
  NOTIFICATION_TYPE_VALUES,
} from "@rocky/database/constants";
import { notificationTemplatesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type NotificationTemplateRecord =
  InferSelectSchema<typeof notificationTemplatesSelectSchema>;

export class NotificationTemplateFactory extends SchemaDataFactory<NotificationTemplateRecord> {
  constructor() {
    super(notificationTemplatesSelectSchema, {
      id: faker.string.uuid(),
      legacyId: null,
      code: `TPL_${faker.string.alphanumeric({ length: 8 }).toUpperCase()}`,
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(),
      category: faker.helpers.arrayElement(NOTIFICATION_CATEGORY_VALUES),
      type: faker.helpers.arrayElement(NOTIFICATION_TYPE_VALUES),
      subjectTemplate: {
        MK: faker.lorem.sentence(),
        EN: faker.lorem.sentence(),
      },
      bodyTemplate: {
        MK: faker.lorem.paragraph(),
        EN: faker.lorem.paragraph(),
      },
      variables: null,
      priority: faker.helpers.arrayElement(NOTIFICATION_PRIORITY_VALUES),
      scheduled: false,
      expiresInHours: null,
      tags: null,
      isActive: true,
      version: 1,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createEmail(overrides?: Partial<NotificationTemplateRecord>): NotificationTemplateRecord {
    return this.create({ type: NOTIFICATION_TYPE.EMAIL, ...overrides });
  }

  createSms(overrides?: Partial<NotificationTemplateRecord>): NotificationTemplateRecord {
    return this.create({ type: NOTIFICATION_TYPE.SMS, ...overrides });
  }

  createPush(overrides?: Partial<NotificationTemplateRecord>): NotificationTemplateRecord {
    return this.create({ type: NOTIFICATION_TYPE.PUSH, ...overrides });
  }

  createInApp(overrides?: Partial<NotificationTemplateRecord>): NotificationTemplateRecord {
    return this.create({ type: NOTIFICATION_TYPE.IN_APP, ...overrides });
  }

  createInactive(overrides?: Partial<NotificationTemplateRecord>): NotificationTemplateRecord {
    return this.create({ isActive: false, ...overrides });
  }
}
