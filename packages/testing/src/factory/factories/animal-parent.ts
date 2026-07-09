// ── Animal Parent (Animal Bot) Test Factory ──
// Internal enums: PARENT_TYPE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { PARENT_TYPE, PARENT_TYPE_VALUES } from "@rocky/database/constants";
import { animalParentsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type AnimalParentRecord = InferSelectSchema<typeof animalParentsSelectSchema>;

export class AnimalParentFactory extends SchemaDataFactory<AnimalParentRecord> {
  constructor(animalId: string, parentId: string) {
    super(animalParentsSelectSchema, {
      id: faker.string.uuid(),
      animalId,
      parentId,
      parentType: faker.helpers.arrayElement(PARENT_TYPE_VALUES),
      createdAt: faker.date.recent({ days: 30 }),
    });
  }

  createMother(overrides?: Partial<AnimalParentRecord>): AnimalParentRecord {
    return this.create({ parentType: PARENT_TYPE.MOTHER, ...overrides });
  }

  createFather(overrides?: Partial<AnimalParentRecord>): AnimalParentRecord {
    return this.create({ parentType: PARENT_TYPE.FATHER, ...overrides });
  }
}
