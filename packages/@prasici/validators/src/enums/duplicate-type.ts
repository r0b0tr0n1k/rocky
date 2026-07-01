import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { DUPLICATE_TYPE_VALUES } from "@prasici/database/constants/duplicate-type";

export const duplicateTypeSchema = zEnum(DUPLICATE_TYPE_VALUES);
export type DuplicateType = z.infer<typeof duplicateTypeSchema>;
