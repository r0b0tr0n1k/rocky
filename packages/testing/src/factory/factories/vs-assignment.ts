// ── VS Assignment (Farm Bot) Test Factory ──
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { vsAssignmentsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type VsAssignmentRecord = InferSelectSchema<typeof vsAssignmentsSelectSchema>;

export class VsAssignmentFactory extends SchemaDataFactory<VsAssignmentRecord> {
  constructor(contractId: string, farmId: string) {
    super(vsAssignmentsSelectSchema, {
      id: faker.string.uuid(),
      contractId,
      farmId,
      isPrimary: true,
      startDate: faker.date.past({ years: 1 }),
      endDate: null,
      notes: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createPrimary(overrides?: Partial<VsAssignmentRecord>): VsAssignmentRecord {
    return this.create({ isPrimary: true, ...overrides });
  }

  createSecondary(overrides?: Partial<VsAssignmentRecord>): VsAssignmentRecord {
    return this.create({ isPrimary: false, ...overrides });
  }
}
