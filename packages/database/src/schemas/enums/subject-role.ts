import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { SUBJECT_ROLE_VALUES } from "../../constants/subject-role.js";

export const subjectRolePgEnum = pgEnum('subject_role', toPgEnumValues(SUBJECT_ROLE_VALUES));
