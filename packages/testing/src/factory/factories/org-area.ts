// ── Organization Area (Coverage) Test Factory ──
// No internal enums — simple table with FK and optional fields
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { orgAreasSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type OrgAreaRecord = InferSelectSchema<typeof orgAreasSelectSchema>;

export class OrgAreaFactory extends SchemaDataFactory<OrgAreaRecord> {
  constructor(organizationId: string) {
    super(orgAreasSelectSchema, {
      id: faker.string.uuid(),
      organizationId,
      communeId: null,
      region: faker.location.city(),
      createdAt: faker.date.recent({ days: 30 }),
    });
  }

  createWithCommune(communeId: string, overrides?: Partial<OrgAreaRecord>): OrgAreaRecord {
    return this.create({
      communeId,
      ...overrides,
    });
  }

  createWithRegion(region: string, overrides?: Partial<OrgAreaRecord>): OrgAreaRecord {
    return this.create({
      region,
      ...overrides,
    });
  }

  createForOrganization(organizationId: string, overrides?: Partial<OrgAreaRecord>): OrgAreaRecord {
    return this.create({
      organizationId,
      ...overrides,
    });
  }
}
