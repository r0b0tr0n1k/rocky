import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { CONTINGENT_TYPE_VALUES } from "@prasici/database/constants/contingent-type";

export const contingentTypeSchema = zEnum(CONTINGENT_TYPE_VALUES);
export type ContingentType = z.infer<typeof contingentTypeSchema>;
