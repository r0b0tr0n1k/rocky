import { pgEnum } from "drizzle-orm/pg-core";
import { ALLOCATION_STATUS_VALUES } from "../../constants/allocation-status.js";
import { toPgEnumValues } from "../../constants/index.js";

export const allocationStatusPgEnum = pgEnum("allocation_status", toPgEnumValues(ALLOCATION_STATUS_VALUES));
