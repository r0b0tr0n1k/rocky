import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { MOVEMENT_TYPE_VALUES } from "@prasici/database/constants/movement-type";

export const movementTypeSchema = zEnum(MOVEMENT_TYPE_VALUES);
export type MovementType = z.infer<typeof movementTypeSchema>;
