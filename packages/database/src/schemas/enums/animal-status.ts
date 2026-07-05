import { pgEnum } from "drizzle-orm/pg-core";
import { ANIMAL_STATUS_VALUES } from "../../constants/animal-status.js";
import { toPgEnumValues } from "../../constants/index.js";

export const animalStatusPgEnum = pgEnum("animal_status", toPgEnumValues(ANIMAL_STATUS_VALUES));
