// ── RBAC: Permission Test Factory ──
// resource/action/scope are free-form varchars (SSOT lives in seeded data)
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import { permissionsSelectSchema } from "@rocky/database/zod";
import { PERMISSION_SCOPE } from "@rocky/database/constants";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type PermissionRecord = InferSelectSchema<typeof permissionsSelectSchema>;

export class PermissionFactory extends SchemaDataFactory<PermissionRecord> {
  constructor() {
    super(permissionsSelectSchema, {
      id: faker.string.uuid(),
      resource: faker.helpers.arrayElement([
        "animal",
        "farm",
        "ear_tag_order",
        "inspection",
        "movement",
        "archive",
      ]),
      action: faker.helpers.arrayElement([
        "read",
        "create",
        "update",
        "delete",
        "approve",
        "archive",
      ]),
      description: faker.lorem.sentence(),
      scope: PERMISSION_SCOPE.ALL,
      createdAt: faker.date.recent({ days: 30 }),
    });
  }

  createGlobal(overrides?: Partial<PermissionRecord>): PermissionRecord {
    return this.create({ scope: PERMISSION_SCOPE.ALL, ...overrides });
  }

  createScoped(scope: string, overrides?: Partial<PermissionRecord>): PermissionRecord {
    return this.create({ scope, ...overrides });
  }
}
