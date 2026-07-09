// ── Birth Notification (Animal Bot) Test Factory ──
// Internal enums: BIRTH_NOTIFICATION_STATUS, DATA_SOURCE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  BIRTH_NOTIFICATION_STATUS,
  DATA_SOURCE,
  DATA_SOURCE_VALUES,
} from "@rocky/database/constants";
import { birthNotificationsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type BirthNotificationRecord = InferSelectSchema<typeof birthNotificationsSelectSchema>;

export class BirthNotificationFactory extends SchemaDataFactory<BirthNotificationRecord> {
  constructor(farmId: string) {
    super(birthNotificationsSelectSchema, {
      id: faker.string.uuid(),
      farmId,
      notificationDate: faker.date.past({ years: 1 }).toISOString().split("T")[0],
      expectedBirthDate: null,
      actualBirthDate: null,
      numberOfCalves: 1,
      motherAnimalId: null,
      notes: null,
      source: faker.helpers.arrayElement(DATA_SOURCE_VALUES),
      status: BIRTH_NOTIFICATION_STATUS.PENDING,
      assignedTo: null,
      assignedAt: null,
      taggingDeadline: faker.date.future({ years: 1 }).toISOString().split("T")[0],
      taggedAt: null,
      taggingExceeded: false,
      animalIds: null,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createPending(overrides?: Partial<BirthNotificationRecord>): BirthNotificationRecord {
    return this.create({ status: BIRTH_NOTIFICATION_STATUS.PENDING, ...overrides });
  }

  createSent(overrides?: Partial<BirthNotificationRecord>): BirthNotificationRecord {
    return this.create({ status: BIRTH_NOTIFICATION_STATUS.SENT, ...overrides });
  }

  createFailed(overrides?: Partial<BirthNotificationRecord>): BirthNotificationRecord {
    return this.create({ status: BIRTH_NOTIFICATION_STATUS.FAILED, ...overrides });
  }

  createTagged(overrides?: Partial<BirthNotificationRecord>): BirthNotificationRecord {
    return this.create({
      taggedAt: faker.date.recent({ days: 5 }).toISOString().split("T")[0],
      animalIds: [faker.string.uuid()],
      ...overrides,
    });
  }
}
