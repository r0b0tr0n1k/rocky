import { pgEnum } from "drizzle-orm/pg-core";
import { toPgEnumValues } from "../../constants/_brand";
import { FARM_TYPE_VALUES } from "../../constants/farm-type";

export const farmTypeEnum = pgEnum(
	"farm_type",
	toPgEnumValues(FARM_TYPE_VALUES),
);
