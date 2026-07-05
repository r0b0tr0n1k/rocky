import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { DETECTION_SOURCE_VALUES } from '../../constants/detection-source.js';

export const detectionSourcePgEnum = pgEnum('detection_source', toPgEnumValues(DETECTION_SOURCE_VALUES));
