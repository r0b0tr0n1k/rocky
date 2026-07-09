// ── RBAC: Role Test Factory ──
// Internal enums: ROLE_PRIORITY
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { ROLE_PRIORITY, ROLE_PRIORITY_VALUES } from "@rocky/database/constants";
import { rolesSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type RoleRecord = InferSelectSchema<typeof rolesSelectSchema>;

export class RoleFactory extends SchemaDataFactory<RoleRecord> {
  constructor(name?: string) {
    super(rolesSelectSchema, {
      id: faker.string.uuid(),
      name: name ?? faker.helpers.arrayElement([
        "farm_viewer",
        "farm_editor",
        "vd_staff",
        "vd_admin",
        "cpc_auditor",
      ]),
      description: faker.lorem.sentence(),
      priority: faker.helpers.arrayElement(ROLE_PRIORITY_VALUES),
      isSystem: false,
      createdAt: faker.date.recent({ days: 30 }),
      createdBy: null,
      updatedAt: null,
      validTo: null,
    });
  }

  createSystem(overrides?: Partial<RoleRecord>): RoleRecord {
    return this.create({ isSystem: true, ...overrides });
  }

  createNormal(overrides?: Partial<RoleRecord>): RoleRecord {
    return this.create({ priority: ROLE_PRIORITY.NORMAL, ...overrides });
  }

  createHighPriority(overrides?: Partial<RoleRecord>): RoleRecord {
    return this.create({ priority: ROLE_PRIORITY.HIGH, ...overrides });
  }
}
