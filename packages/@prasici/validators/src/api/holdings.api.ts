// ── Holdings (Farm) & Keepers (Subject) Validators ──
// Business rules from:
//   FS - HK_MK(v1.0).pdf §Processes (p3-4)
//   Workflow 17-04-03.pdf §Instance 1-3
//   HK.PDF — Table hierarchy: States → Zip → Address → Farm → Subject → KMG_SUBJ

import { z } from "zod";
import {
	VerificationStatus,
	FarmType,
	SubjectRole,
	DataSource,
} from "../enums";

// ============================================================================
// ADDRESS INPUT (with GPS auto-fill — replaces legacy drill-down hierarchy)
// Legacy: States → Zip Codes → Addresses mandatory drill-down
// Modern: GPS reverse-geocoding auto-fills the hierarchy
// ============================================================================

export const addressInputSchema = z.object({
	// Manual fields (fallback when GPS unavailable)
	city: z.string().min(1).max(30),
	street: z.string().max(50).optional(),
	houseNumber: z.string().max(10),
	houseNumberAdd: z.string().max(5).optional(),

	// Foreign keys (auto-resolved from GPS)
	zipCodeId: z.string().uuid().optional(),
	zipCodeName: z.string().max(50).optional(),
	communeId: z.string().uuid().optional(),
	adminUnitId: z.string().uuid().optional(),

	// GPS coordinates (modern replacement for X/Y/Z)
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
	accuracy: z.number().positive().max(10000).optional(),
});

export type AddressInput = z.infer<typeof addressInputSchema>;

// ============================================================================
// GPS AUTO-FILL VALIDATION
// ============================================================================

export const gpsCoordinateSchema = z.object({
	latitude: z.number().min(40.5).max(42.5), // Macedonia bounds
	longitude: z.number().min(20.5).max(23.5),
	accuracy: z.number().positive().max(50).optional(),
});

// ============================================================================
// FARM INPUT
// ============================================================================

export const farmInputSchema = z.object({
	// Auto-generated if not provided (from centralized sequence)
	farmId: z.string().length(9).optional(),

	// Basic info
	name: z.string().max(50).optional(),
	type: FarmType.default("FARM"),

	// Hierarchy
	parentFarmId: z.string().uuid().optional(),

	// Address (GPS-powered)
	address: addressInputSchema,
	location: gpsCoordinateSchema.optional(),

	// Field capture
	digitalSignature: z.string().optional(), // base64
	signatureCapturedAt: z.date().optional(),
	photoUrl: z.string().url().optional(),

	// Source
	dataSource: DataSource.default("MOBILE"),
});

export type FarmInput = z.infer<typeof farmInputSchema>;

// ============================================================================
// SUBJECT INPUT (Keeper/Holder)
// ============================================================================

export const subjectInputSchema = z.object({
	// Names (dual language support — legacy FIRST_NAME / FIRST_NAME_1 pattern)
	shortName: z.string().min(1).max(50),
	shortNameAlt: z.string().max(50).optional(),

	firstName: z.string().max(50).optional(),
	firstNameAlt: z.string().max(50).optional(),
	lastName: z.string().max(50).optional(),
	lastNameAlt: z.string().max(50).optional(),

	// Organization (when subject is a company)
	companyName: z.string().max(100).optional(),

	// IDs
	personalId: z.string().max(20).optional(),
	vatNumber: z.string().max(20).optional(),

	// Contact
	phoneNumber: z.string().max(30),
	email: z.string().email().optional(),

	// Address (use same or different from farm)
	addressId: z.string().uuid().optional(),
});

export type SubjectInput = z.infer<typeof subjectInputSchema>;

// ============================================================================
// FARM-SUBJECT BINDING (replaces HK_KMG_SUBJ)
// Legacy: "Holder Keeper on Farm" relationship with role
// ============================================================================

export const farmSubjectBindingSchema = z.object({
	farmId: z.string().uuid(),
	subjectId: z.string().uuid(),
	role: SubjectRole,

	// Temporal (role can be time-limited)
	validFrom: z.date().optional(),
	validTo: z.date().optional(),
});

export type FarmSubjectBinding = z.infer<typeof farmSubjectBindingSchema>;

// ============================================================================
// COMBINED HK + FARM REGISTRATION WIZARD
// Modern: Treats Holder + Farm as a single logical unit during registration
// Legacy §FS - HK_MK(v1.0).pdf: "PDA → temporary tables → VD paper confirmation"
// Modern: Single wizard → PENDING_VD_APPROVAL status
// ============================================================================

export const hkFarmRegistrationSchema = z.object({
	// Step 1: Subject (Holder/Keeper)
	subject: subjectInputSchema,

	// Step 2: Farm (with GPS address)
	farm: farmInputSchema,

	// Step 3: Role binding
	role: SubjectRole.default("OWNER"),

	// Step 4: Digital declaration
	declarationConfirmed: z
		.boolean()
		.refine(
			(v): v is true => v === true,
			"You must confirm that the data is correct",
		),

	// Metadata
	source: DataSource.default("MOBILE"),
	createdAt: z.date().optional(),
});

export type HkFarmRegistration = z.infer<typeof hkFarmRegistrationSchema>;

// ============================================================================
// EXISTING HK DATA CORRECTION
// Legacy §FS - HK_MK(v1.0).pdf p3-4: "Changes → PDA → temp tables → VD confirms"
// Modern: Direct correction with audit trail + VD approval workflow
// ============================================================================

export const hkCorrectionSchema = z.object({
	recordType: z.enum(["FARM", "SUBJECT", "FARM_SUBJECT"]),
	recordId: z.string().uuid(),
	changes: z
		.record(z.string(), z.unknown())
		.refine(
			(obj) => Object.keys(obj).length > 0,
			"At least one field must be changed",
		),
	reason: z.string().min(1).max(500),
	digitalSignature: z.string().optional(),

	// VD confirmation
	confirmationToken: z.string().uuid().optional(),
});

export type HkCorrection = z.infer<typeof hkCorrectionSchema>;

// ============================================================================
// VERIFICATION STATUS WORKFLOW (replaces temp tables)
// ============================================================================

export const verificationActionSchema = z
	.object({
		recordId: z.string().uuid(),
		recordType: z.enum(["FARM", "SUBJECT", "ADDRESS"]),
		action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]),
		note: z.string().max(500).optional(),

		// For REJECT — all rejected records must include a reason
		reason: z.string().min(1).max(500).optional(),
	})
	.refine(
		(data) => {
			if (data.action === "REJECT" && !data.reason) {
				return false;
			}
			return true;
		},
		{ message: "Rejection requires a reason" },
	);

export type VerificationAction = z.infer<typeof verificationActionSchema>;

// ============================================================================
// DATA IMPORT FROM LEGACY (flat file import)
// Legacy §FS - HK_MK(v1.0).pdf: "Flat files → temporary tables → real tables"
// ============================================================================

export const legacyImportSchema = z.object({
	source: z.enum(["HK_IMP", "HK_PDA"]),
	filename: z.string().min(1).max(200),
	records: z.array(z.record(z.string(), z.unknown())).min(1).max(10000),
	importDate: z.date().default(() => new Date()),
	importedBy: z.string().uuid().optional(),
});

export type LegacyImport = z.infer<typeof legacyImportSchema>;
