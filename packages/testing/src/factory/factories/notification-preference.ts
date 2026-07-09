// ── Notification Preference Test Factory ──
// Internal enums: NOTIFICATION_CATEGORY
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_CATEGORY_VALUES,
} from "@rocky/database/constants";
import { notificationPreferencesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type NotificationPreferenceRecord =
  InferSelectSchema<typeof notificationPreferencesSelectSchema>;

export class NotificationPreferenceFactory extends SchemaDataFactory<NotificationPreferenceRecord> {
  constructor(userId: string) {
    super(notificationPreferencesSelectSchema, {
      id: faker.string.uuid(),
      userId,
      category: faker.helpers.arrayElement(NOTIFICATION_CATEGORY_VALUES),
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      inAppEnabled: true,
      quietHoursStart: null,
      quietHoursEnd: null,
      timezone: "Europe/Skopje",
      digestMode: false,
      digestFrequency: null,
      filters: null,
      createdAt: faker.date.recent({ days: 30 }),
      updatedAt: null,
      validTo: null,
    });
  }

  createEmailOnly(overrides?: Partial<NotificationPreferenceRecord>): NotificationPreferenceRecord {
    return this.create({
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: false,
      inAppEnabled: false,
      ...overrides,
    });
  }

  createAllChannels(overrides?: Partial<NotificationPreferenceRecord>): NotificationPreferenceRecord {
    return this.create({
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      inAppEnabled: true,
      ...overrides,
    });
  }

  createDigest(overrides?: Partial<NotificationPreferenceRecord>): NotificationPreferenceRecord {
    return this.create({
      digestMode: true,
      digestFrequency: faker.helpers.arrayElement(["daily", "weekly"]),
      ...overrides,
    });
  }
}
