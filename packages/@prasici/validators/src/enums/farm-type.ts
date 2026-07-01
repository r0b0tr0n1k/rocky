import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { FARM_TYPE_VALUES } from "@prasici/database/constants/farm-type";

export const farmTypeSchema = zEnum(FARM_TYPE_VALUES);
export type FarmType = z.infer<typeof farmTypeSchema>;
