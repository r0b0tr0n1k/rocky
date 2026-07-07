import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { CONFLICT_RESOLUTION_STATUS_VALUES } from '../../constants/conflict-resolution-status.js';

export const conflictResolutionStatusPgEnum = pgEnum('conflict_resolution_status', toPgEnumValues(CONFLICT_RESOLUTION_STATUS_VALUES));
