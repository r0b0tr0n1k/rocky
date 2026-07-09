// ── Ear Tag Type (EarTag Bot) Test Factory ──
// Internal enums: TAG_CATEGORY
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { TAG_CATEGORY, TAG_CATEGORY_VALUES } from "@rocky/database/constants";
import { earTagTypesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type EarTagTypeRecord = InferSelectSchema<typeof earTagTypesSelectSchema>;

export class EarTagTypeFactory extends SchemaDataFactory<EarTagTypeRecord> {
  constructor() {
    super(earTagTypesSelectSchema, {
      id: faker.string.uuid(),
      legacyId: null,
      code: `ET_${faker.string.alphanumeric({ length: 8 }).toUpperCase()}`,
      name: `Tag Type ${faker.string.alphanumeric({ length: 4 })}`,
      nameAlt: null,
      category: faker.helpers.arrayElement(TAG_CATEGORY_VALUES),
      tagGender: faker.helpers.arrayElement(["male", "female", "unisex"]),
      color: faker.color.human(),
      material: faker.helpers.arrayElement(["plastic", "metal", "electronic"]),
      size: faker.helpers.arrayElement(["S", "M", "L"]),
      prefix: null,
      numberRangeStart: null,
      numberRangeEnd: null,
      supplier: faker.company.name(),
      supplierCode: null,
      unitPrice: null,
      description: faker.lorem.sentence(),
      imageUrl: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createActive(overrides?: Partial<EarTagTypeRecord>): EarTagTypeRecord {
    return this.create({ isActive: true, ...overrides });
  }

  createInactive(overrides?: Partial<EarTagTypeRecord>): EarTagTypeRecord {
    return this.create({ isActive: false, ...overrides });
  }

  createForCategory(
    category: (typeof TAG_CATEGORY)[keyof typeof TAG_CATEGORY],
    overrides?: Partial<EarTagTypeRecord>,
  ): EarTagTypeRecord {
    return this.create({ category, ...overrides });
  }
}
