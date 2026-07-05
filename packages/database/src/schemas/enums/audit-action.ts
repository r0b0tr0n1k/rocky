import { pgEnum } from "drizzle-orm/pg-core";
import { AUDIT_ACTION_VALUES } from "../../constants/audit-action.js";
import { toPgEnumValues } from "../../constants/index.js";

export const auditActionPgEnum = pgEnum("audit_action", toPgEnumValues(AUDIT_ACTION_VALUES));
