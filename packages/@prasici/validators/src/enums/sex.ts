import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { SEX_VALUES } from "@prasici/database/constants/sex";

export const sexSchema = zEnum(SEX_VALUES);
export type Sex = z.infer<typeof sexSchema>;
