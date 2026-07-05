import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { INSPECTION_STATUS_VALUES } from "../../constants/inspection-status.js";

export const inspectionStatusPgEnum = pgEnum('inspection_status', toPgEnumValues(INSPECTION_STATUS_VALUES));
