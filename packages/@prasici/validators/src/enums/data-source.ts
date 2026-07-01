import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { DATA_SOURCE_VALUES } from "@prasici/database/constants/data-source";

export const dataSourceSchema = zEnum(DATA_SOURCE_VALUES);
export type DataSource = z.infer<typeof dataSourceSchema>;
