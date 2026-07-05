import { createEnumValues } from "./_brand"

export const ARCHIVE_LOCATION = {
	CPC: "cpc",
	VS: "vs",
	VI: "vi",
	BIP: "bip",
} as const;

export const ARCHIVE_LOCATION_VALUES = createEnumValues([
	ARCHIVE_LOCATION.CPC,
	ARCHIVE_LOCATION.VS,
	ARCHIVE_LOCATION.VI,
	ARCHIVE_LOCATION.BIP,
] as const);
