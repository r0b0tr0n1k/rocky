import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { EAR_TAG_STATUS_VALUES } from "@prasici/database/constants/ear-tag-status";

export const earTagStatusSchema = zEnum(EAR_TAG_STATUS_VALUES);
export type EarTagStatus = z.infer<typeof earTagStatusSchema>;
