// ── User Session (User Bot) Test Factory ──
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { userSessionsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type UserSessionRecord = InferSelectSchema<typeof userSessionsSelectSchema>;

export class UserSessionFactory extends SchemaDataFactory<UserSessionRecord> {
  constructor(userId: string) {
    super(userSessionsSelectSchema, {
      id: faker.string.uuid(),
      userId,
      accessToken: faker.string.alphanumeric({ length: 200 }),
      refreshToken: faker.string.alphanumeric({ length: 200 }),
      deviceInfo: null,
      ipAddress: faker.internet.ip(),
      isActive: true,
      expiresAt: faker.date.future({ years: 1 }),
      lastActivityAt: faker.date.recent({ days: 1 }),
      createdAt: faker.date.recent({ days: 1 }),
    });
  }

  createActive(overrides?: Partial<UserSessionRecord>): UserSessionRecord {
    return this.create({ isActive: true, ...overrides });
  }

  createExpired(overrides?: Partial<UserSessionRecord>): UserSessionRecord {
    return this.create({
      isActive: false,
      expiresAt: faker.date.recent({ days: 30 }),
      ...overrides,
    });
  }
}
