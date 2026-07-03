import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { USER_STATUS_VALUES } from '../../constants/user-status.js';

export const userStatusPgEnum = pgEnum('user_status', toPgEnumValues(USER_STATUS_VALUES));
