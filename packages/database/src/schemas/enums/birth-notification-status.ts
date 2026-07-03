import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { BIRTH_NOTIFICATION_STATUS_VALUES } from '../../constants/birth-notification-status.js';

export const birthNotificationStatusPgEnum = pgEnum('birth_notification_status', toPgEnumValues(BIRTH_NOTIFICATION_STATUS_VALUES));
