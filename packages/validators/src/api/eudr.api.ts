// ── EUDR Due-Diligence API Schemas (WO-115, R1 EUDR 2023/1115) ──
//
// Request/response for the movement.eudrDueDiligence query. Defined standalone
// (not reusing the movement-domain type) to avoid a validators -> movement cycle.

import { z } from "zod";

export const eudrDueDiligenceRequestSchema = z.strictObject({
  /** UUID of the animal to run EUDR due-diligence for. */
  animalId: z.uuid("animalId must be a valid UUID"),
}) satisfies z.ZodType<EudrDueDiligenceRequest>;

export interface EudrDueDiligenceRequest {
  animalId: string;
}

export const eudrDueDiligenceResponseSchema = z.object({
    /** All pastures cleared the deforestation cutoff. */
    compliant: z.boolean(),
    /** eudr.enabled was false — due-diligence skipped, treated as compliant. */
    skipped: z.boolean(),
    /** Deforestation cutoff date (ISO) used, or null when skipped. */
    cutoff: z.string().nullable(),
    animalId: z.string(),
    /** Number of pasture declarations the animal grazed. */
    pasturesChecked: z.number(),
    /** Number of PASTURE_BOUNDARY geofences evaluated. */
    geofencesChecked: z.number(),
    breaches: z.array(
      z.object({
        pastureId: z.string().nullable(),
        geofenceId: z.string().nullable(),
        reason: z.enum([
          "missing_polygon",
          "missing_cadastral",
          "no_deforestation_proof",
          "deforested_after_cutoff",
        ]),
        detail: z.string().optional(),
      }),
    ),
  }) satisfies z.ZodType<EudrDueDiligenceResponse>;

export interface EudrDueDiligenceResponse {
  compliant: boolean;
  skipped: boolean;
  cutoff: string | null;
  animalId: string;
  pasturesChecked: number;
  geofencesChecked: number;
  breaches: Array<{
    pastureId: string | null;
    geofenceId: string | null;
    reason: "missing_polygon" | "missing_cadastral" | "no_deforestation_proof" | "deforested_after_cutoff";
    detail?: string;
  }>;
}
