import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { DATA_SOURCE_VALUES } from '../../constants/data-source.js';

export const dataSourcePgEnum = pgEnum('data_source', toPgEnumValues(DATA_SOURCE_VALUES));
