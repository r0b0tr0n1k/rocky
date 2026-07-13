/**
 * Cattle Passport Template
 *
 * Generates YAML output conforming to models/passport.yaml.
 * Queries passport + animal + parent animals + farm + movements + vaccinations.
 *
 * No decorators — plain class instantiated via NestJS useFactory.
 */

import type { PassportRepository } from "@rocky/domains-passport";
import type { AnimalRepository } from "@rocky/domains-animal";
import type { FarmRepository } from "@rocky/domains-farm";
import type { MovementRepository } from "@rocky/domains-movement";
import type { HealthRepository } from "@rocky/domains-health";
import { type Result, err, ok } from "neverthrow";
import { BaseDocumentTemplate } from "../engine/document-template.js";
import type { CredentialSeed } from "../credential/credential.js";
import { glnFromId } from "../credential/gs1.js";
import { DOCUMENT_ERRORS, documentErr, type DocumentError } from "../errors/document.errors.js";

export class PassportTemplate extends BaseDocumentTemplate<string, Record<string, unknown>> {
  readonly type = "passport";
  readonly modelPath = "models/passport.yaml";
  readonly name = "Cattle Passport";
  readonly modelVersion = "1.0";

  constructor(
    private readonly passportRepo: PassportRepository,
    private readonly animalRepo: AnimalRepository,
    private readonly farmRepo: FarmRepository,
    private readonly movementRepo: MovementRepository,
    private readonly healthRepo: HealthRepository,
  ) {
    super();
  }

  async fetchData(refId: string): Promise<Result<string, DocumentError>> {
    if (!refId) {
      return err(documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "passportId is required" }));
    }
    return ok(refId);
  }

  async mapToModel(passportId: string): Promise<Record<string, unknown>> {
    // ── 1. Fetch passport record ──
    const passport = await this.passportRepo.findById(passportId);
    if (!passport) {
      throw documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "Passport not found", passportId });
    }

    // ── 2. Fetch animal record ──
    const animal = passport.animalId ? await this.animalRepo.findById(passport.animalId) : null;

    // ── 3. Fetch parent animals ──
    const mother = animal?.motherId ? await this.animalRepo.findById(animal.motherId) : null;
    const father = animal?.fatherId ? await this.animalRepo.findById(animal.fatherId) : null;

    // ── 4. Fetch farm record ──
    const farm = passport.farmId ? await this.farmRepo.findById(passport.farmId) : null;

    // ── 5. Fetch movement history for the animal ──
    const movementResult = animal
      ? await this.movementRepo.listFiltered({
          animalId: animal.id,
          limit: 100,
          offset: 0,
        })
      : { data: [] };

    // ── 6. Fetch vaccination history for the animal ──
    const vaccinationResult = animal
      ? await this.healthRepo.listVaccinations({
          animalId: animal.id,
          limit: 100,
          offset: 0,
        })
      : { data: [] };

    // ── 7. Build original passport reference ──
    let originalPassportNumber: string | null = null;
    if (passport.originalPassportId) {
      const original = await this.passportRepo.findById(passport.originalPassportId);
      originalPassportNumber = original?.passportNumber ?? null;
    }

    return {
      cattlePassport: {
        // Section A: Metadata
        passportId: passport.id,
        modelVersion: this.modelVersion,
        generatedAt: new Date().toISOString(),
        language: "MK",

        // Section B: Passport Identity
        passportNumber: passport.passportNumber,
        status: passport.status,
        issueDate: passport.issueDate,
        isReprint: passport.isReprint,
        originalPassportNumber,

        // Section C: Animal Information
        animal: {
          animalId: animal?.id ?? null,
          earTagNumber: animal?.earTagNumber ?? null,
          stateCode: animal?.stateCode ?? null,
          sex: animal?.sex ?? null,
          breed: animal?.breed ?? null,
          birthDate: animal?.birthDate ?? null,
          birthLocation: null,

          mother: {
            earTagNumber: mother?.earTagNumber ?? null,
            breed: mother?.breed ?? null,
          },
          father: {
            earTagNumber: father?.earTagNumber ?? null,
            breed: father?.breed ?? null,
          },

          currentStatus: animal?.status ?? null,
        },

        // Section D: Farm Information
        farm: {
          farmId: farm?.id ?? null,
          farmIdNumber: farm?.farmId ?? null,
          farmName: farm?.name ?? null,
          farmType: farm?.type ?? null,
          keeper: {
            subjectId: null,
            shortName: null,
            personalId: null,
          },
          address: {
            street: null,
            city: null,
            zipCode: null,
            commune: null,
            state: null,
          },
        },

        // Section E: Movement History
        movementHistory: movementResult.data.map((m: Record<string, unknown>) => ({
          movementId: m.id,
          movementType: m.type,
          movementDate: m.movementDate,
          fromFarmName: null,
          toFarmName: null,
          reason: (m as { reason?: string | null }).reason ?? null,
        })),

        // Section F: Vaccination History
        vaccinationHistory: vaccinationResult.data.map((v: Record<string, unknown>) => ({
          vaccineName: v.vaccineId,
          administrationDate: v.adminDate,
          batchNo: v.batchId,
          administeredBy: null,
        })),

        // Section G: Import/Export
        importExport: {
          countryOfOrigin: passport.countryOfOrigin ?? null,
          foreignPassportNumber: passport.foreignPassportNumber ?? null,
          exportCountry: null,
        },

        // Section H: Passport Lifecycle
        lifecycle: {
          shippedToVs: passport.shippedToVs,
          shippedAt: passport.shippedAt ?? null,
          deliveredToKeeper: passport.deliveredToKeeper,
          deliveredAt: passport.deliveredAt ?? null,
          seizeDate: passport.seizeDate ?? null,
          deathCause: passport.deathCause ?? null,
          archiveDate: passport.archiveDate ?? null,
        },
      },
    };
  }

  /**
   * Credential seed (ADR-0084) — the minimal facts stamped into the offline
   * verifiable QR: the passport subject + holding farm. Species is fixed
   * (bovine) for this cattle registry.
   */
  async mapToCredential(refId: string): Promise<Result<CredentialSeed, DocumentError>> {
    const passport = await this.passportRepo.findById(refId);
    if (!passport) {
      return err(documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "Passport not found", passportId: refId }));
    }
    // Interim: operator/facility GLNs derived from the holding until a real GS1
    // company prefix is allocated (ADR-0087 §Phase 0). Field shape is load-bearing.
    const facilityId = passport.farmId ? glnFromId(passport.farmId) : undefined;
    return ok({
      sub: passport.id,
      farmId: passport.farmId ?? undefined,
      species: "bovine",
      facilityId,
      operatorId: facilityId,
    });
  }
}
