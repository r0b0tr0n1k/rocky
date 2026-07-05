import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { CORRECTION_STATUS_VALUES } from "../../constants/correction-status.js";

export const correctionStatusPgEnum = pgEnum('correction_status', toPgEnumValues(CORRECTION_STATUS_VALUES));
