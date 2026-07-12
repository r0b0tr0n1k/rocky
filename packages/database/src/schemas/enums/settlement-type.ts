import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SETTLEMENT_TYPE_VALUES } from '../../constants/settlement-type.js';

export const settlementTypePgEnum = pgEnum('settlement_type', toPgEnumValues(SETTLEMENT_TYPE_VALUES));
