import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { SEVERITY_VALUES } from "../../constants/severity.js";

export const severityPgEnum = pgEnum('severity', toPgEnumValues(SEVERITY_VALUES));
