import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { SUBJECT_ROLE_VALUES } from "@prasici/database/constants/subject-role";

export const subjectRoleSchema = zEnum(SUBJECT_ROLE_VALUES);
export type SubjectRole = z.infer<typeof subjectRoleSchema>;
