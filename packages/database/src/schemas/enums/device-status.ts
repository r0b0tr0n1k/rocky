import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { DEVICE_STATUS_VALUES } from '../../constants/device-status.js';

export const deviceStatusPgEnum = pgEnum('device_status', toPgEnumValues(DEVICE_STATUS_VALUES));
