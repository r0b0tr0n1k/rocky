import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { EAR_TAG_REPLACEMENT_STATUS_VALUES } from "../../constants/ear-tag-replacement-status.js";

export const earTagReplacementStatusPgEnum = pgEnum('ear_tag_replacement_status', toPgEnumValues(EAR_TAG_REPLACEMENT_STATUS_VALUES));
