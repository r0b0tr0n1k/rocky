import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { VERIFICATION_STATUS_VALUES } from "@prasici/database/constants/verification-status";

export const verificationStatusSchema = zEnum(VERIFICATION_STATUS_VALUES);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
