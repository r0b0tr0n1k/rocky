import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { VACCINE_TYPE_VALUES } from '../../constants/vaccine-type.js';

export const vaccineTypePgEnum = pgEnum('vaccine_type', toPgEnumValues(VACCINE_TYPE_VALUES));
