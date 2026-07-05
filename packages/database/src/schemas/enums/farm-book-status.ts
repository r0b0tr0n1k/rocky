import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { FARM_BOOK_STATUS_VALUES } from '../../constants/farm-book-status.js';

export const farmBookStatusPgEnum = pgEnum('farm_book_status', toPgEnumValues(FARM_BOOK_STATUS_VALUES));
