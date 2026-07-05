// ── Farm (Holding Register) Test Factory ──
// Internal enums: FARM_TYPE, VERIFICATION_STATUS, DATA_SOURCE

import { faker } from "@faker-js/faker";
import {
  DATA_SOURCE,
  DATA_SOURCE_VALUES,
  FARM_TYPE,
  FARM_TYPE_VALUES,
  VERIFICATION_STATUS,
  VERIFICATION_STATUS_VALUES,
} from "@rocky/database/constants";
import { farmSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type FarmRecord = InferSelectSchema<typeof farmSelectSchema>;

export class FarmFactory extends SchemaDataFactory<FarmRecord> {
  constructor(addressId: string, createdBy?: string) {
    super(farmSelectSchema, {
      addressId,
      farmId: faker.string.numeric({ length: 9 }),
      name: faker.company.name(),
      type: faker.helpers.arrayElement(FARM_TYPE_VALUES),
      verificationStatus: faker.helpers.arrayElement(VERIFICATION_STATUS_VALUES),
      dataSource: faker.helpers.arrayElement(DATA_SOURCE_VALUES),
      isActive: faker.datatype.boolean({ probability: 0.9 }),
      createdAt: faker.date.recent({ days: 365 }),
      createdBy: createdBy ?? null,
    });
  }

  createActive(overrides?: Partial<FarmRecord>): FarmRecord {
    return this.create({
      isActive: true,
      type: FARM_TYPE.FARM,
      dataSource: DATA_SOURCE.MOBILE,
      ...overrides,
    });
  }

  createApproved(overrides?: Partial<FarmRecord>): FarmRecord {
    return this.create({
      isActive: true,
      verificationStatus: VERIFICATION_STATUS.APPROVED,
      verifiedAt: faker.date.recent({ days: 30 }),
      verifiedBy: faker.string.uuid(),
      ...overrides,
    });
  }

  createPendingVerification(overrides?: Partial<FarmRecord>): FarmRecord {
    return this.create({
      isActive: true,
      verificationStatus: VERIFICATION_STATUS.PENDING_VD_APPROVAL,
      verifiedAt: null,
      verifiedBy: null,
      ...overrides,
    });
  }

  createInactive(overrides?: Partial<FarmRecord>): FarmRecord {
    return this.create({ isActive: false, ...overrides });
  }

  createLegacyImport(overrides?: Partial<FarmRecord>): FarmRecord {
    return this.create({
      legacyId: faker.number.int({ min: 1, max: 99999 }),
      dataSource: DATA_SOURCE.HK_IMP,
      ...overrides,
    });
  }
}
