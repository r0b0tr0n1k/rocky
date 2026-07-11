import { createEnumValues } from "./_brand.js"

/**
 * Permission Scope — the RLS/data scope a permission (and `@Policy`) applies to.
 *
 * Canonical SSOT for the `scope` field of seeded permissions and `@Policy`
 * metadata. `ALL` ("*") means unrestricted (cross-org / system-wide).
 */
export const PERMISSION_SCOPE = {
	FARM: "farm",
	ORG: "org",
	ALL: "*",
} as const;

export const PERMISSION_SCOPE_VALUES = createEnumValues([
	PERMISSION_SCOPE.FARM,
	PERMISSION_SCOPE.ORG,
	PERMISSION_SCOPE.ALL,
] as const);
