// ── Ear Tag Replacement (EarTag Bot) Test Factory ──
// Internal enums: EAR_TAG_REPLACEMENT_REASON, EAR_TAG_REPLACEMENT_STATUS
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  EAR_TAG_REPLACEMENT_REASON,
  EAR_TAG_REPLACEMENT_REASON_VALUES,
  EAR_TAG_REPLACEMENT_STATUS,
} from "@rocky/database/constants";
import { earTagReplacementsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type EarTagReplacementRecord = InferSelectSchema<typeof earTagReplacementsSelectSchema>;

export class EarTagReplacementFactory extends SchemaDataFactory<EarTagReplacementRecord> {
  constructor(animalId: string, farmId: string) {
    super(earTagReplacementsSelectSchema, {
      id: faker.string.uuid(),
      legacyId: null,
      replacementNumber: `REP_${faker.string.alphanumeric({ length: 10 }).toUpperCase()}`,
      animalId,
      oldTagNumber: faker.string.numeric(8),
      newTagNumber: faker.string.numeric(8),
      farmId,
      reason: faker.helpers.arrayElement(EAR_TAG_REPLACEMENT_REASON_VALUES),
      reasonDetails: null,
      status: EAR_TAG_REPLACEMENT_STATUS.PENDING,
      reportedDate: faker.date.past({ years: 1 }).toISOString().split("T")[0],
      replacementDate: null,
      reportedBy: null,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      newTagAllocationId: null,
      photoOldTagUrl: null,
      photoNewTagUrl: null,
      photoAnimalUrl: null,
      notes: null,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createPending(overrides?: Partial<EarTagReplacementRecord>): EarTagReplacementRecord {
    return this.create({ status: EAR_TAG_REPLACEMENT_STATUS.PENDING, ...overrides });
  }

  createApproved(overrides?: Partial<EarTagReplacementRecord>): EarTagReplacementRecord {
    return this.create({
      status: EAR_TAG_REPLACEMENT_STATUS.APPROVED,
      approvedBy: faker.string.uuid(),
      approvedAt: faker.date.recent({ days: 10 }),
      replacementDate: faker.date.recent({ days: 5 }).toISOString().split("T")[0],
      ...overrides,
    });
  }

  createRejected(overrides?: Partial<EarTagReplacementRecord>): EarTagReplacementRecord {
    return this.create({
      status: EAR_TAG_REPLACEMENT_STATUS.REJECTED,
      rejectionReason: faker.lorem.sentence(),
      ...overrides,
    });
  }
}
