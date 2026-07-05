import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { READING_TYPE_VALUES } from '../../constants/reading-type.js';

export const readingTypePgEnum = pgEnum('reading_type', toPgEnumValues(READING_TYPE_VALUES));
