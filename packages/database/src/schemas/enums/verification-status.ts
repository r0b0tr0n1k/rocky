import { toPgEnumValues } from "../../constants/index.js";
import { pgEnum } from 'drizzle-orm/pg-core';
import { VERIFICATION_STATUS_VALUES } from "../../constants/verification-status.js";

export const verificationStatusPgEnum = pgEnum('verification_status', toPgEnumValues(VERIFICATION_STATUS_VALUES));
