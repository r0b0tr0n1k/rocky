import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { NOTIFICATION_STATUS_VALUES } from '../../constants/notification-status.js';

export const notificationStatusPgEnum = pgEnum('notification_status', toPgEnumValues(NOTIFICATION_STATUS_VALUES));
