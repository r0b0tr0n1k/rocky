// ── Organization Test Factory ──
// Internal enums: ORG_TYPE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { ORG_TYPE, ORG_TYPE_VALUES } from "@rocky/database/constants";
import { organizationsSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type OrganizationRecord = InferSelectSchema<typeof organizationsSelectSchema>;

export class OrganizationFactory extends SchemaDataFactory<OrganizationRecord> {
  constructor() {
    super(organizationsSelectSchema, {
      id: faker.string.uuid(),
      name1: faker.company.name(),
      name2: faker.company.name(),
      name3: faker.company.name(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        zipCode: faker.location.zipCode(),
      },
      phone: faker.phone.number(),
      fax: faker.phone.number(),
      email: faker.internet.email(),
      orgType: faker.helpers.arrayElement(ORG_TYPE_VALUES),
      parentId: null,
      isActive: true,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      validTo: null,
    });
  }

  createVD(overrides?: Partial<OrganizationRecord>): OrganizationRecord {
    return this.create({
      orgType: ORG_TYPE.VD,
      ...overrides,
    });
  }

  createVetClinic(overrides?: Partial<OrganizationRecord>): OrganizationRecord {
    return this.create({
      orgType: ORG_TYPE.VET_CLINIC,
      ...overrides,
    });
  }

  createSlaughterhouse(overrides?: Partial<OrganizationRecord>): OrganizationRecord {
    return this.create({
      orgType: ORG_TYPE.SLAUGHTERHOUSE,
      ...overrides,
    });
  }

  createLivestockMarket(overrides?: Partial<OrganizationRecord>): OrganizationRecord {
    return this.create({
      orgType: ORG_TYPE.LIVESTOCK_MARKET,
      ...overrides,
    });
  }

  createActive(overrides?: Partial<OrganizationRecord>): OrganizationRecord {
    return this.create({
      isActive: true,
      ...overrides,
    });
  }

  createInactive(overrides?: Partial<OrganizationRecord>): OrganizationRecord {
    return this.create({
      isActive: false,
      ...overrides,
    });
  }

  createWithParent(parentId: string, overrides?: Partial<OrganizationRecord>): OrganizationRecord {
    return this.create({
      parentId,
      ...overrides,
    });
  }
}
