import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SYNC_ERROR_TYPE_VALUES } from '../../constants/sync-error-type.js';

export const syncErrorTypePgEnum = pgEnum('sync_error_type', toPgEnumValues(SYNC_ERROR_TYPE_VALUES));
