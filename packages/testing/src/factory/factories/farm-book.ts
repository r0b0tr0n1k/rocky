// ── Farm Book (Farm Bot) Test Factory ──
// Internal enums: FARM_BOOK_STATUS
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { FARM_BOOK_STATUS, FARM_BOOK_STATUS_VALUES } from "@rocky/database/constants";
import { farmBooksSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type FarmBookRecord = InferSelectSchema<typeof farmBooksSelectSchema>;

export class FarmBookFactory extends SchemaDataFactory<FarmBookRecord> {
  constructor(farmId: string) {
    super(farmBooksSelectSchema, {
      id: faker.string.uuid(),
      farmId,
      status: faker.helpers.arrayElement(FARM_BOOK_STATUS_VALUES),
      assembledAt: null,
      printedAt: null,
      shippedAt: null,
      deliveredAt: null,
      assembledBy: null,
      printedBy: null,
      shippedToVs: false,
      deliveredToKeeper: false,
      vsId: null,
      reprintOf: null,
      notes: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createPending(overrides?: Partial<FarmBookRecord>): FarmBookRecord {
    return this.create({ status: FARM_BOOK_STATUS.PENDING, ...overrides });
  }

  createAssembled(overrides?: Partial<FarmBookRecord>): FarmBookRecord {
    return this.create({
      status: FARM_BOOK_STATUS.ASSEMBLED,
      assembledAt: faker.date.recent({ days: 10 }),
      ...overrides,
    });
  }

  createShipped(overrides?: Partial<FarmBookRecord>): FarmBookRecord {
    return this.create({
      status: FARM_BOOK_STATUS.SHIPPED_TO_VS,
      shippedAt: faker.date.recent({ days: 5 }),
      shippedToVs: true,
      ...overrides,
    });
  }

  createDelivered(overrides?: Partial<FarmBookRecord>): FarmBookRecord {
    return this.create({
      status: FARM_BOOK_STATUS.DELIVERED,
      deliveredAt: faker.date.recent({ days: 2 }),
      deliveredToKeeper: true,
      ...overrides,
    });
  }
}
