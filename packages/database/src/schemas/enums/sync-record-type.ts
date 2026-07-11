import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SYNC_RECORD_TYPE_VALUES } from '../../constants/sync-record-type.js';

export const syncRecordTypePgEnum = pgEnum('sync_record_type', toPgEnumValues(SYNC_RECORD_TYPE_VALUES));
