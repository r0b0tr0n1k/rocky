import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { REPRINT_STATUS_VALUES } from '../../constants/reprint-status.js';

export const reprintStatusPgEnum = pgEnum('reprint_status', toPgEnumValues(REPRINT_STATUS_VALUES));
