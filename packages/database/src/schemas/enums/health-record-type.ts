import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { HEALTH_RECORD_TYPE_VALUES } from '../../constants/health-record-type.js';

export const healthRecordTypePgEnum = pgEnum('health_record_type', toPgEnumValues(HEALTH_RECORD_TYPE_VALUES));
