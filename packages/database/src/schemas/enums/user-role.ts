import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { USER_ROLE_VALUES } from '../../constants/user-role.js';

export const userRolePgEnum = pgEnum('user_role', toPgEnumValues(USER_ROLE_VALUES));
