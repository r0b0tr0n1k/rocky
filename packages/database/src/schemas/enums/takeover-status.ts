import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { TAKEOVER_STATUS_VALUES } from '../../constants/takeover-status.js';

export const takeoverStatusPgEnum = pgEnum('takeover_status', toPgEnumValues(TAKEOVER_STATUS_VALUES));
