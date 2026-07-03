import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SEX_VALUES } from '../../constants/sex.js';

export const sexPgEnum = pgEnum('sex', toPgEnumValues(SEX_VALUES));
