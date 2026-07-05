import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { APPROVAL_ACTION_VALUES } from '../../constants/approval-action.js';

export const approvalActionPgEnum = pgEnum('approval_action', toPgEnumValues(APPROVAL_ACTION_VALUES));
