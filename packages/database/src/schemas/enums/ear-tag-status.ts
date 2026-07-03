import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { EAR_TAG_STATUS_VALUES } from '../../constants/ear-tag-status.js';

export const earTagStatusPgEnum = pgEnum('ear_tag_status', toPgEnumValues(EAR_TAG_STATUS_VALUES));
