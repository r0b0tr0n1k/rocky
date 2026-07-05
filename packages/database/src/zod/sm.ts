// --- Dumb Zod - System Management Domain ---

import { auditLog } from "../schema/sm/audit-log.js";
import { businessRules, codeTables, systemParameters } from "../schema/sm/modules.js";
import { notificationPreferences } from "../schema/sm/notification-preferences.js";
import { notificationTemplates } from "../schema/sm/notification-templates.js";
import { notifications } from "../schema/sm/notifications.js";
import { organizations } from "../schema/sm/organizations.js";
import { permissions, roles } from "../schema/sm/rbac.js";
import { users } from "../schema/sm/users.js";
import { createInsertSchema, createSelectSchema } from "./factory.js";

export const userSelectSchema = createSelectSchema(users);
export const userInsertSchema = createInsertSchema(users);

export const roleSelectSchema = createSelectSchema(roles);
export const roleInsertSchema = createInsertSchema(roles);

export const permissionSelectSchema = createSelectSchema(permissions);
export const permissionInsertSchema = createInsertSchema(permissions);

export const organizationSelectSchema = createSelectSchema(organizations);
export const organizationInsertSchema = createInsertSchema(organizations);

export const codeTableSelectSchema = createSelectSchema(codeTables);
export const codeTableInsertSchema = createInsertSchema(codeTables);

export const systemParamSelectSchema = createSelectSchema(systemParameters);
export const systemParamInsertSchema = createInsertSchema(systemParameters);

export const businessRuleSelectSchema = createSelectSchema(businessRules);
export const businessRuleInsertSchema = createInsertSchema(businessRules);

export const notificationSelectSchema = createSelectSchema(notifications);
export const notificationInsertSchema = createInsertSchema(notifications);

export const notificationTemplateSelectSchema = createSelectSchema(notificationTemplates);
export const notificationTemplateInsertSchema = createInsertSchema(notificationTemplates);

export const notificationPreferenceSelectSchema = createSelectSchema(notificationPreferences);
export const notificationPreferenceInsertSchema = createInsertSchema(notificationPreferences);

export const auditLogSelectSchema = createSelectSchema(auditLog);
export const auditLogInsertSchema = createInsertSchema(auditLog);
