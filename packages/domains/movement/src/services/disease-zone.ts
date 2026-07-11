/**
 * Disease-Zone Spatial Check (WO-119, AHL 2016/429 Art.21-22)
 *
 * A confirmed notifiable-disease premises is surrounded by a PROTECTION zone (3 km)
 * and a concentric SURVEILLANCE zone (10 km). Both radii are RuleSet-driven
 * (thresholds.protectionZoneKm / surveillanceZoneKm, ADR-0054). Disease zones are
 * geofences of type `disease_zone` whose polygon marks the infected premises.
 *
 * The check intersects the source farm's GPS location (farms.location, PostGIS point)
 * with each active disease-zone polygon via ST_DWithin (cast to geography so the radius
 * is in METRES). It is the spatial cousin of the EUDR overlay (WO-115): both are
 * regulatory guillotines that the movement gate and the CHED exporter (WO-121
 * imsoc.requireDiseaseClear) can reuse.
 */

import type { IotRepository } from "@rocky/domains-iot";
import type { RuleSet } from "@rocky/domains-system";

export type DiseaseZoneHit = {
  geofenceId: string;
  name: string;
  farmId: string | null;
  cadastralReference: string | null;
};

export type DiseaseZoneCheckResult = {
  /** RuleSet disease-zone enforcement on/off. */
  enabled: boolean;
  /** Farm is inside an active disease zone's PROTECTION radius (quarantine). */
  inProtectionZone: boolean;
  /** Farm is inside an active disease zone's SURVEILLANCE radius. */
  inSurveillanceZone: boolean;
  /** Protection radius used, in km. */
  protectionZoneKm: number;
  /** Surveillance radius used, in km. */
  surveillanceZoneKm: number;
  /** Disease zones intersecting the protection radius. */
  protectionZones: DiseaseZoneHit[];
  /** Disease zones intersecting the surveillance radius (superset of protectionZones). */
  surveillanceZones: DiseaseZoneHit[];
};

function toHit(row: {
  id: string;
  name: string;
  farmId: string | null;
  cadastralReference: string | null;
}): DiseaseZoneHit {
  return {
    geofenceId: row.id,
    name: row.name,
    farmId: row.farmId,
    cadastralReference: row.cadastralReference,
  };
}

/**
 * Pure spatial check: does `fromFarmId` sit inside an active disease zone?
 * Returns skipped/compliant when disease-zone enforcement is disabled.
 */
export async function runDiseaseZoneCheck(
  iotRepo: IotRepository,
  ruleSet: RuleSet,
  fromFarmId: string,
): Promise<DiseaseZoneCheckResult> {
  const thresholds = ruleSet.thresholds;
  const enabled = thresholds.diseaseZoneEnabled;
  const protectionZoneKm = thresholds.protectionZoneKm;
  const surveillanceZoneKm = thresholds.surveillanceZoneKm;

  if (!enabled) {
    return {
      enabled: false,
      inProtectionZone: false,
      inSurveillanceZone: false,
      protectionZoneKm,
      surveillanceZoneKm,
      protectionZones: [],
      surveillanceZones: [],
    };
  }

  const protectionZones = fromFarmId
    ? await iotRepo.findActiveDiseaseZonesNearFarm(fromFarmId, protectionZoneKm * 1000)
    : [];
  const surveillanceZones = fromFarmId
    ? await iotRepo.findActiveDiseaseZonesNearFarm(fromFarmId, surveillanceZoneKm * 1000)
    : [];

  return {
    enabled: true,
    inProtectionZone: protectionZones.length > 0,
    inSurveillanceZone: surveillanceZones.length > 0,
    protectionZoneKm,
    surveillanceZoneKm,
    protectionZones: protectionZones.map(toHit),
    surveillanceZones: surveillanceZones.map(toHit),
  };
}
