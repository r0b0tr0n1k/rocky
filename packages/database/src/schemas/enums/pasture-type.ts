import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/index.js";
import { PASTURE_TYPE_VALUES } from "../../constants/pasture-type.js";

export const pastureTypePgEnum = pgEnum("pasture_type", toPgEnumValues(PASTURE_TYPE_VALUES));
