import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SORT_BY_USER_VALUES } from '../../constants/sort-by-user.js';

export const sortByUserPgEnum = pgEnum('sort_by_user', toPgEnumValues(SORT_BY_USER_VALUES));
