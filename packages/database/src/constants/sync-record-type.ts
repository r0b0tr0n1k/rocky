import { createEnumValues } from "./_brand.js"

/**
 * Sync Upload Record Type — discriminates what kind of PDA-created record a
 * SyncUploadItem carries (WO-081 offline-first sync).
 *
 * This is the canonical SSOT for `SyncUploadItemType` (validators/src/api/sync.api.ts).
 * Values intentionally overlap with domain enums (HEALTH_RECORD_TYPE, FARM_TYPE)
 * because a sync item may wrap a health sub-record or a farm record, but the
 * *discriminator* is its own closed union and must not be quoted inline.
 */
export const SYNC_RECORD_TYPE = {
	VACCINATION: "vaccination",
	TREATMENT: "treatment",
	LAB_TEST: "labTest",
	ANIMAL: "animal",
	FARM: "farm",
	MOVEMENT: "movement",
	INSPECTION: "inspection",
	EAR_TAG: "earTag",
} as const;

export const SYNC_RECORD_TYPE_VALUES = createEnumValues([
	SYNC_RECORD_TYPE.VACCINATION,
	SYNC_RECORD_TYPE.TREATMENT,
	SYNC_RECORD_TYPE.LAB_TEST,
	SYNC_RECORD_TYPE.ANIMAL,
	SYNC_RECORD_TYPE.FARM,
	SYNC_RECORD_TYPE.MOVEMENT,
	SYNC_RECORD_TYPE.INSPECTION,
	SYNC_RECORD_TYPE.EAR_TAG,
] as const);
