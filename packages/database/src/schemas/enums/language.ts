import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { LANGUAGE_VALUES } from '../../constants/language.js';

export const languagePgEnum = pgEnum('language', toPgEnumValues(LANGUAGE_VALUES));
