import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SORT_BY_MOVEMENT_VALUES } from '../../constants/sort-by-movement.js';

export const sortByMovementPgEnum = pgEnum('sort_by_movement', toPgEnumValues(SORT_BY_MOVEMENT_VALUES));
