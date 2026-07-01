import type { z } from "zod";
import { zEnum } from "./_enum-helper";
import { ANIMAL_STATUS_VALUES } from "@prasici/database/constants/animal-status";

export const animalStatusSchema = zEnum(ANIMAL_STATUS_VALUES);
export type AnimalStatus = z.infer<typeof animalStatusSchema>;
