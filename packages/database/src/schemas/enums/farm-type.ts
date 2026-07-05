import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { FARM_TYPE_VALUES } from "../../constants/farm-type.js";

export const farmTypePgEnum = pgEnum('farm_type', toPgEnumValues(FARM_TYPE_VALUES));
