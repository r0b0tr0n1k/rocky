import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { ORDER_STATUS_VALUES } from "../../constants/order-status.js";

export const orderStatusPgEnum = pgEnum('order_status', toPgEnumValues(ORDER_STATUS_VALUES));
