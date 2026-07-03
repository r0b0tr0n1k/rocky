import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SORT_BY_FARM_VALUES } from '../../constants/sort-by-farm.js';

export const sortByFarmPgEnum = pgEnum('sort_by_farm', toPgEnumValues(SORT_BY_FARM_VALUES));
