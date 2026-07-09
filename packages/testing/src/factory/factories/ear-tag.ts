// ── Ear Tag (individual tag inventory, EarTag Bot) Test Factory ──
// Internal enums: EAR_TAG_STATUS, STATE_CODE
//
// NOTE: This is the `ear_tags` table (individual tags). The ear-tag *orders*
// table has its own EarTagOrderFactory.
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { EAR_TAG_STATUS, STATE_CODE } from "@rocky/database/constants";
import { earTagsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type EarTagRecord = InferSelectSchema<typeof earTagsSelectSchema>;

export class EarTagFactory extends SchemaDataFactory<EarTagRecord> {
  constructor(typeId: string) {
    super(earTagsSelectSchema, {
      id: faker.string.uuid(),
      legacyId: null,
      stateCode: STATE_CODE.MK,
      tagNumber: faker.string.numeric(8),
      typeId,
      status: EAR_TAG_STATUS.AVAILABLE,
      orderId: null,
      allocationId: null,
      animalId: null,
      appliedDate: null,
      isDefective: false,
      defectReason: null,
      qualityChecked: false,
      qualityCheckedBy: null,
      qualityCheckedAt: null,
      batchNumber: null,
      manufactureDate: null,
      expiryDate: null,
      notes: null,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createAvailable(overrides?: Partial<EarTagRecord>): EarTagRecord {
    return this.create({ status: EAR_TAG_STATUS.AVAILABLE, ...overrides });
  }

  createApplied(overrides?: Partial<EarTagRecord>): EarTagRecord {
    return this.create({
      status: EAR_TAG_STATUS.APPLIED,
      animalId: faker.string.uuid(),
      appliedDate: faker.date.recent({ days: 30 }).toISOString().split("T")[0],
      ...overrides,
    });
  }

  createDefective(overrides?: Partial<EarTagRecord>): EarTagRecord {
    return this.create({
      isDefective: true,
      defectReason: faker.lorem.sentence(),
      ...overrides,
    });
  }

  createQualityChecked(overrides?: Partial<EarTagRecord>): EarTagRecord {
    return this.create({
      qualityChecked: true,
      qualityCheckedBy: faker.string.uuid(),
      qualityCheckedAt: faker.date.recent({ days: 10 }),
      ...overrides,
    });
  }
}
