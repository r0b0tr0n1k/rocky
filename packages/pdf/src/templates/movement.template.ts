/**
 * Movement / Transport Declaration Template
 *
 * Generates YAML output conforming to models/movement.yaml.
 * Queries movement + animal + departure/arrival farms.
 *
 * No decorators — plain class instantiated via NestJS useFactory.
 */

import type { AnimalRepository } from "@rocky/domains-animal";
import type { FarmRepository } from "@rocky/domains-farm";
import type { MovementRepository } from "@rocky/domains-movement";
import { err, ok, type Result } from "neverthrow";
import { BaseDocumentTemplate } from "../engine/document-template.js";
import { DOCUMENT_ERRORS, documentErr, type DocumentError } from "../errors/document.errors.js";

export class MovementTemplate extends BaseDocumentTemplate<string, Record<string, unknown>> {
  readonly type = "movement";
  readonly modelPath = "models/movement.yaml";
  readonly name = "Movement / Transport Declaration";
  readonly modelVersion = "1.0";

  constructor(
    private readonly movementRepo: MovementRepository,
    private readonly animalRepo: AnimalRepository,
    private readonly farmRepo: FarmRepository,
  ) {
    super();
  }

  async fetchData(refId: string): Promise<Result<string, DocumentError>> {
    if (!refId) {
      return err(documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "movementId is required" }));
    }
    return ok(refId);
  }

  async mapToModel(movementId: string): Promise<Record<string, unknown>> {
    // ── 1. Fetch movement record ──
    const movement = await this.movementRepo.findById(movementId);
    if (!movement) {
      throw documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "Movement not found", movementId });
    }

    // ── 2. Fetch animal record ──
    const animal = movement.animalId ? await this.animalRepo.findById(movement.animalId) : null;

    // ── 3. Fetch departure farm ──
    const fromFarm = movement.fromFarmId ? await this.farmRepo.findById(movement.fromFarmId) : null;

    // ── 4. Fetch arrival farm ──
    const toFarm = movement.toFarmId ? await this.farmRepo.findById(movement.toFarmId) : null;

    // ── 5. Determine if stillborn ──
    let isStillborn: boolean | null = null;
    if (movement.deathDate && animal?.birthDate) {
      const birth = new Date(animal.birthDate).getTime();
      const death = new Date(movement.deathDate).getTime();
      const ageDays = Math.floor(Math.abs(death - birth) / (1000 * 60 * 60 * 24));
      isStillborn = ageDays <= 25;
    }

    return {
      movementDeclaration: {
        // Section A: Declaration Metadata
        declarationId: movement.id,
        modelVersion: this.modelVersion,
        generatedAt: new Date().toISOString(),
        language: "MK",

        // Section B: Movement Details
        movementType: movement.type,
        movementDate: movement.movementDate,
        arrivalDate: movement.arrivalDate ?? null,
        reason: movement.reason ?? null,
        documentRef: movement.documentRef ?? null,

        // Section C: Animal Information
        animal: {
          animalId: animal?.id ?? null,
          earTagNumber: animal?.earTagNumber ?? null,
          stateCode: animal?.stateCode ?? null,
          sex: animal?.sex ?? null,
          breed: animal?.breed ?? null,
          birthDate: animal?.birthDate ?? null,
          currentStatus: animal?.status ?? null,
        },

        // Section D: Departure Farm
        fromFarm: {
          farmId: fromFarm?.id ?? null,
          farmIdNumber: fromFarm?.farmId ?? null,
          farmName: fromFarm?.name ?? null,
          farmType: fromFarm?.type ?? null,
          address: {
            street: null,
            city: null,
            zipCode: null,
            commune: null,
            state: null,
          },
        },

        // Section E: Arrival Farm
        toFarm: {
          farmId: toFarm?.id ?? null,
          farmIdNumber: toFarm?.farmId ?? null,
          farmName: toFarm?.name ?? null,
          farmType: toFarm?.type ?? null,
          address: {
            street: null,
            city: null,
            zipCode: null,
            commune: null,
            state: null,
          },
        },

        // Section F: Death Information
        deathInfo: {
          deathDate: movement.deathDate ?? null,
          deathCause: movement.deathCause ?? null,
          isStillborn,
        },

        // Section G: Import/Export
        importExport: {
          importCountry: movement.importCountry ?? null,
          exportCountry: movement.exportCountry ?? null,
          breedingState: movement.breedingState ?? null,
          breedingPlaceId: movement.breedingPlaceId ?? null,
        },

        // Section H: Transport (placeholder — data not in movements table yet)
        transport: {
          transporterName: null,
          vehiclePlate: null,
          transportDocument: null,
        },

        // Section I: Verification
        verification: {
          isVerified: movement.isVerified ?? false,
          verifiedAt: movement.verifiedAt ?? null,
          verifiedBy: null,
        },
      },
    };
  }
}
