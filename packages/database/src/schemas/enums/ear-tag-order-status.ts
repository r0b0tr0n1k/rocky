import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { EAR_TAG_ORDER_STATUS_VALUES } from "../../constants/ear-tag-order-status.js";

export const earTagOrderStatusPgEnum = pgEnum('ear_tag_order_status', toPgEnumValues(EAR_TAG_ORDER_STATUS_VALUES));
