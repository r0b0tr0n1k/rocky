import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { WEIGHING_TYPE_VALUES } from '../../constants/weighing-type.js';

export const weighingTypePgEnum = pgEnum('weighing_type', toPgEnumValues(WEIGHING_TYPE_VALUES));
