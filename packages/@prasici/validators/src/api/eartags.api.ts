// ── Ear Tag Validators ──
// Business rules from:
//   FS - eartags_MK(v1.0).pdf §Data validation and business rules (p6-7)
//   Workflow 17-04-03.pdf §Instance 4-7
//   Eartags.PDF — ET schema: Contingents, Orders, Inventory, Takeovers

import { z } from "zod";
import {
	EarTagStatus,
	ContingentType,
	DuplicateType,
	OrderStatus,
} from "../enums";

// ============================================================================
// EAR TAG NUMBER GENERATION
// Legacy: "8 digits where last digit is check digit"
// Legacy: "Starting from 10000001"
// ============================================================================

export const generateTagsSchema = z.object({
	count: z.number().int().min(1).max(10000),
	description: z.string().max(200).optional(),
	contingentType: ContingentType.default("VD"),
});

export type GenerateTagsInput = z.infer<typeof generateTagsSchema>;

// ============================================================================
// SUPPLIER CONTINGENT
// Legacy §FS - eartags_MK(v1.0).pdf p3: "Defining supplier contingent"
// ============================================================================

export const supplierContingentSchema = z.object({
	supplierId: z.string().uuid(),
	tagCount: z.number().int().min(100).max(100000),
	description: z.string().max(200).optional(),
});

export type SupplierContingentInput = z.infer<typeof supplierContingentSchema>;

// ============================================================================
// NEW TAGS ORDER
// Legacy §FS - eartags_MK(v1.0).pdf p3: "Placing order for new eartags"
// Rules:
//   1. 120-day gap between orders (system param)
//   2. Max 4 orders per year (system param)
//   3. Quantity based on: female_count - remaining_from_prev_orders
// ============================================================================

export const newTagsOrderSchema = z
	.object({
		supplierId: z.string().uuid(),
		quantity: z.number().int().min(1).max(500),
		farmId: z.string().length(9).optional(),
		farmIdOptional: z
			.boolean()
			.default(false)
			.describe("If true, farm ID is not required"),
	})
	.refine((data) => data.quantity <= 500, {
		message: "Maximum 500 ear tags per order",
	});

export type NewTagsOrderInput = z.infer<typeof newTagsOrderSchema>;

/** Calculate allowed order quantity based on farm's female count */
export function calculateOrderQuantity(
	femaleAnimalCount: number,
	remainingFromPrevOrders: number,
): number {
	return Math.max(0, femaleAnimalCount - remainingFromPrevOrders);
}

// ============================================================================
// DUPLICATE TAGS ORDER
// Legacy §FS - eartags_MK(v1.0).pdf p4: "Placing order for duplicate eartags"
// ============================================================================

export const duplicateTagItemSchema = z.object({
	earTagNumber: z.string().regex(/^\d{8}$/),
	state: z.string().length(2).default("MK"),
	duplicateType: DuplicateType,
	description: z.string().max(200).optional(),
});

export const duplicateTagsOrderSchema = z.object({
	supplierId: z.string().uuid(),
	earTags: z.array(duplicateTagItemSchema).min(1).max(50),
	farmId: z.string().length(9).optional(),
	addressOverride: z.string().max(200).optional(),
	addToExistingOrderId: z.string().uuid().optional(),
});

export type DuplicateTagsOrderInput = z.infer<typeof duplicateTagsOrderSchema>;

// ============================================================================
// ORDER STATUS MANAGEMENT
// Legacy: NEW → AVAILABLE → COLLECTED → DELIVERED → CANCELLED
// Modern: PENDING → COLLECTED → DELIVERED → COMPLETED / CANCELLED
// ============================================================================

export const orderStatusTransitionSchema = z
	.object({
		orderId: z.string().uuid(),
		newStatus: OrderStatus,
		note: z.string().max(200).optional(),
		// Required for DELIVERED
		deliveryConfirmedById: z.string().uuid().optional(),
		deliveryDate: z.date().optional(),
	})
	.refine(
		(data) => {
			if (data.newStatus === "DELIVERED" || data.newStatus === "COMPLETED") {
				return !!data.deliveryDate;
			}
			return true;
		},
		{ message: "Delivery date is required for DELIVERED/COMPLETED status" },
	);

export type OrderStatusTransition = z.infer<typeof orderStatusTransitionSchema>;

// ============================================================================
// EAR TAG TAKEOVER / DISTRIBUTION
// Legacy §Eartags.PDF: ET_TAKEOVERS table
// ============================================================================

export const earTagTakeoverSchema = z.object({
	organizationId: z.string().uuid(),
	takeoverType: z.enum(["INITIAL_ALLOCATION", "ROUTINE_ALLOCATION", "RETURN"]),
	tagCount: z.number().int().min(1).max(10000),
	notes: z.string().max(200).optional(),
});

export type EarTagTakeoverInput = z.infer<typeof earTagTakeoverSchema>;
