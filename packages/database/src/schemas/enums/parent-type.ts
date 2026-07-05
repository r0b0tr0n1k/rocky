import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/index.js";
import { PARENT_TYPE_VALUES } from "../../constants/parent-type.js";

export const parentTypePgEnum = pgEnum("parent_type", toPgEnumValues(PARENT_TYPE_VALUES));
