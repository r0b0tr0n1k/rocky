import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/_brand";
import { MOVEMENT_TYPE_VALUES } from "../../constants/movement-type";

export const movementTypeEnum = pgEnum(
	"movement_type",
	toPgEnumValues(MOVEMENT_TYPE_VALUES),
);
