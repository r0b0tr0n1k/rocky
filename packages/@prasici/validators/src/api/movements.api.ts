// ── Movement Validators ──
// Business rules from:
//   FS - registration_MK(v0.91).pdf §Arrival, §Business rules (p12-15)
//   TPC_PDA_v1_2.pdf §2.6-2.7
//   Workflow 17-04-03.pdf §Instance 12, 13, 15, 16

import { z } from "zod";
import { MovementType } from "../enums";
import { earTagSchema, farmIdSchema } from "../utils/check-digit";

// ============================================================================
// UNIFIED MOVEMENT (replaces two-phase departure + arrival)
// Legacy "two-phase structure" is collapsed into a single record
// with parentMovementId for multi-leg transactions (markets)
// ============================================================================

export const unifiedMovementSchema = z
	.object({
		// Animal
		animalEarTag: earTagSchema,

		// Movement endpoints
		fromFarmId: farmIdSchema.nullable(),
		toFarmId: farmIdSchema,

		// Type
		movementType: MovementType,

		// Dates
		movementDate: z.date(),
		arrivalDate: z.date().optional(),

		// Multi-leg support
		parentMovementId: z.string().uuid().optional(),
		legOrder: z.number().int().min(0).max(10).optional(),

		// Documentation
		reason: z.string().max(100).optional(),
		documentRef: z.string().max(50).optional(),

		// Death (for DEATH/HOME_SLAUGHTER type)
		deathDate: z.date().optional(),
		deathCause: z.string().max(100).optional(),

		// Import/Export
		importCountry: z.string().length(3).optional(),
		exportCountry: z.string().length(3).optional(),
		breedingState: z.string().length(3).optional(),
		breedingPlaceId: z.string().max(50).optional(),
	})
	.refine(
		(data: {
			movementDate: Date;
			arrivalDate?: Date;
		}): data is {
			movementDate: Date;
			arrivalDate: Date;
		} & Omit<typeof data, "movementDate" | "arrivalDate"> =>
			!data.arrivalDate || data.arrivalDate >= data.movementDate,
		{ message: "Arrival date must be after or on movement date" },
	);

export type UnifiedMovementInput = z.infer<typeof unifiedMovementSchema>;

// ============================================================================
// MARKET MOVEMENT (4-leg automatic)
// Legacy §Instance no. 15 (Workflow p22-23)
// "Creates at least 2 movements: off-holding of seller, on-holding of market"
// Modern: Single transaction creates all 4 legs automatically
// ============================================================================

export const marketMovementSchema = z
	.object({
		sellerFarmId: farmIdSchema,
		buyerFarmId: farmIdSchema,
		marketFarmId: farmIdSchema,
		animalEarTags: z.array(earTagSchema).min(1).max(100),
		marketDate: z.date(),
		saleDate: z.date(),
		purchaseDate: z.date().optional(),
	})
	.refine((data) => data.sellerFarmId !== data.buyerFarmId, {
		message: "Seller and buyer farms must be different",
	})
	.refine(
		(data) => {
			// Home slaughter: buyer is same as market
			if (!data.purchaseDate) return true;
			return data.purchaseDate >= data.saleDate;
		},
		{ message: "Purchase date must be after or on sale date" },
	);

export type MarketMovementInput = z.infer<typeof marketMovementSchema>;

/**
 * Generate all 4 movement legs for a market transaction.
 * Leg 1: Off-holding movement of selling keeper
 * Leg 2: On-holding movement to livestock market
 * Leg 3: Off-holding movement from livestock market
 * Leg 4: On-holding movement to purchasing keeper
 */
export function generateMarketLegs(input: MarketMovementInput) {
	const base = {
		marketDate: input.marketDate,
		saleDate: input.saleDate,
		purchaseDate: input.purchaseDate,
	};

	return input.animalEarTags.flatMap((earTag) => [
		{
			// Leg 1: Seller → Market (off-holding)
			animalEarTag: earTag,
			fromFarmId: input.sellerFarmId,
			toFarmId: input.marketFarmId,
			movementType: "MARKET_SALE" as const,
			movementDate: input.marketDate,
			legOrder: 1,
			...base,
		},
		{
			// Leg 2: Market arrival (on-holding)
			animalEarTag: earTag,
			fromFarmId: input.sellerFarmId,
			toFarmId: input.marketFarmId,
			movementType: "MARKET_PURCHASE" as const,
			movementDate: input.marketDate,
			legOrder: 2,
			...base,
		},
		{
			// Leg 3: Market → Buyer (off-holding)
			animalEarTag: earTag,
			fromFarmId: input.marketFarmId,
			toFarmId: input.buyerFarmId,
			movementType: "MARKET_SALE" as const,
			movementDate: input.purchaseDate ?? input.marketDate,
			legOrder: 3,
			...base,
		},
		{
			// Leg 4: Buyer arrival (on-holding)
			animalEarTag: earTag,
			fromFarmId: input.marketFarmId,
			toFarmId: input.buyerFarmId,
			movementType: "MARKET_PURCHASE" as const,
			movementDate: input.purchaseDate ?? input.marketDate,
			legOrder: 4,
			...base,
		},
	]);
}

// ============================================================================
// ALPINE GRAZING / PASTURE MOVEMENT
// Legacy §Instance no. 16 (Workflow p24)
// "Collective list for off-/on-farm movement of all cattle in grazing area"
// ============================================================================

export const alpineGrazingSchema = z.object({
	personInCharge: z.string().min(1).max(100),
	grazingAreaName: z.string().min(1).max(100),
	grazingAreaFarmId: farmIdSchema,
	homeFarmId: farmIdSchema,
	animalEarTags: z.array(earTagSchema).min(1),
	departureDate: z.date(),
	returnDate: z.date().optional(),
});

export type AlpineGrazingInput = z.infer<typeof alpineGrazingSchema>;

// ============================================================================
// IMPORT / EXPORT MOVEMENTS
// Legacy §Instance 19-21 (Workflow p28-33)
// "Import from EU countries, Import from 3rd countries, Export"
// ============================================================================

export const importMovementSchema = z.object({
	animalEarTag: earTagSchema.optional(), // May not have local tag yet
	countryOfOrigin: z.string().length(3), // ISO 3166-1 alpha-3
	bipId: farmIdSchema, // Border Inspection Post
	destinationFarmId: farmIdSchema,
	importDate: z.date(),
	importPermitNumber: z.string().max(50),
	breedingState: z.string().max(50).optional(),
	breedingPlaceId: z.string().max(50).optional(),
	healthCertificateRef: z.string().max(50).optional(),
});

export type ImportMovementInput = z.infer<typeof importMovementSchema>;

export const exportMovementSchema = z.object({
	animalEarTag: earTagSchema,
	originFarmId: farmIdSchema,
	countryOfDestination: z.string().length(3),
	bipId: farmIdSchema,
	exportDate: z.date(),
	exportPermitNumber: z.string().max(50),
	healthCertificateRef: z.string().max(50).optional(),
});

export type ExportMovementInput = z.infer<typeof exportMovementSchema>;
