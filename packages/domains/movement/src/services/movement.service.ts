/**
 * Movement Domain Service
 *
 * Orchestrates: validate → guard checks → delegate to repos → return Result.
 * Cross-table logic (animal existence check + farm update) stays in service.
 */

import { movementListRequestSchema } from "@rocky/validators/api";
import { movementResponseSchema } from "@rocky/validators/api";
import type { LineageGraph } from "@rocky/validators/api";

import type {
  MovementResponse,
  MovementListResponse,
  CreateMovementRequest,
  MovementListRequest,
} from "@rocky/validators/api/index.js";
import type {
  animals as animalsTable,
  movements as movementsTable,
} from "@rocky/database";
import type { SystemService } from "@rocky/domains-system";
import type { DiseaseZoneCheckResult, GeoRepository, GeoService } from "@rocky/geo";
import { runEudrDueDiligence, type EudrDueDiligenceResult } from "./eudr-due-diligence.js";
import {
  ANIMAL_STATUS,
  FARM_TYPE,
  IMPORT_EXPORT_STATUS,
  IMPORT_TYPE,
  MOVEMENT_TYPE,
  OUTBOX_AGGREGATE_TYPE,
  PASTURE_TYPE,
  STATE_CODE,
} from "@rocky/database/constants";
import {
  type Result,
  fromAsyncThrowable,
  toAppError,
} from "@rocky/domains-shared";
import { MovementError, MOVEMENT_ERRORS } from "../errors/movement.errors.js";
import type { MovementRepository } from "../repositories/movement.repository.js";
import type { AnimalRepository } from "@rocky/domains-animal";
import type { OutboxEventPublisher } from "@rocky/execution";
import { EVENT_TYPE_IDS } from "@rocky/domains-notification/index.js";
import crypto from "node:crypto";
import type { PassportService } from "@rocky/domains-passport";

/** System parameters for movement validation */
const DEFAULT_PARAMS = {
  slaughterMinAgeDays: 25,
  stillbornThresholdDays: 25,
  arrivalCorrectionDays: 2,
  unregisteredDepartureFarmId: "100000014",
  unregisteredArrivalFarmId: "100000027",
} as const;

function daysBetween(d1: Date, d2: Date): number {
  return Math.abs((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export class MovementService {
  private readonly NON_PASTURE_SKIP_TYPES: ReadonlySet<string> = new Set([
    MOVEMENT_TYPE.BIRTH_REGISTRATION,
    MOVEMENT_TYPE.CORRECTION,
    MOVEMENT_TYPE.PASTURE_DEPARTURE,
    MOVEMENT_TYPE.PASTURE_RETURN,
    MOVEMENT_TYPE.ALPINE_DEPARTURE,
    MOVEMENT_TYPE.ALPINE_RETURN,
  ]);

  constructor(
    private readonly repo: MovementRepository,
    private readonly animalRepo: AnimalRepository,
    private readonly system: SystemService,
    private readonly geofenceRepo: GeoRepository,
    private readonly geoService: GeoService,
    private readonly passportService?: PassportService,
    private readonly outboxPublisher?: OutboxEventPublisher,
  ) {}

  // ── WO-115: EUDR 2023/1115 due-diligence (R1) ──
  async runEudrDueDiligence(animalId: string): Promise<EudrDueDiligenceResult> {
    const rs = await this.system.getRuleSet();
    if (rs.isErr()) throw rs.error;
    return runEudrDueDiligence(this.repo, this.geofenceRepo, rs.value, animalId);
  }

  // ── WO-119: Disease-zone spatial check (AHL 2016/429) ──
  async runDiseaseZoneCheck(fromFarmId: string): Promise<DiseaseZoneCheckResult> {
    const rs = await this.system.getRuleSet();
    if (rs.isErr()) throw rs.error;
    return this.geoService.runDiseaseZoneCheck(fromFarmId, rs.value);
  }

  /** ── Rule C.4: Invalidate active pasture declaration before unexpected movement ── */
  private async invalidatePastureIfNeeded(
    animalId: string,
    reason?: string,
  ): Promise<void> {
    const active = await this.repo.findActivePastureDeclaration(animalId);
    if (active) {
      await this.repo.deactivatePastureDeclaration(
        active.id,
        reason ?? `Invalidated by movement of animal ${animalId}`,
      );
    }
  }

  async getById(id: string): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const mov = await this.repo.findById(id);
      if (!mov) throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, { id });
      return movementResponseSchema.parse(mov);
    }, toAppError)();
  }

  async listByAnimal(
    input: MovementListRequest,
  ): Promise<Result<MovementListResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const validated = movementListRequestSchema.parse(input);
      const filter = {
        ...validated,
        fromDate: validated.fromDate?.toISOString().split("T")[0],
        toDate: validated.toDate?.toISOString().split("T")[0],
      };
      const { data, total } = await this.repo.listFiltered(filter);
      return {
        data: movementResponseSchema.array().parse(data),
        total,
        limit: validated.limit,
        offset: validated.offset,
      };
    }, toAppError)();
  }

  async create(
    input: CreateMovementRequest & { createdBy?: string },
  ): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // ── Rule C.4: Invalidate pasture if non-pasture movement ──
      if (input.type && !this.NON_PASTURE_SKIP_TYPES.has(input.type)) {
        await this.invalidatePastureIfNeeded(input.animalId);
      }

      // ── Rule E.1/E.2: Unregistered farm substitution ──
      let fromFarmId = input.fromFarmId;
      let toFarmId = input.toFarmId;

      if (
        !fromFarmId &&
        (input.type === MOVEMENT_TYPE.PURCHASE ||
          input.type === MOVEMENT_TYPE.IMPORT)
      ) {
        fromFarmId = DEFAULT_PARAMS.unregisteredDepartureFarmId;
      }
      if (!toFarmId) {
        toFarmId = DEFAULT_PARAMS.unregisteredArrivalFarmId;
      }

      // Guard: cannot move animal to the same farm
      if (fromFarmId && fromFarmId === toFarmId) {
        throw new MovementError(MOVEMENT_ERRORS.SAME_FARM, {
          farmId: fromFarmId,
        });
      }

      // ── WO-022: Birth-deadline farm lock (TRACES / AHL 2016/429) ──
      // A farm with OVERDUE untagged-birth notifications is locked: no outgoing movements
      // until the anomaly is resolved. The lock is derived from birth_notification status.
      if (fromFarmId) {
        const locked = await this.repo.farmHasOverdueBirths(fromFarmId);
        if (locked) {
          throw new MovementError(MOVEMENT_ERRORS.FARM_LOCKED, { farmId: fromFarmId });
        }
      }

      // Verify animal exists and is alive
      const animal = await this.animalRepo.findById(input.animalId);
      if (!animal) {
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });
      }

      // ── WO-113: AMR withdrawal guillotine (EU 2019/6, Art. 108) ──
      // A treated animal may not enter the food chain (slaughter) until its
      // withdrawal period has elapsed. 403 WITHDRAWAL_PERIOD_ACTIVE (mapped via
      // MOVEMENT_TRPC_ERROR_MAP). Clearance = diagnosis_date + withdrawal_period days.
      if (
        input.type === MOVEMENT_TYPE.SLAUGHTERHOUSE ||
        input.type === MOVEMENT_TYPE.HOME_SLAUGHTER
      ) {
        const underWithdrawal = await this.repo.isAnimalUnderWithdrawal(
          input.animalId,
          new Date(),
        );
        if (underWithdrawal) {
          throw new MovementError(MOVEMENT_ERRORS.WITHDRAWAL_PERIOD_ACTIVE, {
            animalId: input.animalId,
          });
        }
      }

      // ── WO-115: EUDR 2023/1115 due-diligence guillotine (R1) ──
      // Blocks slaughter / home-slaughter / export when the animal pastures fail the
      // deforestation cutoff. Mirrors the WO-113 withdrawal gate; returns 403 FORBIDDEN.
      if (
        input.type === MOVEMENT_TYPE.SLAUGHTERHOUSE ||
        input.type === MOVEMENT_TYPE.HOME_SLAUGHTER ||
        input.type === MOVEMENT_TYPE.EXPORT
      ) {
        const eudr = await this.runEudrDueDiligence(input.animalId);
        if (!eudr.compliant) {
          throw new MovementError(MOVEMENT_ERRORS.EUDR_BREACHED, {
            animalId: input.animalId,
            cutoff: eudr.cutoff,
            breaches: eudr.breaches,
          });
        }
      }

      // ── WO-119: Disease-zone spatial block (AHL 2016/429 Art.21-22) ──
      // A holding inside an active disease PROTECTION zone (3 km) is quarantined: no
      // cross-farm movement is permitted. A holding inside the SURVEILLANCE zone (10 km)
      // is blocked from EXPORT. Returns 403 FORBIDDEN (via MOVEMENT_TRPC_ERROR_MAP).
      if (fromFarmId && toFarmId && fromFarmId !== toFarmId) {
        const zone = await this.runDiseaseZoneCheck(fromFarmId);
        if (zone.inProtectionZone) {
          throw new MovementError(MOVEMENT_ERRORS.DISEASE_ZONE_BREACHED, {
            farmId: fromFarmId,
            zone: "protection",
            radiusKm: zone.protectionZoneKm,
            zones: zone.protectionZones,
          });
        }
        if (zone.inSurveillanceZone && input.type === MOVEMENT_TYPE.EXPORT) {
          throw new MovementError(MOVEMENT_ERRORS.DISEASE_ZONE_BREACHED, {
            farmId: fromFarmId,
            zone: "surveillance",
            radiusKm: zone.surveillanceZoneKm,
            zones: zone.surveillanceZones,
          });
        }
      }

      // ── WO-114: Transport welfare guillotine (EC 1/2005 Ch.V) ──
      // Day-granular (schema has date-only departure/arrival; hour-precise R5 14h/9h
      // needs departureTs/arrivalTs timestamps — see WO-114b). Welfare-protective:
      // unweaned calves may not do overnight transport; adult cattle may not exceed
      // the 28h ceiling (14h+rest+14h). Rest-stop-leg enforcement (parentMovementId)
      // is deferred to WO-114b (needs the field on CreateMovementRequest + timestamps).
      const transportTypes: string[] = [
        MOVEMENT_TYPE.SALE,
        MOVEMENT_TYPE.PURCHASE,
        MOVEMENT_TYPE.IMPORT,
        MOVEMENT_TYPE.EXPORT,
        MOVEMENT_TYPE.SLAUGHTERHOUSE,
        MOVEMENT_TYPE.HOME_SLAUGHTER,
      ];
      if (transportTypes.includes(input.type ?? MOVEMENT_TYPE.SALE) && input.arrivalDate) {
        const ruleSet = await this.system.getRuleSet();
        if (ruleSet.isErr()) throw ruleSet.error;
        const w = ruleSet.value.welfare;
        const departure = new Date(input.movementDate);
        const arrival = new Date(input.arrivalDate);
        const journeyDays = daysBetween(departure, arrival);
        const ageDays = daysBetween(new Date(animal.birthDate), departure);
        const isUnweaned = ageDays < w.unweanedMaxAgeDays;
        if (isUnweaned && journeyDays >= w.maxSingleLegDays) {
          throw new MovementError(MOVEMENT_ERRORS.TRANSPORT_WELFARE_MAX_EXCEEDED, {
            animalId: input.animalId, journeyDays, unweaned: true,
          });
        }
        if (!isUnweaned && journeyDays >= w.multiDayMaxDays) {
          throw new MovementError(MOVEMENT_ERRORS.TRANSPORT_WELFARE_MAX_EXCEEDED, {
            animalId: input.animalId, journeyDays, unweaned: false,
          });
        }
      }

      // ── Rule E.3: Single-farm org restriction ──
      // (Enforced via RLS — no code-level check needed)

      // Create movement record
      const mov = await this.repo.insert({
        ...input,
        fromFarmId,
        toFarmId,
        type: input.type ?? MOVEMENT_TYPE.SALE,
      } as unknown as typeof movementsTable.$inferInsert);

      // Update animal's current farm (only for non-death/non-slaughter movements)
      if (
        input.type !== MOVEMENT_TYPE.DEATH &&
        input.type !== MOVEMENT_TYPE.HOME_SLAUGHTER &&
        input.type !== MOVEMENT_TYPE.SLAUGHTERHOUSE
      ) {
        await this.animalRepo.updateFarm(input.animalId, toFarmId);
      }

      return movementResponseSchema.parse(mov);
    }, toAppError)();
  }

  // ── Rule Group B: Death Scenarios ──

  async recordDeath(input: {
    animalId: string;
    farmId: string;
    deathDate: string;
    deathCause: string;
    createdBy?: string;
  }): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // ── Rule C.4: Death invalidates active pasture declaration ──
      await this.invalidatePastureIfNeeded(input.animalId);

      const animal = await this.animalRepo.findById(input.animalId);
      if (!animal) {
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });
      }
      if (animal.status !== ANIMAL_STATUS.ALIVE) {
        throw new MovementError(MOVEMENT_ERRORS.ANIMAL_NOT_ALIVE, {
          animalId: input.animalId,
          status: animal.status,
        });
      }

      const ruleSet = await this.system.getRuleSet();
      if (ruleSet.isErr()) throw ruleSet.error;
      const { thresholds } = ruleSet.value;

      // ── Rule B.2: Stillborn threshold ──
      const birthDate = new Date(animal.birthDate);
      const deathDate = new Date(input.deathDate);
      const ageDays = daysBetween(birthDate, deathDate);
      const isStillborn = ageDays <= thresholds.stillbornThresholdDays;

      const effectiveCause = isStillborn ? "STILLBORN" : input.deathCause;

      // Create death movement
      const mov = await this.repo.insert({
        animalId: input.animalId,
        toFarmId: input.farmId,
        type: MOVEMENT_TYPE.DEATH,
        movementDate: input.deathDate,
        deathDate: input.deathDate,
        deathCause: effectiveCause,
        createdBy: input.createdBy,
      } as unknown as typeof movementsTable.$inferInsert);

      // Update animal status
      const newStatus = isStillborn
        ? ANIMAL_STATUS.STILLBORN
        : ANIMAL_STATUS.DEAD;
      await this.animalRepo.update(input.animalId, { status: newStatus });

      return movementResponseSchema.parse(mov);
    }, toAppError)();
  }

  // ── Rule Group C: Pasture Movements ──

  async declarePasture(input: {
    animalIds: string[];
    fromFarmId: string;
    toFarmId: string;
    departureDate: string;
    expectedReturnDate: string;
    pastureType: string;
    createdBy?: string;
  }): Promise<Result<MovementResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const results: MovementResponse[] = [];

      // ── Rule C.3: Pasture cannot be used as departure farm ──
      const fromFarmType = await this.repo.findFarmType(input.fromFarmId);
      if (
        fromFarmType === FARM_TYPE.PASTURE_MOUNTAIN ||
        fromFarmType === FARM_TYPE.PASTURE_VILLAGE
      ) {
        throw new MovementError(MOVEMENT_ERRORS.PASTURE_INVALID_DEPARTURE, {
          farmId: input.fromFarmId,
          farmType: fromFarmType,
        });
      }

      for (const animalId of input.animalIds) {
        const animal = await this.animalRepo.findById(animalId);
        if (!animal) {
          throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, { animalId });
        }

        // ── Rule C.1: Only animals at home farm can go to pasture ──
        if (animal.currentFarmId !== input.fromFarmId) {
          throw new MovementError(MOVEMENT_ERRORS.PASTURE_ANIMAL_NOT_HOME, {
            animalId,
            animalFarmId: animal.currentFarmId,
            declaredFarmId: input.fromFarmId,
          });
        }

        // Create pasture departure movement
        const mov = await this.repo.insert({
          animalId,
          fromFarmId: input.fromFarmId,
          toFarmId: input.toFarmId,
          type: MOVEMENT_TYPE.PASTURE_DEPARTURE,
          movementDate: input.departureDate,
          createdBy: input.createdBy,
        } as unknown as typeof movementsTable.$inferInsert);

        if (mov) {
          // Update animal's current farm to pasture
          await this.animalRepo.updateFarm(animalId, input.toFarmId);
          results.push(movementResponseSchema.parse(mov));
        }
      }

      // Write to pasture_declarations table (was previously unused)
      await this.repo.insertPastureDeclaration({
        fromFarmId: input.fromFarmId,
        toFarmId: input.toFarmId,
        departureDate: input.departureDate,
        expectedReturnDate: input.expectedReturnDate,
        pastureType: input.pastureType,
        animalIds: input.animalIds,
        createdBy: input.createdBy,
      });

      return results;
    }, toAppError)();
  }

  // ── Instance 16: Alpine Grazing ──

  async declareAlpine(input: {
    animalIds: string[];
    fromFarmId: string;
    toFarmId: string;
    departureDate: string;
    expectedReturnDate: string;
    createdBy?: string;
  }): Promise<Result<MovementResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      const results: MovementResponse[] = [];

      // C.3: Alpine pasture cannot be used as departure farm
      const fromFarmType = await this.repo.findFarmType(input.fromFarmId);
      if (
        fromFarmType === FARM_TYPE.PASTURE_MOUNTAIN ||
        fromFarmType === FARM_TYPE.PASTURE_VILLAGE
      ) {
        throw new MovementError(MOVEMENT_ERRORS.PASTURE_INVALID_DEPARTURE, {
          farmId: input.fromFarmId,
          farmType: fromFarmType,
        });
      }

      for (const animalId of input.animalIds) {
        await this.invalidatePastureIfNeeded(animalId);

        const animal = await this.animalRepo.findById(animalId);
        if (!animal) {
          throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, { animalId });
        }

        if (animal.currentFarmId !== input.fromFarmId) {
          throw new MovementError(MOVEMENT_ERRORS.PASTURE_ANIMAL_NOT_HOME, {
            animalId,
            animalFarmId: animal.currentFarmId,
            declaredFarmId: input.fromFarmId,
          });
        }

        const mov = await this.repo.insert({
          animalId,
          fromFarmId: input.fromFarmId,
          toFarmId: input.toFarmId,
          type: MOVEMENT_TYPE.ALPINE_DEPARTURE,
          movementDate: input.departureDate,
          createdBy: input.createdBy,
        } as unknown as typeof movementsTable.$inferInsert);

        if (mov) {
          await this.animalRepo.updateFarm(animalId, input.toFarmId);
          results.push(movementResponseSchema.parse(mov));
        }
      }

      await this.repo.insertPastureDeclaration({
        fromFarmId: input.fromFarmId,
        toFarmId: input.toFarmId,
        departureDate: input.departureDate,
        expectedReturnDate: input.expectedReturnDate,
        pastureType: PASTURE_TYPE.MOUNTAIN,
        animalIds: input.animalIds,
        createdBy: input.createdBy,
      });

      return results;
    }, toAppError)();
  }

  async returnFromAlpine(input: {
    animalId: string;
    fromFarmId: string;
    toFarmId: string;
    returnDate: string;
    createdBy?: string;
  }): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      await this.invalidatePastureIfNeeded(input.animalId);

      const animal = await this.animalRepo.findById(input.animalId);
      if (!animal) {
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });
      }
      if (animal.status !== ANIMAL_STATUS.ALIVE) {
        throw new MovementError(MOVEMENT_ERRORS.ANIMAL_NOT_ALIVE, {
          animalId: input.animalId,
          status: animal.status,
        });
      }

      if (input.fromFarmId === input.toFarmId) {
        throw new MovementError(MOVEMENT_ERRORS.SAME_FARM, {
          farmId: input.fromFarmId,
        });
      }

      const mov = await this.repo.insert({
        animalId: input.animalId,
        fromFarmId: input.fromFarmId,
        toFarmId: input.toFarmId,
        type: MOVEMENT_TYPE.ALPINE_RETURN,
        movementDate: input.returnDate,
        createdBy: input.createdBy,
      } as unknown as typeof movementsTable.$inferInsert);

      await this.animalRepo.updateFarm(input.animalId, input.toFarmId);

      if (!mov)
        throw new MovementError(MOVEMENT_ERRORS.INVALID_INPUT, {
          reason: "Failed to create alpine return movement",
        });
      return movementResponseSchema.parse(mov);
    }, toAppError)();
  }

  // ── Rule Group D: Slaughter ──

  async recordSlaughter(input: {
    animalId: string;
    fromFarmId: string;
    slaughterhouseId: string;
    slaughterDate: string;
    arrivalDate?: string;
    createdBy?: string;
  }): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // ── Rule C.4: Slaughter invalidates active pasture declaration ──
      await this.invalidatePastureIfNeeded(input.animalId);

      const animal = await this.animalRepo.findById(input.animalId);
      if (!animal) {
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });
      }
      if (animal.status !== ANIMAL_STATUS.ALIVE) {
        throw new MovementError(MOVEMENT_ERRORS.ANIMAL_NOT_ALIVE, {
          animalId: input.animalId,
          status: animal.status,
        });
      }

      const ruleSet2 = await this.system.getRuleSet();
      if (ruleSet2.isErr()) throw ruleSet2.error;
      const { thresholds: t2 } = ruleSet2.value;

      // ── Rule D.1: Minimum age check ──
      const birthDate = new Date(animal.birthDate);
      const slaughterDate = new Date(input.slaughterDate);
      const ageDays = daysBetween(birthDate, slaughterDate);
      if (ageDays < t2.slaughterMinAgeDays) {
        throw new MovementError(MOVEMENT_ERRORS.SLAUGHTER_MIN_AGE, {
          animalId: input.animalId,
          ageDays,
          requiredDays: t2.slaughterMinAgeDays,
        });
      }

      // ── Rule D.3: Arrival correction (+/- 2 days) ──
      let movementDate = input.slaughterDate;
      if (input.arrivalDate) {
        const arrivalDate = new Date(input.arrivalDate);
        const diff = daysBetween(arrivalDate, slaughterDate);
        if (diff > t2.arrivalCorrectionDays) {
          movementDate = input.arrivalDate;
        }
      }

      // Create slaughter movement
      const mov = await this.repo.insert({
        animalId: input.animalId,
        fromFarmId: input.fromFarmId,
        toFarmId: input.slaughterhouseId,
        type: MOVEMENT_TYPE.SLAUGHTERHOUSE,
        movementDate,
        arrivalDate: input.arrivalDate,
        createdBy: input.createdBy,
      } as unknown as typeof movementsTable.$inferInsert);

      // Update animal status
      await this.animalRepo.update(input.animalId, {
        status: ANIMAL_STATUS.SLAUGHTERED,
      });

      return movementResponseSchema.parse(mov);
    }, toAppError)();
  }

  // ── Rule Group IE: Import/Export ──

  /**
   * IE.1 + IE.2: EU Import
   * - Original animal ID unchanged
   * - Creates IMPORT movement
   * - Creates import_export_record with foreign passport stored for 3 years
   * - Animal status → IMPORTED
   */
  async importEU(input: {
    animalId: string;
    fromFarmId: string;
    toFarmId: string;
    countryOfOrigin: string;
    foreignPassportNumber?: string;
    bipEntryDate?: string;
    createdBy?: string;
  }): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const animal = await this.animalRepo.findById(input.animalId);
      if (!animal)
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });
      if (animal.status !== ANIMAL_STATUS.ALIVE) {
        throw new MovementError(MOVEMENT_ERRORS.ANIMAL_NOT_ALIVE, {
          animalId: input.animalId,
        });
      }

      // Create IMPORT movement
      const mov = await this.repo.insert({
        animalId: input.animalId,
        fromFarmId: input.fromFarmId,
        toFarmId: input.toFarmId,
        type: MOVEMENT_TYPE.IMPORT,
        movementDate:
          input.bipEntryDate ?? new Date().toISOString().split("T")[0]!,
        importCountry: input.countryOfOrigin,
        createdBy: input.createdBy,
      } as unknown as typeof movementsTable.$inferInsert);

      // IE.2: Foreign passport stored for 3 years
      const storageExpiry = new Date();
      storageExpiry.setFullYear(storageExpiry.getFullYear() + 3);

      await this.repo.createImportExportRecord({
        direction: MOVEMENT_TYPE.IMPORT,
        animalId: input.animalId,
        fromFarmId: input.fromFarmId,
        toFarmId: input.toFarmId,
        importType: IMPORT_TYPE.EU,
        countryOfOrigin: input.countryOfOrigin,
        foreignPassportNumber: input.foreignPassportNumber,
        foreignPassportStored: !!input.foreignPassportNumber,
        foreignPassportStorageExpiry: storageExpiry
          .toISOString()
          .split("T")[0]!,
        bipEntryDate: input.bipEntryDate,
        status: IMPORT_EXPORT_STATUS.COMPLETED,
        createdBy: input.createdBy,
      });

      // IE.1: Create national passport for imported animal (fire-and-forget)
      if (this.passportService) {
        try {
          await this.passportService.issueForAnimal({
            animalId: input.animalId,
            farmId: input.toFarmId,
            createdBy: input.createdBy,
          });
        } catch {
          // Passport creation failure does not block import
        }
      }

      // Update animal status
      await this.animalRepo.update(input.animalId, {
        status: ANIMAL_STATUS.IMPORTED,
      });

      return movementResponseSchema.parse(mov);
    }, toAppError)();
  }

  /**
   * IE.3 + IE.4: 3rd Country Import
   * - IE.3: Re-tag with national ear tag (retagged=true, newEarTagNumber)
   * - IE.4: Full re-registration as new animal (creates new animal record)
   * - Creates IMPORT movement + import_export_record
   */
  async importThirdCountry(input: {
    animalId: string;
    fromFarmId: string;
    toFarmId: string;
    countryOfOrigin: string;
    newEarTagNumber?: string;
    bipEntryDate?: string;
    createdBy?: string;
  }): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const foreignAnimal = await this.animalRepo.findById(input.animalId);
      if (!foreignAnimal)
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });

      // IE.4: Create a new animal record with re-tagged ear tag
      const newAnimal = await this.animalRepo.insert({
        stateCode: STATE_CODE.MK,
        earTagNumber: input.newEarTagNumber ?? foreignAnimal.earTagNumber,
        birthDate: foreignAnimal.birthDate,
        sex: foreignAnimal.sex,
        breed: foreignAnimal.breed,
        birthType: foreignAnimal.birthType,
        birthWeight: foreignAnimal.birthWeight,
        currentFarmId: input.toFarmId,
        status: ANIMAL_STATUS.ALIVE,
        imported: true,
        createdBy: input.createdBy,
      } as unknown as typeof animalsTable.$inferInsert);

      if (!newAnimal)
        throw new MovementError(MOVEMENT_ERRORS.INVALID_INPUT, {
          reason: "Failed to create animal record",
        });
      const newAnimalId = newAnimal.id;

      // Create IMPORT movement for the new national animal
      const mov = await this.repo.insert({
        animalId: newAnimalId,
        fromFarmId: input.fromFarmId,
        toFarmId: input.toFarmId,
        type: MOVEMENT_TYPE.IMPORT,
        movementDate:
          input.bipEntryDate ?? new Date().toISOString().split("T")[0]!,
        importCountry: input.countryOfOrigin,
        createdBy: input.createdBy,
      } as unknown as typeof movementsTable.$inferInsert);

      // Create import_export_record for the new national animal
      await this.repo.createImportExportRecord({
        direction: MOVEMENT_TYPE.IMPORT,
        animalId: newAnimalId,
        fromFarmId: input.fromFarmId,
        toFarmId: input.toFarmId,
        importType: IMPORT_TYPE.THIRD_COUNTRY,
        countryOfOrigin: input.countryOfOrigin,
        retagged: true,
        newEarTagNumber: input.newEarTagNumber,
        bipEntryDate: input.bipEntryDate,
        status: IMPORT_EXPORT_STATUS.COMPLETED,
        createdBy: input.createdBy,
      });

      return movementResponseSchema.parse(mov);
    }, toAppError)();
  }

  /**
   * IE.5: Export
   * - BIP enters animal data, indicates country of destination
   * - Creates EXPORT movement + import_export_record
   * - Animal status → EXPORTED
   */
  async exportAnimal(input: {
    animalId: string;
    fromFarmId: string;
    toFarmId?: string;
    destinationCountry: string;
    bipExitDate?: string;
    createdBy?: string;
  }): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // ── Rule C.4: Export invalidates active pasture declaration ──
      await this.invalidatePastureIfNeeded(input.animalId);

      const animal = await this.animalRepo.findById(input.animalId);
      if (!animal)
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });
      if (animal.status !== ANIMAL_STATUS.ALIVE) {
        throw new MovementError(MOVEMENT_ERRORS.ANIMAL_NOT_ALIVE, {
          animalId: input.animalId,
        });
      }

      const toFarmId =
        input.toFarmId ?? DEFAULT_PARAMS.unregisteredDepartureFarmId;

      // Create EXPORT movement
      const mov = await this.repo.insert({
        animalId: input.animalId,
        fromFarmId: input.fromFarmId,
        toFarmId,
        type: MOVEMENT_TYPE.EXPORT,
        movementDate:
          input.bipExitDate ?? new Date().toISOString().split("T")[0]!,
        exportCountry: input.destinationCountry,
        createdBy: input.createdBy,
      } as unknown as typeof movementsTable.$inferInsert);

      // Create import_export_record
      await this.repo.createImportExportRecord({
        direction: MOVEMENT_TYPE.EXPORT,
        animalId: input.animalId,
        fromFarmId: input.fromFarmId,
        toFarmId,
        countryOfOrigin: input.destinationCountry,
        destinationCountry: input.destinationCountry,
        bipExitDate: input.bipExitDate,
        status: IMPORT_EXPORT_STATUS.COMPLETED,
        createdBy: input.createdBy,
      });

      // Update animal status
      await this.animalRepo.update(input.animalId, {
        status: ANIMAL_STATUS.EXPORTED,
      });

      return movementResponseSchema.parse(mov);
    }, toAppError)();
  }

  // ── Rule Group M: Market Movements ──

  /**
   * M.1 + M.2: 4-leg market transaction
   * Leg 1: seller → market (MARKET_SALE)
   * Leg 2: market → purchaser (MARKET_PURCHASE)
   * Leg 3: purchaser → market (MARKET_SALE) — if purchaser is also seller at market
   * Leg 4: market → new purchaser (MARKET_PURCHASE)
   *
   * Uses parentMovementId + legOrder to chain legs.
   */
  async recordMarketTransaction(input: {
    animalId: string;
    sellerFarmId: string;
    buyerFarmId: string;
    marketFarmId: string;
    movementDate: string;
    salePrice?: number;
    createdBy?: string;
  }): Promise<Result<MovementResponse[], Error>> {
    return fromAsyncThrowable(async () => {
      // ── Rule C.4: Market sale invalidates active pasture declaration ──
      await this.invalidatePastureIfNeeded(
        input.animalId,
        `Market sale at ${input.marketFarmId}`,
      );

      const animal = await this.animalRepo.findById(input.animalId);
      if (!animal)
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });
      if (animal.status !== ANIMAL_STATUS.ALIVE) {
        throw new MovementError(MOVEMENT_ERRORS.ANIMAL_NOT_ALIVE, {
          animalId: input.animalId,
        });
      }

      const movementGroupId = crypto.randomUUID();
      const legs: (typeof movementsTable.$inferInsert)[] = [];

      // Leg 1: Seller → Market (MARKET_SALE)
      legs.push({
        animalId: input.animalId,
        fromFarmId: input.sellerFarmId,
        toFarmId: input.marketFarmId,
        type: MOVEMENT_TYPE.MARKET_SALE,
        movementDate: input.movementDate,
        legOrder: 1,
        movementGroupId,
        createdBy: input.createdBy,
      });

      // Leg 2: Market → Buyer (MARKET_PURCHASE)
      legs.push({
        animalId: input.animalId,
        fromFarmId: input.marketFarmId,
        toFarmId: input.buyerFarmId,
        type: MOVEMENT_TYPE.MARKET_PURCHASE,
        movementDate: input.movementDate,
        legOrder: 2,
        movementGroupId,
        createdBy: input.createdBy,
      });

      // Insert leg 1 first to get its ID for parentMovementId
      const leg1 = await this.repo.insert(legs[0]!);
      if (!leg1)
        throw new MovementError(MOVEMENT_ERRORS.INVALID_INPUT, {
          reason: "Failed to create market leg 1",
        });

      // Insert leg 2 with parentMovementId
      const leg2 = await this.repo.insert({
        ...legs[1]!,
        parentMovementId: leg1.id,
      });

      // Update animal's current farm to buyer
      await this.animalRepo.updateFarm(input.animalId, input.buyerFarmId);

      // Publish outbox event
      if (this.outboxPublisher) {
        await this.outboxPublisher.publish({
          type: EVENT_TYPE_IDS.MOVEMENT_RECORDED,
          aggregateType: OUTBOX_AGGREGATE_TYPE.MOVEMENT,
          aggregateId: leg1.id,
          payload: {
            animalId: input.animalId,
            sellerFarmId: input.sellerFarmId,
            buyerFarmId: input.buyerFarmId,
            marketFarmId: input.marketFarmId,
            movementGroupId,
            movementDate: input.movementDate,
          },
          createdBy: input.createdBy,
        });
      }

      const results: MovementResponse[] = [movementResponseSchema.parse(leg1)];
      if (leg2) results.push(movementResponseSchema.parse(leg2));
      return results;
    }, toAppError)();
  }

  /**
   * M.3: Unsold animal fallback — purchaser acts as seller
   * Creates a reverse movement when animal is unsold at market.
   */
  async recordMarketUnsold(input: {
    animalId: string;
    buyerFarmId: string;
    sellerFarmId: string;
    marketFarmId: string;
    movementDate: string;
    createdBy?: string;
  }): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      const animal = await this.animalRepo.findById(input.animalId);
      if (!animal)
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });

      // Reverse: buyer → market → original seller
      const mov = await this.repo.insert({
        animalId: input.animalId,
        fromFarmId: input.buyerFarmId,
        toFarmId: input.sellerFarmId,
        type: MOVEMENT_TYPE.PURCHASE,
        movementDate: input.movementDate,
        reason: "unsold_at_market",
        createdBy: input.createdBy,
      } as unknown as typeof movementsTable.$inferInsert);

      // Update animal's current farm back to seller
      await this.animalRepo.updateFarm(input.animalId, input.sellerFarmId);

      if (!mov)
        throw new MovementError(MOVEMENT_ERRORS.INVALID_INPUT, {
          reason: "Failed to create unsold movement",
        });
      return movementResponseSchema.parse(mov);
    }, toAppError)();
  }

  /**
   * M.4: Home slaughter status on market off-movement
   * When animal is slaughtered at market instead of going to buyer.
   */
  async recordMarketSlaughter(input: {
    animalId: string;
    sellerFarmId: string;
    marketFarmId: string;
    slaughterhouseId: string;
    movementDate: string;
    createdBy?: string;
  }): Promise<Result<MovementResponse, Error>> {
    return fromAsyncThrowable(async () => {
      // ── Rule C.4: Market slaughter invalidates active pasture declaration ──
      await this.invalidatePastureIfNeeded(input.animalId);

      const animal = await this.animalRepo.findById(input.animalId);
      if (!animal)
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });
      if (animal.status !== ANIMAL_STATUS.ALIVE) {
        throw new MovementError(MOVEMENT_ERRORS.ANIMAL_NOT_ALIVE, {
          animalId: input.animalId,
        });
      }

      // Market → Slaughterhouse
      const mov = await this.repo.insert({
        animalId: input.animalId,
        fromFarmId: input.marketFarmId,
        toFarmId: input.slaughterhouseId,
        type: MOVEMENT_TYPE.SLAUGHTERHOUSE,
        movementDate: input.movementDate,
        createdBy: input.createdBy,
      } as unknown as typeof movementsTable.$inferInsert);

      // Update animal status
      await this.animalRepo.update(input.animalId, {
        status: ANIMAL_STATUS.SLAUGHTERED,
      });

      if (!mov)
        throw new MovementError(MOVEMENT_ERRORS.INVALID_INPUT, {
          reason: "Failed to create market slaughter movement",
        });
      return movementResponseSchema.parse(mov);
    }, toAppError)();
  }

  // ── WO-116: Lineage & Traceability Graph (R6 EC 178/2002) ──
  async getLineage(animalId: string): Promise<Result<LineageGraph, Error>> {
    return fromAsyncThrowable(async () => {
      const ruleSet = await this.system.getRuleSet();
      if (ruleSet.isErr()) throw ruleSet.error;
      return this.buildLineageGraph(animalId, ruleSet.value.traceability.maxDepth);
    }, toAppError)();
  }

  private async buildLineageGraph(rootAnimalId: string, maxDepth: number): Promise<LineageGraph> {
    type LNode = { kind: "animal" | "holding"; id: string; label?: string };
    type LEdge = {
      kind: "movement" | "parentage";
      animalId: string;
      from?: string;
      to?: string;
      date?: string;
      type?: string;
      parentId?: string;
    };
    const visited = new Set<string>();
    const nodes = new Map<string, LNode>();
    const edges: LEdge[] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: rootAnimalId, depth: 0 }];
    let truncated = false;
    const CAP = 500;
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const animal = await this.animalRepo.findById(id);
      if (!animal) continue;
      nodes.set(`animal:${id}`, { kind: "animal", id, label: animal.earTagNumber ?? id });
      if (animal.currentFarmId) {
        nodes.set(`holding:${animal.currentFarmId}`, { kind: "holding", id: animal.currentFarmId });
      }
      const movements = await this.repo.findMovementsByAnimal(id);
      for (const m of movements) {
        if (m.fromFarmId) nodes.set(`holding:${m.fromFarmId}`, { kind: "holding", id: m.fromFarmId });
        if (m.toFarmId) nodes.set(`holding:${m.toFarmId}`, { kind: "holding", id: m.toFarmId });
        edges.push({
          kind: "movement",
          animalId: id,
          from: m.fromFarmId ?? undefined,
          to: m.toFarmId,
          date: m.movementDate ? String(m.movementDate) : undefined,
          type: m.type,
        });
      }
      const parents = await this.repo.findAnimalParents(id);
      for (const par of parents) {
        edges.push({ kind: "parentage", animalId: id, parentId: par.parentId });
        if (depth < maxDepth && !visited.has(par.parentId)) queue.push({ id: par.parentId, depth: depth + 1 });
      }
      const offspring = await this.repo.findAnimalOffspring(id);
      for (const o of offspring) {
        edges.push({ kind: "parentage", animalId: o.animalId, parentId: id });
        if (depth < maxDepth && !visited.has(o.animalId)) queue.push({ id: o.animalId, depth: depth + 1 });
      }
      if (visited.size > CAP) { truncated = true; break; }
    }
    return { animalId: rootAnimalId, nodes: Array.from(nodes.values()), edges, truncated };
  }
}
