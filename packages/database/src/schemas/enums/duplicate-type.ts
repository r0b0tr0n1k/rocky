import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { DUPLICATE_TYPE_VALUES } from "../../constants/duplicate-type.js";

export const duplicateTypePgEnum = pgEnum('duplicate_type', toPgEnumValues(DUPLICATE_TYPE_VALUES));
