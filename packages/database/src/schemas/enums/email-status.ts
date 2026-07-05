import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { EMAIL_STATUS_VALUES } from '../../constants/email-status.js';

export const emailStatusPgEnum = pgEnum('email_status', toPgEnumValues(EMAIL_STATUS_VALUES));
