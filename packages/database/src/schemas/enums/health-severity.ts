import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { HEALTH_SEVERITY_VALUES } from '../../constants/health-severity.js';

export const healthSeverityPgEnum = pgEnum('health_severity', toPgEnumValues(HEALTH_SEVERITY_VALUES));
