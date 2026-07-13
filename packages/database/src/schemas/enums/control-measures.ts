import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { CONTROL_MEASURES_VALUES } from '../../constants/control-measures.js';

export const controlMeasuresPgEnum = pgEnum('control_measures', toPgEnumValues(CONTROL_MEASURES_VALUES));
