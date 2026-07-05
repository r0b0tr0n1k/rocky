import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { REPRINT_REASON_VALUES } from '../../constants/reprint-reason.js';

export const reprintReasonPgEnum = pgEnum('reprint_reason', toPgEnumValues(REPRINT_REASON_VALUES));
