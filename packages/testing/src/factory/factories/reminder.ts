// ── Reminder Test Factory ──
// Standalone or outbox-linked reminder for a user
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { remindersSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type ReminderRecord = InferSelectSchema<typeof remindersSelectSchema>;

export class ReminderFactory extends SchemaDataFactory<ReminderRecord> {
  constructor(userId: string) {
    super(remindersSelectSchema, {
      id: faker.string.uuid(),
      outboxEventId: null,
      entityType: null,
      entityId: null,
      userId,
      role: null,
      title: faker.lorem.sentence(),
      description: faker.lorem.sentence(),
      dueAt: faker.date.future({ years: 1 }),
      durationMinutes: 60,
      recurrence: "none",
      recurrenceUntil: null,
      status: "pending",
      completedAt: null,
      priority: "normal",
      metadata: null,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: faker.date.recent({ days: 30 }),
    });
  }

  createPending(overrides?: Partial<ReminderRecord>): ReminderRecord {
    return this.create({ status: "pending", ...overrides });
  }

  createCompleted(overrides?: Partial<ReminderRecord>): ReminderRecord {
    return this.create({
      status: "completed",
      completedAt: faker.date.recent({ days: 2 }),
      ...overrides,
    });
  }

  createOverdue(overrides?: Partial<ReminderRecord>): ReminderRecord {
    return this.create({
      status: "pending",
      dueAt: faker.date.recent({ days: 5 }),
      ...overrides,
    });
  }

  createRecurring(overrides?: Partial<ReminderRecord>): ReminderRecord {
    return this.create({
      recurrence: "daily",
      recurrenceUntil: faker.date.future({ years: 1 }),
      ...overrides,
    });
  }
}
