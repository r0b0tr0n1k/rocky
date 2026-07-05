import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { FENCE_TYPE_VALUES } from '../../constants/fence-type.js';

export const fenceTypePgEnum = pgEnum('fence_type', toPgEnumValues(FENCE_TYPE_VALUES));
