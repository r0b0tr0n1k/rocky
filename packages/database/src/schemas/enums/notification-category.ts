import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { NOTIFICATION_CATEGORY_VALUES } from '../../constants/notification-category.js';

export const notificationCategoryPgEnum = pgEnum('notification_category', toPgEnumValues(NOTIFICATION_CATEGORY_VALUES));
