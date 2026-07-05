import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { CORRECTION_CASE_TYPE_VALUES } from '../../constants/correction-case-type.js';

export const correctionCaseTypePgEnum = pgEnum('correction_case_type', toPgEnumValues(CORRECTION_CASE_TYPE_VALUES));
