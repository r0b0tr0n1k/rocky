import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/_brand";
import { EAR_TAG_STATUS_VALUES } from "../../constants/ear-tag-status";

export const earTagStatusEnum = pgEnum(
	"ear_tag_status",
	toPgEnumValues(EAR_TAG_STATUS_VALUES),
);
