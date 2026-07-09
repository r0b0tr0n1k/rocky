// ── Ear Tag Allocation (EarTag Bot) Test Factory ──
// Internal enums: ALLOCATION_STATUS, DISTRIBUTION_METHOD, CONTINGENT_TYPE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  ALLOCATION_STATUS,
  ALLOCATION_STATUS_VALUES,
  CONTINGENT_TYPE,
  DISTRIBUTION_METHOD,
} from "@rocky/database/constants";
import { earTagAllocationsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type EarTagAllocationRecord = InferSelectSchema<typeof earTagAllocationsSelectSchema>;

export class EarTagAllocationFactory extends SchemaDataFactory<EarTagAllocationRecord> {
  constructor(farmId: string, typeId: string) {
    super(earTagAllocationsSelectSchema, {
      id: faker.string.uuid(),
      legacyId: null,
      contingentType: null,
      farmId,
      supplierOrganizationId: null,
      allocationNumber: `ALOC_${faker.string.alphanumeric({ length: 10 }).toUpperCase()}`,
      allocationDate: faker.date.past({ years: 1 }).toISOString().split("T")[0],
      typeId,
      quantity: faker.number.int({ min: 10, max: 500 }),
      tagRangeStart: null,
      tagRangeEnd: null,
      tagIds: null,
      distributionMethod: DISTRIBUTION_METHOD.VD_DELIVERY,
      deliveryDate: null,
      receivedBy: null,
      receivedDate: null,
      signatureData: null,
      photoUrl: null,
      gpsLocation: null,
      status: faker.helpers.arrayElement(ALLOCATION_STATUS_VALUES),
      notes: null,
      requestedBy: null,
      approvedBy: null,
      approvedAt: null,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createPending(overrides?: Partial<EarTagAllocationRecord>): EarTagAllocationRecord {
    return this.create({ status: ALLOCATION_STATUS.PENDING, ...overrides });
  }

  createFulfilled(overrides?: Partial<EarTagAllocationRecord>): EarTagAllocationRecord {
    return this.create({
      status: ALLOCATION_STATUS.FULFILLED,
      deliveryDate: faker.date.recent({ days: 10 }).toISOString().split("T")[0],
      receivedBy: faker.string.uuid(),
      receivedDate: faker.date.recent({ days: 10 }),
      ...overrides,
    });
  }

  createCancelled(overrides?: Partial<EarTagAllocationRecord>): EarTagAllocationRecord {
    return this.create({ status: ALLOCATION_STATUS.CANCELLED, ...overrides });
  }
}
