// ── EUDR 2023/1115 Due-Diligence (WO-115, R1) ──
//
// Overlays every pasture a cow touched against the deforestation cutoff
// (2020-12-31). The "overlay" is logical: each PASTURE_BOUNDARY geofence must
// carry a declared deforestation-free date <= cutoff. A real satellite/raster
// overlay (WO-119 PostGIS ST_Intersects infra) can later replace the date check
// without changing this gate.

import type { MovementRepository } from "../repositories/movement.repository.js";
import type { GeoRepository } from "@rocky/geo";
import type { RuleSet } from "@rocky/domains-system";
import { FENCE_TYPE } from "@rocky/database/constants";

export type EudrBreachReason =
  | "missing_polygon"
  | "missing_cadastral"
  | "no_deforestation_proof"
  | "deforested_after_cutoff";

export interface EudrBreach {
  pastureId: string | null;
  geofenceId: string | null;
  reason: EudrBreachReason;
  detail?: string;
}

export interface EudrDueDiligenceResult {
  /** All pastures cleared the cutoff. */
  compliant: boolean;
  /** eudr.enabled was false — due-diligence skipped, treated as compliant. */
  skipped: boolean;
  /** Deforestation cutoff date (ISO) used, or null when skipped. */
  cutoff: string | null;
  animalId: string;
  /** Number of pasture declarations the animal grazed. */
  pasturesChecked: number;
  /** Number of PASTURE_BOUNDARY geofences evaluated. */
  geofencesChecked: number;
  breaches: EudrBreach[];
}

/**
 * Pure-ish due-diligence: traverses pasture declarations -> geofences and flags
 * breaches. Split out of MovementService so both the create() gate and the PDF
 * Due-Diligence Statement template can reuse the exact same logic.
 */
export async function runEudrDueDiligence(
  movementRepo: MovementRepository,
  geoRepo: GeoRepository,
  ruleSet: RuleSet,
  animalId: string,
): Promise<EudrDueDiligenceResult> {
  const eudr = ruleSet.eudr;
  if (!eudr?.enabled) {
    return {
      compliant: true,
      skipped: true,
      cutoff: null,
      animalId,
      pasturesChecked: 0,
      geofencesChecked: 0,
      breaches: [],
    };
  }

  const cutoff = eudr.deforestationCutoffDate;
  const declarations = await movementRepo.findPastureDeclarationsByAnimalId(animalId);
  const pastureIds = declarations.map((d: { id: string }) => d.id);
  const geofences = pastureIds.length
    ? await geoRepo.findGeofencesByPastureIds(pastureIds, FENCE_TYPE.PASTURE_BOUNDARY)
    : [];

  const breaches: EudrBreach[] = [];
  for (const g of geofences) {
    if (!g.polygon) {
      breaches.push({ pastureId: g.pastureId ?? null, geofenceId: g.id, reason: "missing_polygon" });
    } else if (!g.cadastralReference) {
      breaches.push({ pastureId: g.pastureId ?? null, geofenceId: g.id, reason: "missing_cadastral" });
    } else if (!g.deforestationFreeSince) {
      breaches.push({ pastureId: g.pastureId ?? null, geofenceId: g.id, reason: "no_deforestation_proof" });
    } else if (new Date(g.deforestationFreeSince) > new Date(cutoff)) {
      breaches.push({
        pastureId: g.pastureId ?? null,
        geofenceId: g.id,
        reason: "deforested_after_cutoff",
        detail: String(g.deforestationFreeSince),
      });
    }
  }

  return {
    compliant: breaches.length === 0,
    skipped: false,
    cutoff,
    animalId,
    pasturesChecked: pastureIds.length,
    geofencesChecked: geofences.length,
    breaches,
  };
}
