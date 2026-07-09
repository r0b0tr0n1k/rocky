// Tests for Tier 1 factories — the previously uncovered business domains:
// Correction, Audit, RBAC (role/permission/role-permission/user-role),
// Notification (notification/preference/template/delivery/event-subscription/reminder)
//
// Verifies that every factory produces schema-valid data (the Diamond Seal
// guarantees this: create() throws if the record fails safeParse) and that the
// domain state helpers set the correct enum values.

import { describe, expect, it } from "vitest";
import { ErrorCorrectionFactory } from "./factory/factories/error-correction.js";
import { AuditLogFactory } from "./factory/factories/audit-log.js";
import { RoleFactory } from "./factory/factories/role.js";
import { PermissionFactory } from "./factory/factories/permission.js";
import { RolePermissionFactory } from "./factory/factories/role-permission.js";
import { UserRoleFactory } from "./factory/factories/user-role.js";
import { NotificationFactory } from "./factory/factories/notification.js";
import { NotificationPreferenceFactory } from "./factory/factories/notification-preference.js";
import { NotificationTemplateFactory } from "./factory/factories/notification-template.js";
import { NotificationDeliveryFactory } from "./factory/factories/notification-delivery.js";
import { EventSubscriptionFactory } from "./factory/factories/event-subscription.js";
import { ReminderFactory } from "./factory/factories/reminder.js";

describe("ErrorCorrectionFactory", () => {
  it("creates a schema-valid correction", () => {
    const record = new ErrorCorrectionFactory().create();
    expect(record.id).toBeDefined();
    expect(record.detectionSource).toBeDefined();
    expect(record.errorDescription).toBeDefined();
    expect(record.isActive).toBe(true);
  });

  it("createPending / createResolved / createEscalated set status", () => {
    const f = new ErrorCorrectionFactory();
    expect(f.createPending().status).toBe("pending");
    expect(f.createResolved().resolvedAt).toBeDefined();
    expect(f.createEscalated().status).toBe("escalated");
    expect(f.createRejected().status).toBe("rejected");
  });

  it("binds farm and animal context", () => {
    const farmId = crypto.randomUUID();
    const animalId = crypto.randomUUID();
    const record = new ErrorCorrectionFactory(farmId, animalId).create();
    expect(record.farmId).toBe(farmId);
    expect(record.animalId).toBe(animalId);
  });
});

describe("AuditLogFactory", () => {
  it("creates a schema-valid audit entry", () => {
    const record = new AuditLogFactory().create();
    expect(record.id).toBeDefined();
    expect(record.action).toBeDefined();
    expect(record.resource).toBeDefined();
    expect(record.source).toBeDefined();
    expect(record.success).toBe(true);
  });

  it("createFailure records an error message", () => {
    const record = new AuditLogFactory().createFailure();
    expect(record.success).toBe(false);
    expect(record.errorMessage).toBeDefined();
  });

  it("action helpers set the correct action", () => {
    const f = new AuditLogFactory();
    expect(f.createLogin().action).toBe("LOGIN");
    expect(f.createCreate().action).toBe("CREATE");
    expect(f.createDelete().action).toBe("DELETE");
  });
});

describe("RBAC factories", () => {
  it("RoleFactory creates a role", () => {
    const record = new RoleFactory().create();
    expect(record.id).toBeDefined();
    expect(record.name).toBeDefined();
    expect(record.isSystem).toBe(false);
  });

  it("RoleFactory.createSystem flags system role", () => {
    expect(new RoleFactory().createSystem().isSystem).toBe(true);
  });

  it("PermissionFactory creates a permission", () => {
    const record = new PermissionFactory().create();
    expect(record.resource).toBeDefined();
    expect(record.action).toBeDefined();
    expect(record.scope).toBe("*");
  });

  it("RolePermissionFactory links role and permission", () => {
    const roleId = crypto.randomUUID();
    const permissionId = crypto.randomUUID();
    const record = new RolePermissionFactory(roleId, permissionId).create();
    expect(record.roleId).toBe(roleId);
    expect(record.permissionId).toBe(permissionId);
  });

  it("UserRoleFactory links user and role", () => {
    const userId = crypto.randomUUID();
    const roleId = crypto.randomUUID();
    const record = new UserRoleFactory(userId, roleId).create();
    expect(record.userId).toBe(userId);
    expect(record.roleId).toBe(roleId);
    expect(record.scopeOrgId).toBeNull();
  });
});

describe("Notification factories", () => {
  it("NotificationFactory creates a notification for a user", () => {
    const userId = crypto.randomUUID();
    const record = new NotificationFactory(userId).create();
    expect(record.userId).toBe(userId);
    expect(record.message).toBeDefined();
    expect(record.type).toBeDefined();
  });

  it("NotificationFactory status helpers", () => {
    const f = new NotificationFactory(crypto.randomUUID());
    expect(f.createPending().status).toBe("pending");
    expect(f.createDelivered().deliveredAt).toBeDefined();
    expect(f.createFailed().status).toBe("failed");
    expect(f.createCancelled().status).toBe("cancelled");
  });

  it("NotificationPreferenceFactory creates a preference", () => {
    const userId = crypto.randomUUID();
    const record = new NotificationPreferenceFactory(userId).create();
    expect(record.userId).toBe(userId);
    expect(record.emailEnabled).toBe(true);
    expect(record.timezone).toBe("Europe/Skopje");
  });

  it("NotificationTemplateFactory creates a multi-language template", () => {
    const record = new NotificationTemplateFactory().create();
    expect(record.code).toBeDefined();
    expect(record.bodyTemplate).toHaveProperty("MK");
    expect(record.bodyTemplate).toHaveProperty("EN");
    expect(record.isActive).toBe(true);
  });

  it("NotificationTemplateFactory type helpers", () => {
    const f = new NotificationTemplateFactory();
    expect(f.createEmail().type).toBe("email");
    expect(f.createSms().type).toBe("sms");
    expect(f.createPush().type).toBe("push");
    expect(f.createInactive().isActive).toBe(false);
  });

  it("NotificationDeliveryFactory links event/subscription/user", () => {
    const outboxEventId = crypto.randomUUID();
    const subscriptionId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const record = new NotificationDeliveryFactory(
      outboxEventId,
      subscriptionId,
      userId,
    ).create();
    expect(record.outboxEventId).toBe(outboxEventId);
    expect(record.subscriptionId).toBe(subscriptionId);
    expect(record.userId).toBe(userId);
    expect(record.deliveryKey).toBeDefined();
    expect(record.status).toBe("pending");
  });

  it("EventSubscriptionFactory creates an active subscription", () => {
    const record = new EventSubscriptionFactory().create();
    expect(record.eventType).toBeDefined();
    expect(record.targetType).toBe("user");
    expect(record.channels).toBeDefined();
    expect(record.isActive).toBe(true);
  });

  it("EventSubscriptionFactory reminder helper", () => {
    const record = new EventSubscriptionFactory().createReminderEnabled();
    expect(record.reminderEnabled).toBe(true);
    expect(record.reminderOffsetDays).toBe(7);
  });

  it("ReminderFactory creates a reminder for a user", () => {
    const userId = crypto.randomUUID();
    const record = new ReminderFactory(userId).create();
    expect(record.userId).toBe(userId);
    expect(record.title).toBeDefined();
    expect(record.status).toBe("pending");
    expect(record.recurrence).toBe("none");
  });

  it("ReminderFactory helpers set status/recurrence", () => {
    const f = new ReminderFactory(crypto.randomUUID());
    expect(f.createCompleted().completedAt).toBeDefined();
    expect(f.createRecurring().recurrence).toBe("daily");
  });
});

describe("Tier 1 factories — createMany", () => {
  it("produces multiple schema-valid records", () => {
    const corrections = new ErrorCorrectionFactory().createMany(5);
    expect(corrections).toHaveLength(5);
    for (const c of corrections) expect(c.id).toBeDefined();

    const notifications = new NotificationFactory(crypto.randomUUID()).createMany(4);
    expect(notifications).toHaveLength(4);
    for (const n of notifications) expect(n.userId).toBeDefined();
  });
});
