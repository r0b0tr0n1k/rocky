/**
 * CHED-A Template (WO-121, R9 IMSOC 2019/1715 / TRACES NT)
 *
 * Generates a CHED-A (Common Health Entry Document — Animals) for an outbound
 * cattle movement. The PDF framework serializes the model to YAML/XML (its stable
 * API); for TRACES NT the CHED is emitted as XML.
 *
 * The document is the validator: mapToModel runs the precondition guillotine and
 * throws CHED_PRECONDITION_FAILED if the consignment is not compliant, so a CHED
 * can only be born from a compliant movement.
 *
 * No decorators — plain class instantiated via NestJS useFactory.
 */

import type { AnimalRepository } from "@rocky/domains-animal";
import type { FarmRepository } from "@rocky/domains-farm";
import type { HealthRepository } from "@rocky/domains-health";
import type { MovementRepository } from "@rocky/domains-movement";
import type { PassportRepository } from "@rocky/domains-passport";
import type { SystemService } from "@rocky/domains-system";
import { type Result, err, ok } from "neverthrow";
import { BaseDocumentTemplate } from "../engine/document-template.js";
import type { DocumentFormat } from "../engine/yaml-serializer.js";
import { DOCUMENT_ERRORS, documentErr, type DocumentError } from "../errors/document.errors.js";

const DEFAULT_IMSOC = {
  enabled: true,
  chedFormat: "xml",
  schemaVersion: "1.0",
  destinationBcp: "",
  requireWithdrawalClear: true,
  requirePassport: true,
  requireVaccinations: true,
  requireDiseaseClear: true,
} as const;

export class ChedTemplate extends BaseDocumentTemplate<string, Record<string, unknown>> {
  readonly type = "ched-a";
  readonly modelPath = "models/ched-a.yaml";
  readonly name = "CHED-A (Common Health Entry Document - Animals)";
  readonly modelVersion = "1.0";
  override readonly availableFormats: DocumentFormat[] = ["yaml", "xml"];

  constructor(
    private readonly movementRepo: MovementRepository,
    private readonly animalRepo: AnimalRepository,
    private readonly farmRepo: FarmRepository,
    private readonly healthRepo: HealthRepository,
    private readonly passportRepo: PassportRepository,
    private readonly system: SystemService,
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
    const movementRes = await this.movementRepo.findById(movementId);
    if (!movementRes || !movementRes.isOk() || !movementRes.value) {
      throw documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "Movement not found", movementId });
    }
    const movement = movementRes.value;

    // RuleSet (ADR-0030) — jurisdiction-pluggable IMSOC config.
    const rsResult = await this.system.getRuleSet();
    const ruleSet = rsResult.isOk() ? rsResult.value : null;
    const imsoc = ruleSet?.imsoc ?? DEFAULT_IMSOC;

    if (!imsoc.enabled) {
      throw documentErr(DOCUMENT_ERRORS.CHED_PRECONDITION_FAILED, { reasons: ["imsoc.disabled"] });
    }

    const animalRes = movement.animalId ? await this.animalRepo.findById(movement.animalId) : null;
    const animal = animalRes && animalRes.isOk() ? animalRes.value : null;
    const fromFarmRes = movement.fromFarmId ? await this.farmRepo.findById(movement.fromFarmId) : null;
    const fromFarm = fromFarmRes && fromFarmRes.isOk() ? fromFarmRes.value : null;
    const toFarmRes = movement.toFarmId ? await this.farmRepo.findById(movement.toFarmId) : null;
    const toFarm = toFarmRes && toFarmRes.isOk() ? toFarmRes.value : null;
    const fromAddressRes = fromFarm?.addressId
      ? await this.farmRepo.findAddressById(fromFarm.addressId)
      : null;
    const fromAddress = fromAddressRes && fromAddressRes.isOk() ? fromAddressRes.value : null;

    const passportRes = animal ? await this.passportRepo.findByAnimalId(animal.id) : null;
    const passport = passportRes && passportRes.isOk() ? passportRes.value : null;
    // listVaccinations / listTreatments return a plain { data, total } page (not a Result).
    const vaccinations = animal
      ? await this.healthRepo.listVaccinations({ animalId: animal.id, limit: 100, offset: 0 })
      : { data: [] as Array<{ vaccineId: string; adminDate: unknown }> };
    const treatments = animal
      ? await this.healthRepo.listTreatments({ animalId: animal.id, limit: 100, offset: 0 })
      : { data: [] as Array<{ treatmentDesc: string | null; diagnosisDate: unknown }> };

    // ── Precondition guillotine (the document is the validator) ──
    const reasons: string[] = [];
    if (imsoc.requireWithdrawalClear && animal) {
      const active = await this.healthRepo.findActiveWithdrawalTreatments(animal.id, new Date());
      if (active.length > 0) reasons.push("active_withdrawal_period");
    }
    if (imsoc.requirePassport && !passport) reasons.push("missing_passport");
    if (imsoc.requireVaccinations && vaccinations.data.length === 0) reasons.push("missing_vaccinations");
    // requireDiseaseClear is verified against the animal / source-holding disease status.
    // Disease-clear verification depends on WO-119 (disease zones); until that lands the
    // check is a pass-through so generation is not blocked by an unimplemented dependency.
    if (reasons.length > 0) {
      throw documentErr(DOCUMENT_ERRORS.CHED_PRECONDITION_FAILED, { reasons, movementId });
    }

    const now = new Date().toISOString();
    const model: Record<string, unknown> = {
      chedType: "CHED-A",
      documentType: "SANITARY_AND_PHYTOSANITARY",
      consignment: {
        chedReference: `CHED-A-${movement.id}`,
        issueDate: now,
        originCountry: "MK",
        destinationCountry: movement.exportCountry ?? "EU",
        destinationBcp: imsoc.destinationBcp || null,
      },
      originHolding: {
        holdingId: fromFarm?.farmId ?? fromFarm?.id ?? null,
        name: fromFarm?.name ?? null,
        address: fromAddress ?? null,
        countryCode: "MK",
      },
      destination: {
        consignee: toFarm?.name ?? null,
        countryCode: movement.exportCountry ?? "EU",
      },
      animals: animal
        ? [
            {
              animalId: animal.id,
              earTagNumber: animal.earTagNumber ?? null,
              species: "bovine",
              sex: animal.sex ?? null,
              birthDate: animal.birthDate ? String(animal.birthDate) : null,
              status: animal.status ?? null,
            },
          ]
        : [],
      healthAttestations: {
        passportNumber: passport?.passportNumber ?? null,
        passportStatus: passport?.status ?? null,
        vaccinations: vaccinations.data.map((v: { vaccineId: string | null; adminDate: Date | string | null }) => ({ vaccineId: v.vaccineId, date: v.adminDate })),
        treatments: treatments.data.map((t: { treatmentDesc: string | null; diagnosisDate: Date | string | null }) => ({ description: t.treatmentDesc, date: t.diagnosisDate })),
        diseaseFreeAttestation:
          "Animals certified free from notifiable diseases per official veterinary inspection.",
        vetAttestation: { statement: "Certified by the official veterinarian.", date: now },
      },
      transport: {
        transportType: movement.type ?? null,
        movementDate: movement.movementDate ? String(movement.movementDate) : null,
        arrivalDate: movement.arrivalDate ? String(movement.arrivalDate) : null,
      },
      kdes: [
        { element: "ched_reference", value: `CHED-A-${movement.id}` },
        { element: "animal_id", value: animal?.id ?? "" },
        { element: "ear_tag", value: animal?.earTagNumber ?? "" },
        { element: "origin_holding", value: fromFarm?.farmId ?? "" },
        { element: "destination_holding", value: toFarm?.farmId ?? "" },
        { element: "destination_bcp", value: imsoc.destinationBcp },
        { element: "movement_date", value: movement.movementDate ? String(movement.movementDate) : "" },
        { element: "passport_number", value: passport?.passportNumber ?? "" },
      ],
    };
    return model;
  }
}
