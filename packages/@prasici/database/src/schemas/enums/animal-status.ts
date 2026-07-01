import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/_brand";
import { ANIMAL_STATUS_VALUES } from "../../constants/animal-status";

export const animalStatusEnum = pgEnum(
	"animal_status",
	toPgEnumValues(ANIMAL_STATUS_VALUES),
);
