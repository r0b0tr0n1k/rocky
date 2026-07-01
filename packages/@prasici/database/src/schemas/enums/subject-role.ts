import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/_brand";
import { SUBJECT_ROLE_VALUES } from "../../constants/subject-role";

export const subjectRoleEnum = pgEnum(
	"subject_role",
	toPgEnumValues(SUBJECT_ROLE_VALUES),
);
