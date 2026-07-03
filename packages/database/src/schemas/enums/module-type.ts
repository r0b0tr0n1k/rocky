import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { MODULE_TYPE_VALUES } from '../../constants/module-type.js';

export const moduleTypePgEnum = pgEnum('module_type', toPgEnumValues(MODULE_TYPE_VALUES));
