import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { USER_STATUS_VALUES } from "@prasici/database/constants/user-status";

export const userStatusSchema = zEnum(USER_STATUS_VALUES);
export type UserStatus = z.infer<typeof userStatusSchema>;
