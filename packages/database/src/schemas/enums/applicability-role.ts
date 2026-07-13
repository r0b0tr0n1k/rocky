import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { APPLICABILITY_ROLE_VALUES } from '../../constants/applicability-role.js';

export const applicabilityRolePgEnum = pgEnum('applicability_role', toPgEnumValues(APPLICABILITY_ROLE_VALUES));
