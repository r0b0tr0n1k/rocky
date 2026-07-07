// ── Ear Tag Order Test Factory ──
// Internal enums: EAR_TAG_ORDER_STATUS (we control the values)
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { EAR_TAG_ORDER_STATUS, EAR_TAG_ORDER_STATUS_VALUES } from "@rocky/database/constants";
import { earTagOrderSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type EarTagOrderRecord = InferSelectSchema<typeof earTagOrderSelectSchema>;

export class EarTagOrderFactory extends SchemaDataFactory<EarTagOrderRecord> {
  constructor(organizationId: string, requestedBy?: string) {
    super(earTagOrderSelectSchema, {
      id: faker.string.uuid(),
      organizationId,
      orderNumber: faker.string.alphanumeric({ length: 12 }).toUpperCase(),
      orderDate: faker.date.recent({ days: 30 }).toISOString().split("T")[0],
      supplierName: faker.company.name(),
      supplierCode: faker.string.alphanumeric({ length: 6 }).toUpperCase(),
      supplierContact: faker.phone.number(),
      supplierAddress: faker.location.streetAddress(),
      items: JSON.stringify({
        male: faker.number.int({ min: 10, max: 100 }),
        female: faker.number.int({ min: 10, max: 100 }),
        unisex: faker.number.int({ min: 0, max: 50 }),
      }),
      totalQuantity: faker.number.int({ min: 20, max: 250 }),
      totalAmount: faker.commerce.price({ min: 100, max: 5000 }),
      status: faker.helpers.arrayElement(EAR_TAG_ORDER_STATUS_VALUES),
      requestedBy: requestedBy ?? null,
      notes: faker.lorem.sentence(),
      createdAt: faker.date.recent({ days: 30 }),
      legacyId: null,
      supplierOrganizationId: null,
      expectedDeliveryDate: null,
      actualDeliveryDate: null,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      internalNotes: null,
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createDraft(overrides?: Partial<EarTagOrderRecord>): EarTagOrderRecord {
    return this.create({
      status: EAR_TAG_ORDER_STATUS.DRAFT,
      approvedBy: null,
      approvedAt: null,
      ...overrides,
    });
  }

  createPending(overrides?: Partial<EarTagOrderRecord>): EarTagOrderRecord {
    return this.create({ status: EAR_TAG_ORDER_STATUS.PENDING, ...overrides });
  }

  createOrdered(overrides?: Partial<EarTagOrderRecord>): EarTagOrderRecord {
    return this.create({ status: EAR_TAG_ORDER_STATUS.ORDERED, ...overrides });
  }

  createRejected(overrides?: Partial<EarTagOrderRecord>): EarTagOrderRecord {
    return this.create({
      status: EAR_TAG_ORDER_STATUS.REJECTED,
      rejectionReason: faker.lorem.sentence(),
      ...overrides,
    });
  }

  createReceived(overrides?: Partial<EarTagOrderRecord>): EarTagOrderRecord {
    return this.create({
      status: EAR_TAG_ORDER_STATUS.RECEIVED,
      actualDeliveryDate: faker.date.recent({ days: 7 }).toISOString().split("T")[0],
      ...overrides,
    });
  }

  createPartiallyReceived(overrides?: Partial<EarTagOrderRecord>): EarTagOrderRecord {
    return this.create({
      status: EAR_TAG_ORDER_STATUS.PARTIALLY_RECEIVED,
      actualDeliveryDate: faker.date.recent({ days: 7 }).toISOString().split("T")[0],
      ...overrides,
    });
  }

  createCancelled(overrides?: Partial<EarTagOrderRecord>): EarTagOrderRecord {
    return this.create({ status: EAR_TAG_ORDER_STATUS.CANCELLED, ...overrides });
  }
}
