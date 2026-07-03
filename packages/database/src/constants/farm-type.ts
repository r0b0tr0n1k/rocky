import { createEnumValues } from "./_brand.js"

export const FARM_TYPE = {
	FARM: "farm",
	SLAUGHTERHOUSE: "slaughterhouse",
	LIVESTOCK_MARKET: "livestock_market",
	PASTURE_MOUNTAIN: "pasture_mountain",
	PASTURE_VILLAGE: "pasture_village",
	BIP: "bip",
	TRADER_YARD: "trader_yard",
	QUARANTINE: "quarantine",
	OTHER: "other",
} as const;

export const FARM_TYPE_VALUES = createEnumValues([
	FARM_TYPE.FARM,
	FARM_TYPE.SLAUGHTERHOUSE,
	FARM_TYPE.LIVESTOCK_MARKET,
	FARM_TYPE.PASTURE_MOUNTAIN,
	FARM_TYPE.PASTURE_VILLAGE,
	FARM_TYPE.BIP,
	FARM_TYPE.TRADER_YARD,
	FARM_TYPE.QUARANTINE,
	FARM_TYPE.OTHER,
] as const);
