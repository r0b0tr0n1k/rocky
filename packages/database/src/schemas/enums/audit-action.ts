import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { AUDIT_ACTION_VALUES } from '../../constants/audit-action.js';

export const auditActionPgEnum = pgEnum('audit_action', toPgEnumValues(AUDIT_ACTION_VALUES));
