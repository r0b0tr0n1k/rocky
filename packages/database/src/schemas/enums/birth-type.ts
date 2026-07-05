import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { BIRTH_TYPE_VALUES } from '../../constants/birth-type.js';

export const birthTypePgEnum = pgEnum('birth_type', toPgEnumValues(BIRTH_TYPE_VALUES));
