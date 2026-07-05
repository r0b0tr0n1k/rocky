import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/index.js";
import { SORT_BY_EARTAG_VALUES } from "../../constants/sort-by-eartag.js";

export const sortByEartagPgEnum = pgEnum("sort_by_eartag", toPgEnumValues(SORT_BY_EARTAG_VALUES));
