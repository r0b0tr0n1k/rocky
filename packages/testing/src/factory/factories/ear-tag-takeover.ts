// ── Ear Tag Takeover (EarTag Bot) Test Factory ──
// Internal enums: TAKEOVER_STATUS
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { TAKEOVER_STATUS } from "@rocky/database/constants";
import { earTagTakeoversSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type EarTagTakeoverRecord = InferSelectSchema<typeof earTagTakeoversSelectSchema>;

export class EarTagTakeoverFactory extends SchemaDataFactory<EarTagTakeoverRecord> {
  constructor(orderId: string, supplierOrganizationId: string) {
    super(earTagTakeoversSelectSchema, {
      id: faker.string.uuid(),
      orderId,
      supplierOrganizationId,
      status: TAKEOVER_STATUS.COMPLETED,
      totalTagsCollected: faker.number.int({ min: 100, max: 10000 }),
      exportedFileName: `takeover_${faker.string.alphanumeric({ length: 8 })}.txt`,
      fileContent: null,
      notes: null,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createCompleted(overrides?: Partial<EarTagTakeoverRecord>): EarTagTakeoverRecord {
    return this.create({ status: TAKEOVER_STATUS.COMPLETED, ...overrides });
  }

  createCancelled(overrides?: Partial<EarTagTakeoverRecord>): EarTagTakeoverRecord {
    return this.create({ status: TAKEOVER_STATUS.CANCELLED, ...overrides });
  }
}
