import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { NOTIFICATION_PRIORITY_VALUES } from "../../constants/notification-priority.js";

export const notificationPriorityPgEnum = pgEnum('notification_priority', toPgEnumValues(NOTIFICATION_PRIORITY_VALUES));
