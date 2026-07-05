import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { NOTIFICATION_TYPE_VALUES } from '../../constants/notification-type.js';

export const notificationTypePgEnum = pgEnum('notification_type', toPgEnumValues(NOTIFICATION_TYPE_VALUES));
