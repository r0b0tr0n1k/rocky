import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { PROCESSING_STAGE_VALUES } from '../../constants/processing-stage.js';

export const processingStagePgEnum = pgEnum('processing_stage', toPgEnumValues(PROCESSING_STAGE_VALUES));
