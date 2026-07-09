// ── Farm-Subject Binding (Farm Bot) Test Factory ──
// Internal enums: SUBJECT_ROLE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { SUBJECT_ROLE, SUBJECT_ROLE_VALUES } from "@rocky/database/constants";
import { farmSubjectsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type FarmSubjectRecord = InferSelectSchema<typeof farmSubjectsSelectSchema>;

export class FarmSubjectFactory extends SchemaDataFactory<FarmSubjectRecord> {
  constructor(farmId: string, subjectId: string) {
    super(farmSubjectsSelectSchema, {
      id: faker.string.uuid(),
      legacyId: null,
      farmId,
      subjectId,
      role: faker.helpers.arrayElement(SUBJECT_ROLE_VALUES),
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      validTo: null,
    });
  }

  createOwner(overrides?: Partial<FarmSubjectRecord>): FarmSubjectRecord {
    return this.create({ role: SUBJECT_ROLE.OWNER, ...overrides });
  }

  createKeeper(overrides?: Partial<FarmSubjectRecord>): FarmSubjectRecord {
    return this.create({ role: SUBJECT_ROLE.KEEPER, ...overrides });
  }
}
