import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { SANITARY_DECISION_VALUES } from '../../constants/sanitary-decision.js';

export const sanitaryDecisionPgEnum = pgEnum('sanitary_decision', toPgEnumValues(SANITARY_DECISION_VALUES));
