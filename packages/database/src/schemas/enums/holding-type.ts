import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { HOLDING_TYPE_VALUES } from "../../constants/holding-type.js";

export const holdingTypePgEnum = pgEnum('holding_type', toPgEnumValues(HOLDING_TYPE_VALUES));
