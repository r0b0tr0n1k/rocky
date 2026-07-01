// ── Dumb Zod — System Management Domain ──

import { createSelectSchema, createInsertSchema } from "./factory";
import { users, userSessions } from "../schema/sm/users";
import {
	roles,
	permissions,
	rolePermissions,
	userRoles,
} from "../schema/sm/rbac";
import { organizations } from "../schema/sm/organizations";
import {
	codeTables,
	systemParameters,
	businessRules,
} from "../schema/sm/modules";

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
