import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SAMPLE_STATUS_VALUES } from '../../constants/sample-status.js';

export const sampleStatusPgEnum = pgEnum('sample_status', toPgEnumValues(SAMPLE_STATUS_VALUES));
