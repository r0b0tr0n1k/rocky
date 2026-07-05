import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { CONTINGENT_TYPE_VALUES } from '../../constants/contingent-type.js';

export const contingentTypePgEnum = pgEnum('contingent_type', toPgEnumValues(CONTINGENT_TYPE_VALUES));
