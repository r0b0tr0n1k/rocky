import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { BIRTH_TYPE_VALUES } from "@prasici/database/constants/birth-type";

export const birthTypeSchema = zEnum(BIRTH_TYPE_VALUES);
export type BirthType = z.infer<typeof birthTypeSchema>;
