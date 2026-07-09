// ── Sync Error (Farm Bot) Test Factory ──
// Internal enums: SYNC_ERROR_TYPE, SYNC_STATUS
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  SYNC_ERROR_TYPE,
  SYNC_ERROR_TYPE_VALUES,
  SYNC_STATUS,
} from "@rocky/database/constants";
import { syncErrorsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type SyncErrorRecord = InferSelectSchema<typeof syncErrorsSelectSchema>;

export class SyncErrorFactory extends SchemaDataFactory<SyncErrorRecord> {
  constructor() {
    super(syncErrorsSelectSchema, {
      id: faker.string.uuid(),
      legacyId: null,
      farmId: null,
      addressId: null,
      subjectId: null,
      errorType: faker.helpers.arrayElement(SYNC_ERROR_TYPE_VALUES),
      syncStatus: SYNC_STATUS.WARNING,
      note: null,
      resolved: false,
      resolvedAt: null,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
    });
  }

  createWarning(overrides?: Partial<SyncErrorRecord>): SyncErrorRecord {
    return this.create({ syncStatus: SYNC_STATUS.WARNING, ...overrides });
  }

  createRejected(overrides?: Partial<SyncErrorRecord>): SyncErrorRecord {
    return this.create({ syncStatus: SYNC_STATUS.REJECTED, ...overrides });
  }

  createResolved(overrides?: Partial<SyncErrorRecord>): SyncErrorRecord {
    return this.create({
      resolved: true,
      resolvedAt: faker.date.recent({ days: 5 }),
      ...overrides,
    });
  }
}
