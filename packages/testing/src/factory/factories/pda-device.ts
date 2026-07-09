// ── PDA Device (Smartphone) Test Factory ──
// Internal enums: DEVICE_STATUS
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { DEVICE_STATUS, DEVICE_STATUS_VALUES } from "@rocky/database/constants";
import { pdaDevicesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type PdaDeviceRecord = InferSelectSchema<typeof pdaDevicesSelectSchema>;

export class PdaDeviceFactory extends SchemaDataFactory<PdaDeviceRecord> {
  constructor(currentUserId?: string) {
    super(pdaDevicesSelectSchema, {
      id: faker.string.uuid(),
      deviceIdentifier: faker.string.uuid(), // expo-device identifier
      name: faker.lorem.words(2),
      deviceType: faker.helpers.arrayElement(["ios", "android", "web"]),
      osVersion: faker.system.semver(),
      appVersion: faker.system.semver(),
      currentUserId: currentUserId ?? null,
      pushToken: faker.string.alphanumeric({ length: 100 }),
      lastSyncAt: faker.date.recent({ days: 1 }),
      lastSyncData: {
        animals: faker.datatype.boolean(),
        movements: faker.datatype.boolean(),
        health: faker.datatype.boolean(),
        eartags: faker.datatype.boolean(),
        farms: faker.datatype.boolean(),
        inspections: faker.datatype.boolean(),
      },
      status: faker.helpers.arrayElement(DEVICE_STATUS_VALUES),
      failedAttempts: faker.number.int({ min: 0, max: 3 }),
      blockedAt: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createActive(overrides?: Partial<PdaDeviceRecord>): PdaDeviceRecord {
    return this.create({
      status: DEVICE_STATUS.ACTIVE,
      failedAttempts: 0,
      blockedAt: null,
      ...overrides,
    });
  }

  createBlocked(overrides?: Partial<PdaDeviceRecord>): PdaDeviceRecord {
    return this.create({
      status: DEVICE_STATUS.BLOCKED,
      failedAttempts: 3,
      blockedAt: faker.date.recent({ days: 1 }),
      ...overrides,
    });
  }

  createRetired(overrides?: Partial<PdaDeviceRecord>): PdaDeviceRecord {
    return this.create({
      status: DEVICE_STATUS.RETIRED,
      ...overrides,
    });
  }

  createWithUser(userId: string, overrides?: Partial<PdaDeviceRecord>): PdaDeviceRecord {
    return this.create({
      currentUserId: userId,
      ...overrides,
    });
  }

  createWithSync(overrides?: Partial<PdaDeviceRecord>): PdaDeviceRecord {
    return this.create({
      lastSyncAt: faker.date.recent({ days: 1 }),
      lastSyncData: {
        animals: true,
        movements: true,
        health: true,
        eartags: true,
        farms: true,
        inspections: true,
      },
      ...overrides,
    });
  }
}
