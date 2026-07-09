// ── Audit Log (Centralized Audit) Test Factory ──
// Internal enums: AUDIT_ACTION, EVENT_SOURCE
//
// Diamond Seal:
//   Drizzle pgTable → createSelectSchema → InferSelectSchema → Factory output

import { faker } from "@faker-js/faker";
import {
  AUDIT_ACTION,
  AUDIT_ACTION_VALUES,
  EVENT_SOURCE,
  EVENT_SOURCE_VALUES,
} from "@rocky/database/constants";
import { auditLogSelectSchema } from "@rocky/database/zod";
import { SchemaDataFactory } from "../base.js";
import type { InferSelectSchema } from "../type-helpers.js";

export type AuditLogRecord = InferSelectSchema<typeof auditLogSelectSchema>;

export class AuditLogFactory extends SchemaDataFactory<AuditLogRecord> {
  constructor(userId?: string) {
    super(auditLogSelectSchema, {
      id: faker.string.uuid(),
      userId: userId ?? null,
      sessionId: null,
      action: faker.helpers.arrayElement(AUDIT_ACTION_VALUES),
      resource: faker.helpers.arrayElement([
        "animal",
        "farm",
        "ear_tag_order",
        "inspection",
        "movement",
        "user",
      ]),
      resourceId: faker.string.alphanumeric({ length: 12 }),
      oldValue: null,
      newValue: null,
      changes: null,
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
      source: faker.helpers.arrayElement(EVENT_SOURCE_VALUES),
      success: true,
      errorMessage: null,
      createdAt: faker.date.recent({ days: 30 }),
    });
  }

  createSuccess(overrides?: Partial<AuditLogRecord>): AuditLogRecord {
    return this.create({ success: true, ...overrides });
  }

  createFailure(overrides?: Partial<AuditLogRecord>): AuditLogRecord {
    return this.create({
      success: false,
      errorMessage: faker.lorem.sentence(),
      ...overrides,
    });
  }

  createLogin(overrides?: Partial<AuditLogRecord>): AuditLogRecord {
    return this.create({ action: AUDIT_ACTION.LOGIN, ...overrides });
  }

  createCreate(overrides?: Partial<AuditLogRecord>): AuditLogRecord {
    return this.create({ action: AUDIT_ACTION.CREATE, ...overrides });
  }

  createUpdate(overrides?: Partial<AuditLogRecord>): AuditLogRecord {
    return this.create({ action: AUDIT_ACTION.UPDATE, ...overrides });
  }

  createDelete(overrides?: Partial<AuditLogRecord>): AuditLogRecord {
    return this.create({ action: AUDIT_ACTION.DELETE, ...overrides });
  }
}
