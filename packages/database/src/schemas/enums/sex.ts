import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/index.js";
import { SEX_VALUES } from "../../constants/sex.js";

export const sexPgEnum = pgEnum("sex", toPgEnumValues(SEX_VALUES));
