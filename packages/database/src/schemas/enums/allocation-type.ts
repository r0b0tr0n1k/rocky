import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { ALLOCATION_TYPE_VALUES } from "../../constants/allocation-type.js";

export const allocationTypePgEnum = pgEnum('allocation_type', toPgEnumValues(ALLOCATION_TYPE_VALUES));
