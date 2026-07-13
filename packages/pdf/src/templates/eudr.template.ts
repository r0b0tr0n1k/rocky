/**
 * EUDR Due-Diligence Statement Template (WO-115, R1 EUDR 2023/1115)
 *
 * Renders the Slaughter Due-Diligence Statement: overlays every pasture a cow
 * touched against the deforestation cutoff (2020-12-31) and records the result.
 * The due-diligence logic is the shared runEudrDueDiligence() from @rocky/domains-movement,
 * so the statement always matches the gate enforced at MovementService.create().
 *
 * The framework serializes to YAML/XML (stable API); for EUDR the statement is emitted
 * as XML for archival/LPIS interchange.
 *
 * ADR-0084 §14.3: the DDS is the EUDR export token. It references the animal's signed
 * credential (the offline-verifiable QR) so a downstream operator can verify cattle
 * provenance without a server call. The reference is embedded here, at generation time,
 * via CredentialService — graceful when no passport/credential exists yet.
 */

import type { AnimalRepository } from "@rocky/domains-animal";
import type { FarmRepository } from "@rocky/domains-farm";
import { PassportRepository } from "@rocky/domains-passport";
import type { GeoRepository } from "@rocky/geo";
import type { MovementRepository } from "@rocky/domains-movement";
import { runEudrDueDiligence } from "@rocky/domains-movement";
import type { SystemService } from "@rocky/domains-system";
import { CredentialService } from "../services/credential.service.js";
import { ok, err } from "neverthrow";
import { BaseDocumentTemplate } from "../engine/document-template.js";
import type { DocumentFormat } from "../engine/yaml-serializer.js";
import { DOCUMENT_ERRORS, documentErr } from "../errors/document.errors.js";
import type { DocumentError } from "../errors/document.errors.js";
import type { Result } from "neverthrow";

const DEFAULT_EUDR = {
  enabled: true,
  deforestationCutoffDate: "2020-12-31",
} as const;

export class EudrTemplate extends BaseDocumentTemplate<string, Record<string, unknown>> {
  readonly type = "eudr";
  readonly modelPath = "models/eudr.yaml";
  readonly name = "EUDR Due-Diligence Statement";
  readonly modelVersion = "1.0";
  override readonly availableFormats: DocumentFormat[] = ["yaml", "xml"];

  constructor(
    private readonly movementRepo: MovementRepository,
    private readonly geoRepo: GeoRepository,
    private readonly animalRepo: AnimalRepository,
    private readonly farmRepo: FarmRepository,
    private readonly system: SystemService,
    private readonly passportRepo: PassportRepository,
    private readonly credentialService: CredentialService,
  ) {
    super();
  }

  async fetchData(refId: string): Promise<Result<string, DocumentError>> {
    if (!refId) {
      return err(documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "animalId is required" }));
    }
    return ok(refId);
  }

  async mapToModel(animalId: string): Promise<Record<string, unknown>> {
    const animal = await this.animalRepo.findById(animalId);
    if (!animal) {
      throw documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "Animal not found", animalId });
    }

    const rsResult = await this.system.getRuleSet();
    if (rsResult.isErr()) {
      throw documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "RuleSet unavailable" });
    }
    const ruleSet = rsResult.value;
    const eudr = ruleSet.eudr ?? DEFAULT_EUDR;

    const result = await runEudrDueDiligence(
      this.movementRepo,
      this.geoRepo,
      ruleSet,
      animalId,
    );

    const declarations = await this.movementRepo.findPastureDeclarationsByAnimalId(animalId);
    const pastureIds = declarations.map((d: { id: string }) => d.id);
    const geofences = pastureIds.length
      ? await this.geoRepo.findGeofencesByPastureIds(pastureIds)
      : [];

    // ── ADR-0084 §14.3: reference the signed credential in the DDS (export token). ──
    let credentialReference: Record<string, unknown> | null = null;
    const passport = await this.passportRepo.findByAnimalId(animalId);
    if (passport) {
      const cred = await this.credentialService.generate({
        type: "passport",
        refId: passport.id,
      });
      if (cred.isOk()) {
        credentialReference = {
          type: "passport",
          sub: passport.id,
          kid: cred.value.payload.kid,
          qrDataUrl: cred.value.qrDataUrl,
          envelope: cred.value.envelope,
        };
      }
    }

    return {
      documentType: "EUDR_DUE_DILIGENCE_STATEMENT",
      regulation: "EUDR 2023/1115",
      animal: {
        id: animal.id,
        earTagNumber: animal.earTagNumber ?? null,
      },
      cutoff: result.cutoff,
      compliant: result.compliant,
      skipped: result.skipped,
      generatedAt: new Date().toISOString(),
      pastures: declarations.map((d: Record<string, unknown>) => ({
        declarationId: d.id,
        pastureType: d.pastureType,
        fromFarmId: d.fromFarmId,
        toFarmId: d.toFarmId,
        departureDate: d.departureDate,
        expectedReturnDate: d.expectedReturnDate,
      })),
      geofences: geofences.map((g: Record<string, unknown>) => ({
        geofenceId: g.id,
        pastureId: g.pastureId ?? null,
        fenceType: g.fenceType,
        cadastralReference: g.cadastralReference ?? null,
        deforestationFreeSince: g.deforestationFreeSince ? String(g.deforestationFreeSince) : null,
        polygonPresent: Boolean(g.polygon),
      })),
      breaches: result.breaches,
      credentialReference,
    };
  }
}
