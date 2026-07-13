/**
 * Ear Tag Template
 *
 * Generates YAML output conforming to models/ear-tag.yaml and — most importantly for
 * ADR-0084 Phase 2 — produces an offline-verifiable signed-QR credential seed so the
 * ear-tag QR *is* a self-contained signed credential (not just a locator/UID link).
 *
 * No decorators — plain class instantiated via NestJS useFactory.
 */

import type { EarTagRepository } from "@rocky/domains-eartag";
import type { AnimalRepository } from "@rocky/domains-animal";
import type { FarmRepository } from "@rocky/domains-farm";
import { type Result, err, ok } from "neverthrow";
import { BaseDocumentTemplate } from "../engine/document-template.js";
import type { CredentialSeed } from "../credential/credential.js";
import { DOCUMENT_ERRORS, documentErr, type DocumentError } from "../errors/document.errors.js";
import { glnFromId } from "../credential/gs1.js";

export class EarTagTemplate extends BaseDocumentTemplate<string, Record<string, unknown>> {
  readonly type = "ear-tag";
  readonly modelPath = "models/ear-tag.yaml";
  readonly name = "Ear Tag";
  readonly modelVersion = "1.0";

  constructor(
    private readonly earTagRepo: EarTagRepository,
    private readonly animalRepo: AnimalRepository,
    private readonly farmRepo: FarmRepository,
  ) {
    super();
  }

  async fetchData(refId: string): Promise<Result<string, DocumentError>> {
    if (!refId) {
      return err(documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "earTagId is required" }));
    }
    return ok(refId);
  }

  async mapToModel(earTagId: string): Promise<Record<string, unknown>> {
    const tag = await this.earTagRepo.findById(earTagId);
    if (!tag) {
      throw documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "Ear tag not found", earTagId });
    }

    const animal = tag.animalId ? await this.animalRepo.findById(tag.animalId) : null;
    const farm = animal?.currentFarmId ? await this.farmRepo.findById(animal.currentFarmId) : null;

    return {
      earTag: {
        earTagId: tag.id,
        modelVersion: this.modelVersion,
        generatedAt: new Date().toISOString(),
        stateCode: tag.stateCode,
        tagNumber: tag.tagNumber,
        status: tag.status,
        typeId: tag.typeId,
        appliedDate: tag.appliedDate,
        isDefective: tag.isDefective,
        batchNumber: tag.batchNumber,
        expiryDate: tag.expiryDate,
        animal: animal
          ? {
              animalId: animal.id,
              earTagNumber: animal.earTagNumber,
              species: animal.species,
              sex: animal.sex,
              birthDate: animal.birthDate,
              currentFarmId: animal.currentFarmId,
              status: animal.status,
            }
          : null,
        farm: farm
          ? {
              farmId: farm.id,
              farmIdNumber: farm.farmId,
              name: farm.name,
              type: farm.type,
            }
          : null,
      },
    };
  }

  /**
   * Credential seed (ADR-0084 Phase 2) — the minimal facts stamped into the
   * offline-verifiable QR: the ear-tag subject + the holding farm + species.
   * When the tag has been applied to an animal we resolve the farm and species
   * from that animal; an unapplied (inventory) tag still identifies itself
   * (sub) but carries no holding/species scope.
   */
  async mapToCredential(refId: string): Promise<Result<CredentialSeed, DocumentError>> {
    const tag = await this.earTagRepo.findById(refId);
    if (!tag) {
      return err(documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "Ear tag not found", earTagId: refId }));
    }

    const animal = tag.animalId ? await this.animalRepo.findById(tag.animalId) : null;
    const facilityId = animal?.currentFarmId ? glnFromId(animal.currentFarmId) : undefined;
    // Interim: operator GLN derived from the holding until a real GS1 company
    // prefix is allocated (ADR-0087 §Phase 0). The field shape is load-bearing.
    return ok({
      sub: tag.id,
      farmId: animal?.currentFarmId ?? undefined,
      species: animal?.species ?? undefined,
      facilityId,
      operatorId: facilityId,
    });
  }
}
