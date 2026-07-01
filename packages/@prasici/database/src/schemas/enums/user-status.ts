import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/_brand";
import { USER_STATUS_VALUES } from "../../constants/user-status";

export const userStatusEnum = pgEnum(
	"user_status",
	toPgEnumValues(USER_STATUS_VALUES),
);
