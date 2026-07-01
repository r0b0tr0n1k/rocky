import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/_brand";
import { VERIFICATION_STATUS_VALUES } from "../../constants/verification-status";

export const verificationStatusEnum = pgEnum(
	"verification_status",
	toPgEnumValues(VERIFICATION_STATUS_VALUES),
);
