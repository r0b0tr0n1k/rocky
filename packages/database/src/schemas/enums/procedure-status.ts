import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { PROCEDURE_STATUS_VALUES } from '../../constants/procedure-status.js';

export const procedureStatusPgEnum = pgEnum('procedure_status', toPgEnumValues(PROCEDURE_STATUS_VALUES));
