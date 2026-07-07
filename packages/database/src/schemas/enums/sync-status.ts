import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SYNC_STATUS_VALUES } from '../../constants/sync-status.js';

export const syncStatusPgEnum = pgEnum('sync_status', toPgEnumValues(SYNC_STATUS_VALUES));
