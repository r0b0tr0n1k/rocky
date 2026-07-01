// ── AIMCS Zod 4 Enums ──
// Complete enum definitions for the modern animal I&R system
// Source: Legacy Oracle Designer schemas (SM, HK, ET, AN) + modern additions

import { z } from "zod";

// ============================================================================
// SYSTEM MANAGEMENT ENUMS
// ============================================================================

export const UserStatus = z.enum([
	"ACTIVE",
	"INACTIVE",
	"BLOCKED",
	"PENDING_VERIFICATION",
]);
export type UserStatus = z.infer<typeof UserStatus>;

export const RoleName = z.enum([
	"SUPER_ADMIN",
	"VD_ADMIN",
	"VD_STAFF",
	"VS_MANAGER",
	"VETERINARIAN",
	"TECHNICIAN",
	"SUPPLIER",
	"FARMER",
	"INSPECTOR",
	"SLAUGHTERHOUSE_OP",
	"MARKET_OP",
	"REPORT_VIEWER",
]);
export type RoleName = z.infer<typeof RoleName>;

export const PermissionAction = z.enum([
	"CREATE",
	"READ",
	"UPDATE",
	"DELETE",
	"APPROVE",
	"REJECT",
	"CONFIRM",
	"CANCEL",
]);
export type PermissionAction = z.infer<typeof PermissionAction>;

export const ResourceType = z.enum([
	"FARM",
	"SUBJECT",
	"ANIMAL",
	"MOVEMENT",
	"EARTAG",
	"BIRTH",
	"SLAUGHTER",
	"INSPECTION",
	"RISK_ANALYSIS",
	"USER",
	"ROLE",
	"ORGANIZATION",
	"CODE_TABLE",
	"SYSTEM_PARAM",
	"REPORT",
	"AUDIT_LOG",
]);
export type ResourceType = z.infer<typeof ResourceType>;

export const OrganizationType = z.enum([
	"VD",
	"VS",
	"SLAUGHTERHOUSE",
	"LIVESTOCK_MARKET",
	"BIP",
	"PASTURE",
	"TRADER",
	"SUPPLIER",
	"FARM",
]);
export type OrganizationType = z.infer<typeof OrganizationType>;

export const ModuleName = z.enum([
	"HOLDINGS",
	"KEEPERS",
	"ANIMALS",
	"MOVEMENTS",
	"EARTAGS",
	"BIRTHS",
	"SLAUGHTER",
	"PASTURE",
	"INSPECTIONS",
	"RISK_ANALYSIS",
	"REPORTS",
	"SYSTEM",
	"SYNC",
	"AUDIT",
]);
export type ModuleName = z.infer<typeof ModuleName>;

export const LanguageCode = z.enum(["MK", "EN", "SQ", "SR"]);
export type LanguageCode = z.infer<typeof LanguageCode>;

export const CodeTableScope = z.enum([
	"GLOBAL",
	"ORGANIZATION",
	"REGION",
	"USER",
]);
export type CodeTableScope = z.infer<typeof CodeTableScope>;

export const AuditAction = z.enum([
	"CREATED",
	"UPDATED",
	"DELETED",
	"VERIFIED",
	"APPROVED",
	"REJECTED",
	"ARCHIVED",
	"RESTORED",
	"IMPORTED",
	"EXPORTED",
	"SYNCED",
]);
export type AuditAction = z.infer<typeof AuditAction>;

// ============================================================================
// HOLDER KEEPER ENUMS
// ============================================================================

export const VerificationStatus = z.enum([
	"DRAFT",
	"PENDING_VD_APPROVAL",
	"APPROVED",
	"REJECTED",
	"ARCHIVED",
]);
export type VerificationStatus = z.infer<typeof VerificationStatus>;

export const FarmType = z.enum([
	"FARM",
	"SLAUGHTERHOUSE",
	"LIVESTOCK_MARKET",
	"PASTURE_MOUNTAIN",
	"PASTURE_VILLAGE",
	"BIP",
	"TRADER_YARD",
	"QUARANTINE",
	"OTHER",
]);
export type FarmType = z.infer<typeof FarmType>;

export const SubjectRole = z.enum([
	"OWNER",
	"KEEPER",
	"VETERINARIAN",
	"TRADER",
	"SLAUGHTERHOUSE_OP",
	"MARKET_OP",
	"TECHNICIAN",
	"GUARDIAN",
]);
export type SubjectRole = z.infer<typeof SubjectRole>;

export const DataSource = z.enum([
	"AIMCS",
	"HK_IMP",
	"HK_PDA",
	"MOBILE",
	"API",
	"BATCH",
]);
export type DataSource = z.infer<typeof DataSource>;

// ============================================================================
// ANIMALS & MOVEMENTS ENUMS
// ============================================================================

export const Sex = z.enum(["MALE", "FEMALE"]);
export type Sex = z.infer<typeof Sex>;

export const AnimalStatus = z.enum([
	"ALIVE",
	"DEAD",
	"SLAUGHTERED",
	"SOLD",
	"EXPORTED",
	"IMPORTED",
	"MISSING",
	"STILLBORN",
]);
export type AnimalStatus = z.infer<typeof AnimalStatus>;

export const MovementType = z.enum([
	"SALE",
	"PURCHASE",
	"MARKET_SALE",
	"MARKET_PURCHASE",
	"TRANSFER",
	"BIRTH_REGISTRATION",
	"DEATH",
	"HOME_SLAUGHTER",
	"SLAUGHTERHOUSE",
	"PASTURE_DEPARTURE",
	"PASTURE_RETURN",
	"IMPORT",
	"EXPORT",
	"ALPINE_DEPARTURE",
	"ALPINE_RETURN",
	"CORRECTION",
]);
export type MovementType = z.infer<typeof MovementType>;

export const BirthType = z.enum(["SINGLE", "TWIN", "TRIPLET", "STILLBORN"]);
export type BirthType = z.infer<typeof BirthType>;

export const BirthNotificationStatus = z.enum([
	"PENDING",
	"VISITED",
	"TAGGED",
	"COMPLETED",
	"OVERDUE",
	"CANCELLED",
]);
export type BirthNotificationStatus = z.infer<typeof BirthNotificationStatus>;

// ============================================================================
// EAR TAG ENUMS
// ============================================================================

export const EarTagStatus = z.enum([
	"NEW",
	"AVAILABLE",
	"ORDERED",
	"COLLECTED",
	"DELIVERED",
	"APPLIED",
	"CANCELLED",
	"WITHDRAWN",
	"LOST",
	"DESTROYED",
]);
export type EarTagStatus = z.infer<typeof EarTagStatus>;

export const OrderType = z.enum(["NEW_TAGS", "DUPLICATE_TAGS"]);
export type OrderType = z.infer<typeof OrderType>;

export const ContingentType = z.enum(["SUPPLIER", "VD", "VS"]);
export type ContingentType = z.infer<typeof ContingentType>;

export const OrderStatus = z.enum([
	"PENDING",
	"COLLECTED",
	"DELIVERED",
	"PARTIALLY_DELIVERED",
	"CANCELLED",
	"COMPLETED",
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const DuplicateType = z.enum(["SINGLE", "PAIR"]);
export type DuplicateType = z.infer<typeof DuplicateType>;

// ============================================================================
// RISK ANALYSIS ENUMS
// ============================================================================

export const RiskScore = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RiskScore = z.infer<typeof RiskScore>;

export const AnalysisSchedule = z.enum([
	"DAILY",
	"WEEKLY",
	"MONTHLY",
	"QUARTERLY",
	"ANNUAL",
	"ON_DEMAND",
]);
export type AnalysisSchedule = z.infer<typeof AnalysisSchedule>;

// ============================================================================
// INSPECTION ENUMS
// ============================================================================

export const InspectionResult = z.enum([
	"PASS",
	"PASS_WITH_CONDITIONS",
	"FAIL",
	"PENDING_REVIEW",
]);
export type InspectionResult = z.infer<typeof InspectionResult>;

export const InspectionType = z.enum([
	"ROUTINE",
	"TARGETED",
	"FOLLOW_UP",
	"COMPLAINT",
	"IMPORT_CHECK",
	"EXPORT_CHECK",
]);
export type InspectionType = z.infer<typeof InspectionType>;

// ============================================================================
// ENUM REGISTRY — for dynamic DB queries & UI generation
// ============================================================================

/** All enums indexed by name for dynamic access (admin UI, code table editor) */
export const enumRegistry = {
	UserStatus,
	RoleName,
	PermissionAction,
	ResourceType,
	OrganizationType,
	ModuleName,
	LanguageCode,
	VerificationStatus,
	FarmType,
	SubjectRole,
	DataSource,
	Sex,
	AnimalStatus,
	MovementType,
	BirthType,
	BirthNotificationStatus,
	EarTagStatus,
	OrderType,
	ContingentType,
	OrderStatus,
	DuplicateType,
	RiskScore,
	AnalysisSchedule,
	InspectionResult,
	InspectionType,
	AuditAction,
} as const;

/** Get enum values as string array for DB enum creation */
export function getEnumValues(name: keyof typeof enumRegistry): string[] {
	const e = enumRegistry[name];
	// Zod 4: enum values are in the options array
	if ("options" in e._def) {
		return (e._def as { options: string[] }).options;
	}
	return [];
}

/** Count of all enums */
export const ENUM_COUNT = Object.keys(enumRegistry).length; // 26 enums
