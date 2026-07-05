import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { ADMIN_ROLE_VALUES } from '../../constants/admin-roles.js';

export const adminRolesPgEnum = pgEnum('admin_roles', toPgEnumValues(ADMIN_ROLE_VALUES));
