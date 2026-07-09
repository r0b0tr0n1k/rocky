// ── Cattle Passport Test Factory ──
// Internal enums: PASSPORT_STATUS, STATE_CODE, DEATH_CAUSE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  DEATH_CAUSE,
  DEATH_CAUSE_VALUES,
  PASSPORT_STATUS,
  PASSPORT_STATUS_VALUES,
  STATE_CODE,
  STATE_CODE_VALUES,
} from "@rocky/database/constants";
import { cattlePassportsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type CattlePassportRecord = InferSelectSchema<typeof cattlePassportsSelectSchema>;

export class CattlePassportFactory extends SchemaDataFactory<CattlePassportRecord> {
  constructor(animalId: string, farmId: string) {
    super(cattlePassportsSelectSchema, {
      id: faker.string.uuid(),
      passportNumber: faker.string.alphanumeric({ length: 12 }).toUpperCase(),
      stateCode: faker.helpers.arrayElement(STATE_CODE_VALUES),
      animalId,
      farmId,
      status: faker.helpers.arrayElement(PASSPORT_STATUS_VALUES),
      issueDate: faker.date.recent({ days: 30 }).toISOString().split("T")[0]!,
      seizeDate: null,
      archiveDate: null,
      deathDate: null,
      deathCause: null,
      countryOfOrigin: null,
      foreignPassportNumber: null,
      shippedToVs: false,
      shippedAt: null,
      deliveredToKeeper: false,
      deliveredAt: null,
      isReprint: false,
      originalPassportId: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createIssued(overrides?: Partial<CattlePassportRecord>): CattlePassportRecord {
    return this.create({
      status: PASSPORT_STATUS.ISSUED,
      ...overrides,
    });
  }

  createSeized(overrides?: Partial<CattlePassportRecord>): CattlePassportRecord {
    return this.create({
      status: PASSPORT_STATUS.SEIZED,
      seizeDate: faker.date.recent({ days: 7 }).toISOString().split("T")[0]!,
      deathDate: faker.date.recent({ days: 7 }).toISOString().split("T")[0]!,
      deathCause: faker.helpers.arrayElement(DEATH_CAUSE_VALUES),
      ...overrides,
    });
  }

  createReprinted(overrides?: Partial<CattlePassportRecord>): CattlePassportRecord {
    return this.create({
      status: PASSPORT_STATUS.REPRINTED,
      isReprint: true,
      originalPassportId: faker.string.uuid(),
      ...overrides,
    });
  }

  createCancelled(overrides?: Partial<CattlePassportRecord>): CattlePassportRecord {
    return this.create({
      status: PASSPORT_STATUS.CANCELLED,
      ...overrides,
    });
  }

  createShipped(overrides?: Partial<CattlePassportRecord>): CattlePassportRecord {
    return this.create({
      shippedToVs: true,
      shippedAt: faker.date.recent({ days: 3 }),
      ...overrides,
    });
  }

  createDelivered(overrides?: Partial<CattlePassportRecord>): CattlePassportRecord {
    return this.create({
      deliveredToKeeper: true,
      deliveredAt: faker.date.recent({ days: 1 }),
      ...overrides,
    });
  }
}
