import { pgEnum } from "drizzle-orm/pg-core";
import { CONTINGENT_TYPE_VALUES } from "../../constants/contingent-type.js";
import { toPgEnumValues } from "../../constants/index.js";

export const contingentTypePgEnum = pgEnum("contingent_type", toPgEnumValues(CONTINGENT_TYPE_VALUES));
