import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { IOT_DEVICE_STATUS_VALUES } from '../../constants/iot-device-status.js';

export const iotDeviceStatusPgEnum = pgEnum('iot_device_status', toPgEnumValues(IOT_DEVICE_STATUS_VALUES));
