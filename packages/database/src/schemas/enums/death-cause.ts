import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { DEATH_CAUSE_VALUES } from "../../constants/death-cause.js";

export const deathCausePgEnum = pgEnum('death_cause', toPgEnumValues(DEATH_CAUSE_VALUES));
