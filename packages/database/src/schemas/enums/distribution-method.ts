import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { DISTRIBUTION_METHOD_VALUES } from '../../constants/distribution-method.js';

export const distributionMethodPgEnum = pgEnum('distribution_method', toPgEnumValues(DISTRIBUTION_METHOD_VALUES));
