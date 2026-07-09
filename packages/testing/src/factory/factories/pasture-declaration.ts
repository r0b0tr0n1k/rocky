// ── Pasture Declaration (Movement Bot) Test Factory ──
// Internal enums: PASTURE_TYPE, CONFLICT_RESOLUTION_STATUS
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  CONFLICT_RESOLUTION_STATUS,
  PASTURE_TYPE,
  PASTURE_TYPE_VALUES,
} from "@rocky/database/constants";
import { pastureDeclarationsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type PastureDeclarationRecord = InferSelectSchema<typeof pastureDeclarationsSelectSchema>;

export class PastureDeclarationFactory extends SchemaDataFactory<PastureDeclarationRecord> {
  constructor(fromFarmId: string, toFarmId: string) {
    super(pastureDeclarationsSelectSchema, {
      id: faker.string.uuid(),
      fromFarmId,
      toFarmId,
      departureDate: faker.date.past({ years: 1 }).toISOString().split("T")[0],
      expectedReturnDate: faker.date.future({ years: 1 }).toISOString().split("T")[0],
      pastureType: faker.helpers.arrayElement(PASTURE_TYPE_VALUES),
      animalIds: [faker.string.uuid()],
      isActive: true,
      completedAt: null,
      conflictResolutionStatus: CONFLICT_RESOLUTION_STATUS.NONE,
      invalidatedReason: null,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
    });
  }

  createMountain(overrides?: Partial<PastureDeclarationRecord>): PastureDeclarationRecord {
    return this.create({ pastureType: PASTURE_TYPE.MOUNTAIN, ...overrides });
  }

  createVillage(overrides?: Partial<PastureDeclarationRecord>): PastureDeclarationRecord {
    return this.create({ pastureType: PASTURE_TYPE.VILLAGE, ...overrides });
  }

  createCompleted(overrides?: Partial<PastureDeclarationRecord>): PastureDeclarationRecord {
    return this.create({
      completedAt: faker.date.recent({ days: 5 }).toISOString().split("T")[0],
      ...overrides,
    });
  }

  createInvalidated(overrides?: Partial<PastureDeclarationRecord>): PastureDeclarationRecord {
    return this.create({
      conflictResolutionStatus: CONFLICT_RESOLUTION_STATUS.INVALIDATED_DATA_ERROR,
      invalidatedReason: faker.lorem.sentence(),
      ...overrides,
    });
  }
}
