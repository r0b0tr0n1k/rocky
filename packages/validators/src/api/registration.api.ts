// ── Animal Registration Validators ──
// Business rules from:
//   FS - registration_MK(v0.91).pdf §Data validation and business rules (p13-15)
//   Workflow 17-04-03.pdf §Instance 8-10
//   TPC_PDA_v1_2.pdf §2.4-2.5

import { z } from "zod";
import { sexSchema as SexZ } from "../enums/index.js";
import { earTagSchema, farmIdSchema } from "../utils/check-digit.js";
import type { NoDrift, ActivateGuillotines } from "../utils/type-bridge.js";

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

export type NormalRegistrationInput = z.infer<typeof normalRegistrationSchema>;

export const normalRegistrationSchema = z.strictObject({
  farmId: farmIdSchema,
  earTag: earTagSchema,
  birthDate: z
    .coerce.date<string>()
    .refine((d) => d <= new Date(), "Birth date cannot be in the future"),
  sex: SexZ,
  breed: z.string().min(1).max(50),

  // Mother (optional, validated if present)
  motherEarTag: earTagSchema.optional(),
  motherOnFarm: z.boolean().optional(),

  // Father (optional)
  fatherEarTag: earTagSchema.optional(),

  // Insemination data (from legacy forms)
  inseminationDocNumber: z.string().max(50).optional(),
  inseminationDate: z.coerce.date<string>().optional(),

  // Tagging data
  markerId: z.string().max(50).optional(),
  markingDate: z.coerce.date<string>().optional(),

  // Import data (optional)
  importCountry: z.string().length(3).optional(),
  importDate: z.coerce.date<string>().optional(),
});

// ═══════════════════════════════════════════════════════════════
// GUILLOTINE ACTIVATION (Tier 2 + Tier 3)
// ═══════════════════════════════════════════════════════════════

type _drift_normalRegistration = NoDrift<z.infer<typeof normalRegistrationSchema>, NormalRegistrationInput>;

export type _RegistrationGuillotines = ActivateGuillotines<
  [ _drift_normalRegistration ]
>;

