import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { WRITE_ROLE_VALUES } from '../../constants/write-roles.js';

export const writeRolesPgEnum = pgEnum('write_roles', toPgEnumValues(WRITE_ROLE_VALUES));
