import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { IOT_DEVICE_TYPE_VALUES } from '../../constants/device-type.js';

export const deviceTypePgEnum = pgEnum('device_type', toPgEnumValues(IOT_DEVICE_TYPE_VALUES));
