import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { PERMISSION_SCOPE_VALUES } from '../../constants/permission-scope.js';

export const permissionScopePgEnum = pgEnum('permission_scope', toPgEnumValues(PERMISSION_SCOPE_VALUES));
