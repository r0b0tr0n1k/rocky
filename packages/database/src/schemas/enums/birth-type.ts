import { pgEnum } from "drizzle-orm/pg-core";
import { BIRTH_TYPE_VALUES } from "../../constants/birth-type.js";
import { toPgEnumValues } from "../../constants/index.js";

export const birthTypePgEnum = pgEnum("birth_type", toPgEnumValues(BIRTH_TYPE_VALUES));
