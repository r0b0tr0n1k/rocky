import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { PASSPORT_STATUS_VALUES } from '../../constants/passport-status.js';

export const passportStatusPgEnum = pgEnum('passport_status', toPgEnumValues(PASSPORT_STATUS_VALUES));
