// ── Animal Registration Validators ──
// Business rules from:
//   FS - registration_MK(v0.91).pdf §Data validation and business rules (p13-15)
//   Workflow 17-04-03.pdf §Instance 8-10
//   TPC_PDA_v1_2.pdf §2.4-2.5

import { z } from "zod";
import { Sex, BirthType, AnimalStatus } from "../enums";
import { earTagSchema, farmIdSchema } from "../utils/check-digit";

// ============================================================================
// SYSTEM PARAMETERS (retrieved from DB at runtime)
// ============================================================================
export interface RegistrationParams {
	minMotherAgeMonths: number; // default: 17
	calvingPeriodDays: number; // default: 365
	birthNotificationDays: number; // default: 7
	taggingDeadlineDays: number; // default: 20
	slaughterMinAgeDays: number; // default: 25
}

export const defaultParams: RegistrationParams = {
	minMotherAgeMonths: 17,
	calvingPeriodDays: 365,
	birthNotificationDays: 7,
	taggingDeadlineDays: 20,
	slaughterMinAgeDays: 25,
};

// ============================================================================
// NORMAL REGISTRATION (Legacy §Business rules for "normal" registration)
// Business rules:
//   1. User must have privilege for farm
//   2. Registration date cannot be in future
//   3. State/ear tag must be valid
//   4. Mother must be alive at time of birth
//   5. Mother must be ≥ 17 months old (system param)
//   6. Calving interval ≥ calving_period (system param)
//   7. Mother cannot be the animal itself
//   8. Mother cannot be male
//   9. Father cannot be female
//   10. At time of birth, mother must be on the farm
// ============================================================================

export const normalRegistrationSchema = z.object({
	farmId: farmIdSchema,
	earTag: earTagSchema,
	birthDate: z
		.date()
		.refine((d) => d <= new Date(), "Birth date cannot be in the future"),
	sex: Sex,
	breed: z.string().min(1).max(50),

	// Mother (optional, validated if present)
	motherEarTag: earTagSchema.optional(),
	motherOnFarm: z.boolean().optional(),

	// Father (optional)
	fatherEarTag: earTagSchema.optional(),

	// Insemination data (from legacy forms)
	inseminationDocNumber: z.string().max(50).optional(),
	inseminationDate: z.date().optional(),

	// Tagging data
	markerId: z.string().max(50).optional(),
	markingDate: z.date().optional(),

	// Import data (optional)
	importCountry: z.string().length(3).optional(),
	importDate: z.date().optional(),
});

export type NormalRegistrationInput = z.infer<typeof normalRegistrationSchema>;

/** Apply all business rules for normal registration */
export function applyRegistrationRules(
	input: NormalRegistrationInput,
	params: RegistrationParams = defaultParams,
) {
	const rules: { name: string; passed: boolean; message?: string }[] = [];

	// Rule: Mother cannot be the same animal
	if (input.motherEarTag && input.motherEarTag === input.earTag) {
		rules.push({
			name: "mother_cannot_be_self",
			passed: false,
			message: "Mother animal cannot be the same as the registered animal",
		});
	}

	// Rule: Mother cannot be male (checked at DB query time)
	// Rule: Father cannot be female (checked at DB query time)

	// Rule: Calving interval (checked with last calving date from DB)
	// Rule: Mother age (checked with mother birth date from DB)

	return rules;
}

// ============================================================================
// STILLBORN / DEATH REGISTRATION
// Legacy §Business rules for death/stillborn (p14)
// Decision tree determines which scenario: registered, unregistered, stillborn
// ============================================================================

const deathTypeEnum = z.enum([
	"DEATH_REGISTERED",
	"DEATH_UNREGISTERED",
	"DEATH_UNREGISTERED_IMPORT",
	"STILLBORN",
	"DEATH_AFTER_BIRTH",
]);

export const deathRegistrationSchema = z.object({
	farmId: farmIdSchema,
	deathFarmId: farmIdSchema.optional(), // Where carcass was taken

	// Animal identification (optional for unregistered)
	earTag: earTagSchema.optional(),
	stateCode: z.string().length(2).default("MK"),

	// Dates
	deathDate: z.date(),
	birthDate: z.date().optional(),

	// Animal info
	sex: Sex,
	breed: z.string().min(1).max(50),

	// Mother (mandatory for stillborn)
	motherEarTag: earTagSchema.optional(),

	// Father (optional)
	fatherEarTag: earTagSchema.optional(),

	// Import (optional)
	importCountry: z.string().length(3).optional(),
	importDate: z.date().optional(),
});

/** Determine which death scenario applies */
export function determineDeathScenario(
	input: z.infer<typeof deathRegistrationSchema>,
	existingAnimal: boolean,
	importData: boolean,
	params: RegistrationParams = defaultParams,
): z.infer<typeof deathTypeEnum> {
	if (!input.earTag || !existingAnimal) {
		if (!input.birthDate) return "STILLBORN";
		const daysSinceBirth = Math.abs(
			(input.deathDate.getTime() - input.birthDate.getTime()) /
				(1000 * 60 * 60 * 24),
		);
		if (daysSinceBirth <= 25) return "DEATH_AFTER_BIRTH";
		return "DEATH_UNREGISTERED";
	}
	if (existingAnimal) return "DEATH_REGISTERED";
	return "DEATH_UNREGISTERED_IMPORT";
}

// ============================================================================
// SLAUGHTER REGISTRATION
// Legacy §Business rules - slaughtering (p15)
// Rules:
//   1. Animal cannot be slaughtered < 25 days old (system param)
//   2. Arrival can overrun departure within ±2 days
// ============================================================================

export const slaughterSchema = z
	.object({
		// Animal (optional for imported unregistered)
		earTag: earTagSchema.optional(),

		// Farms
		fromFarmId: farmIdSchema.optional(),
		toFarmId: farmIdSchema, // Slaughterhouse (required)

		// Dates
		arrivalDate: z.date(),
		slaughterDate: z.date(),

		// Slaughter data
		slaughterNumber: z.string().max(50),
		massType: z.enum(["LIVE_WEIGHT", "WARM_HALVES"]),
		mass: z.number().positive(),

		// Import (optional)
		importCountry: z.string().length(3).optional(),
		importDate: z.date().optional(),
	})
	.refine((data) => data.slaughterDate >= data.arrivalDate, {
		message: "Slaughter date must be after or on arrival date",
	});

export type SlaughterInput = z.infer<typeof slaughterSchema>;

// ============================================================================
// BIRTH NOTIFICATION
// Legacy §Instance no. 8: Notification of births (Workflow p14)
// "Keeper communicates birth within 7 days. Tagging within 20 days."
// ============================================================================

export const birthNotificationSchema = z.object({
	farmId: farmIdSchema,
	notificationDate: z
		.date()
		.refine(
			(d) => d <= new Date(),
			"Notification date cannot be in the future",
		),
	expectedBirthDate: z.date().optional(),
	actualBirthDate: z.date().optional(),
	motherEarTag: earTagSchema.optional(),
	numberOfCalves: z.number().int().min(1).max(5).default(1),
	notes: z.string().max(500).optional(),
});

export type BirthNotificationInput = z.infer<typeof birthNotificationSchema>;

// ============================================================================
// PASTURE DECLARATION
// Legacy §Pasture (p11)
// Types: MOUNTAIN (seasonal), VILLAGE (daily)
// ============================================================================

export const pastureDeclarationSchema = z
	.object({
		fromFarmId: farmIdSchema,
		toFarmId: farmIdSchema,
		departureDate: z.date(),
		expectedReturnDate: z.date(),
		pastureType: z.enum(["MOUNTAIN", "VILLAGE"]),
		animalEarTags: z.array(earTagSchema).min(1).max(500),
	})
	.refine((data) => data.expectedReturnDate > data.departureDate, {
		message: "Return date must be after departure date",
	})
	.refine(
		(data) => {
			if (data.pastureType === "MOUNTAIN") {
				const days = Math.abs(
					(data.expectedReturnDate.getTime() - data.departureDate.getTime()) /
						(1000 * 60 * 60 * 24),
				);
				return days >= 30 && days <= 180;
			}
			return true;
		},
		{ message: "Mountain pasture must be between 30 and 180 days" },
	);

export type PastureDeclarationInput = z.infer<typeof pastureDeclarationSchema>;
