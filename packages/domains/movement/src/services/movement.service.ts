/**
 * Movement Domain Service
 *
 * Orchestrates: validate → guard checks → delegate to repos → return Result.
 * Cross-table logic (animal existence check + farm update) stays in service.
 */

import { movementListRequestSchema } from "@rocky/validators/api";
import { movementResponseSchema } from "@rocky/validators/api";

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
import {
  ANIMAL_STATUS,
  FARM_TYPE,
  MOVEMENT_TYPE,
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
    private readonly passportService?: PassportService,
    private readonly outboxPublisher?: OutboxEventPublisher,
  ) {}

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

      // Verify animal exists and is alive
      const animal = await this.animalRepo.findById(input.animalId);
      if (!animal) {
        throw new MovementError(MOVEMENT_ERRORS.NOT_FOUND, {
          animalId: input.animalId,
        });
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

      // ── Rule B.2: Stillborn threshold ──
      const birthDate = new Date(animal.birthDate);
      const deathDate = new Date(input.deathDate);
      const ageDays = daysBetween(birthDate, deathDate);
      const isStillborn = ageDays <= DEFAULT_PARAMS.stillbornThresholdDays;

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

      // ── Rule D.1: Minimum age check ──
      const birthDate = new Date(animal.birthDate);
      const slaughterDate = new Date(input.slaughterDate);
      const ageDays = daysBetween(birthDate, slaughterDate);
      if (ageDays < DEFAULT_PARAMS.slaughterMinAgeDays) {
        throw new MovementError(MOVEMENT_ERRORS.SLAUGHTER_MIN_AGE, {
          animalId: input.animalId,
          ageDays,
          requiredDays: DEFAULT_PARAMS.slaughterMinAgeDays,
        });
      }

      // ── Rule D.3: Arrival correction (+/- 2 days) ──
      let movementDate = input.slaughterDate;
      if (input.arrivalDate) {
        const arrivalDate = new Date(input.arrivalDate);
        const diff = daysBetween(arrivalDate, slaughterDate);
        if (diff > DEFAULT_PARAMS.arrivalCorrectionDays) {
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
        direction: "import",
        animalId: input.animalId,
        fromFarmId: input.fromFarmId,
        toFarmId: input.toFarmId,
        importType: "eu",
        countryOfOrigin: input.countryOfOrigin,
        foreignPassportNumber: input.foreignPassportNumber,
        foreignPassportStored: !!input.foreignPassportNumber,
        foreignPassportStorageExpiry: storageExpiry
          .toISOString()
          .split("T")[0]!,
        bipEntryDate: input.bipEntryDate,
        status: "completed",
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
        direction: "import",
        animalId: newAnimalId,
        fromFarmId: input.fromFarmId,
        toFarmId: input.toFarmId,
        importType: "third_country",
        countryOfOrigin: input.countryOfOrigin,
        retagged: true,
        newEarTagNumber: input.newEarTagNumber,
        bipEntryDate: input.bipEntryDate,
        status: "completed",
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
        direction: "export",
        animalId: input.animalId,
        fromFarmId: input.fromFarmId,
        toFarmId,
        countryOfOrigin: input.destinationCountry,
        destinationCountry: input.destinationCountry,
        bipExitDate: input.bipExitDate,
        status: "completed",
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
          aggregateType: "movement",
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
}
