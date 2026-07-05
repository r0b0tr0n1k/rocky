import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { ENVIRONMENT_VALUES } from '../../constants/environment.js';

export const environmentPgEnum = pgEnum('environment', toPgEnumValues(ENVIRONMENT_VALUES));
