// ── Form Reprint (Passport Bot) Test Factory ──
// Internal enums: REPRINT_REASON, REPRINT_STATUS
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  REPRINT_REASON,
  REPRINT_REASON_VALUES,
  REPRINT_STATUS,
} from "@rocky/database/constants";
import { formReprintsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type FormReprintRecord = InferSelectSchema<typeof formReprintsSelectSchema>;

export class FormReprintFactory extends SchemaDataFactory<FormReprintRecord> {
  constructor(farmId: string) {
    super(formReprintsSelectSchema, {
      id: faker.string.uuid(),
      farmId,
      documentType: faker.helpers.arrayElement([
        "cattle_passport",
        "movement_document",
        "farm_book",
        "birth_certificate",
      ]),
      originalDocumentRef: null,
      reason: faker.helpers.arrayElement(REPRINT_REASON_VALUES),
      notes: null,
      status: REPRINT_STATUS.REQUESTED,
      requestedAt: faker.date.recent({ days: 30 }),
      processedAt: null,
      shippedAt: null,
      deliveredAt: null,
      shippedToVs: false,
      deliveredToKeeper: false,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createRequested(overrides?: Partial<FormReprintRecord>): FormReprintRecord {
    return this.create({ status: REPRINT_STATUS.REQUESTED, ...overrides });
  }

  createShipped(overrides?: Partial<FormReprintRecord>): FormReprintRecord {
    return this.create({
      status: REPRINT_STATUS.SHIPPED,
      shippedAt: faker.date.recent({ days: 5 }),
      shippedToVs: true,
      ...overrides,
    });
  }

  createDelivered(overrides?: Partial<FormReprintRecord>): FormReprintRecord {
    return this.create({
      status: REPRINT_STATUS.DELIVERED,
      deliveredAt: faker.date.recent({ days: 2 }),
      deliveredToKeeper: true,
      ...overrides,
    });
  }
}
