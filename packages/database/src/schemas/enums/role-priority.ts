import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { ROLE_PRIORITY_VALUES } from "../../constants/role-priority.js";

export const rolePriorityPgEnum = pgEnum('role_priority', toPgEnumValues(ROLE_PRIORITY_VALUES));
