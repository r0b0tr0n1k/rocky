import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { PROCEDURE_TYPE_VALUES } from '../../constants/procedure-type.js';

export const procedureTypePgEnum = pgEnum('procedure_type', toPgEnumValues(PROCEDURE_TYPE_VALUES));
