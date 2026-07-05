import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SORT_ORDER_VALUES } from '../../constants/sort-order.js';

export const sortOrderPgEnum = pgEnum('sort_order', toPgEnumValues(SORT_ORDER_VALUES));
