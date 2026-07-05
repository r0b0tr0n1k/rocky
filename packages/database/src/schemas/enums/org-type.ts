import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { ORG_TYPE_VALUES } from '../../constants/org-type.js';

export const orgTypePgEnum = pgEnum('org_type', toPgEnumValues(ORG_TYPE_VALUES));
