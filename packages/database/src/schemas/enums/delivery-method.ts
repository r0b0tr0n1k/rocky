import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { DELIVERY_METHOD_VALUES } from '../../constants/delivery-method.js';

export const deliveryMethodPgEnum = pgEnum('delivery_method', toPgEnumValues(DELIVERY_METHOD_VALUES));
