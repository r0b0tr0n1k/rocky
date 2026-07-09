// ── Address (Farm Bot) Test Factory ──
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { addressesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type AddressRecord = InferSelectSchema<typeof addressesSelectSchema>;

export class AddressFactory extends SchemaDataFactory<AddressRecord> {
  constructor(zipCodeId: string) {
    super(addressesSelectSchema, {
      id: faker.string.uuid(),
      legacyId: null,
      city: faker.location.city(),
      street: faker.location.street(),
      houseNumber: faker.string.numeric({ length: 5 }),
      houseNumberAdd: null,
      zipCodeId,
      communeId: null,
      adminUnitId: null,
      location: null,
      geocodedAddress: null,
      geocodedAt: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      validTo: null,
    });
  }

  createActive(overrides?: Partial<AddressRecord>): AddressRecord {
    return this.create({ isActive: true, ...overrides });
  }

  createInactive(overrides?: Partial<AddressRecord>): AddressRecord {
    return this.create({ isActive: false, ...overrides });
  }
}
