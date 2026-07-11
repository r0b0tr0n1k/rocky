/**
 * CHED Template (WO-116, R9 IMSOC 2019/1715 / TRACES NT)
 *
 * Generates a CHED (Common Health Entry Document) Part I model for an outbound
 * movement. The PDF framework serializes the model to YAML/XML (its stable API);
 * the CHED data model below is JSON-equivalent (TRACES NT CHED-P).
 *
 * No decorators — plain class instantiated via NestJS useFactory.
 */

import type { MovementRepository } from "@rocky/domains-movement";
import type { AnimalRepository } from "@rocky/domains-animal";
import { type Result, err, ok } from "neverthrow";
import { BaseDocumentTemplate } from "../engine/document-template.js";
import { DOCUMENT_ERRORS, documentErr, type DocumentError } from "../errors/document.errors.js";

export class ChedTemplate extends BaseDocumentTemplate<string, Record<string, unknown>> {
  readonly type = "ched";
  readonly modelPath = "models/ched.yaml";
  readonly name = "CHED (Common Health Entry Document)";
  readonly modelVersion = "1.0";

  constructor(
    private readonly movementRepo: MovementRepository,
    private readonly animalRepo: AnimalRepository,
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
    const movement = await this.movementRepo.findById(movementId);
    if (!movement) {
      throw documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "Movement not found", movementId });
    }
    const animal = movement.animalId ? await this.animalRepo.findById(movement.animalId) : null;
    const destCountry = movement.exportCountry ?? movement.importCountry ?? "MK";
    const model: Record<string, unknown> = {
      documentType: "CVED-P",
      chedType: "CHED-P",
      animalIds: movement.animalId ? [movement.animalId] : [],
      originHolding: { holdingId: movement.fromFarmId ?? "", countryCode: "MK" },
      destinationHolding: { holdingId: movement.toFarmId ?? "", countryCode: destCountry },
      movementDate: movement.movementDate ? String(movement.movementDate) : null,
      species: "bovine",
      quantity: 1,
      kdes: [
        { element: "animal_id", value: movement.animalId ?? "" },
        { element: "origin_holding", value: movement.fromFarmId ?? "" },
        { element: "destination_holding", value: movement.toFarmId ?? "" },
        { element: "movement_date", value: movement.movementDate ? String(movement.movementDate) : "" },
        { element: "cte_type", value: String(movement.type) },
        { element: "ear_tag", value: animal?.earTagNumber ?? "" },
      ],
    };
    return model;
  }
}
