import { toPgEnumValues } from '../../constants/index.js';
import { pgEnum } from 'drizzle-orm/pg-core';
import { EAR_TAG_REPLACEMENT_REASON_VALUES } from '../../constants/ear-tag-replacement-reason.js';

export const earTagReplacementReasonPgEnum = pgEnum('ear_tag_replacement_reason', toPgEnumValues(EAR_TAG_REPLACEMENT_REASON_VALUES));
