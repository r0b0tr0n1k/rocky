/**
 * Inspection Form Template
 *
 * Generates YAML output conforming to models/inspection-form.yaml.
 * Delegates `fetchData` to the existing InspectionService.generateInspectionForm()
 * to avoid duplicating the animal query + checkedAnimals population logic.
 *
 * No decorators — plain class instantiated via NestJS useFactory.
 */

import type { InspectionService } from "@rocky/domains-inspection";
import { err, ok, type Result } from "neverthrow";
import { BaseDocumentTemplate } from "../engine/document-template.js";
import { DOCUMENT_ERRORS, documentErr, type DocumentError } from "../errors/document.errors.js";

interface PrintFormInput {
  inspectionId: string;
  language?: string;
}

export class InspectionFormTemplate extends BaseDocumentTemplate<PrintFormInput, Record<string, unknown>> {
  readonly type = "inspection-form";
  readonly modelPath = "models/inspection-form.yaml";
  readonly name = "Inspection Form";
  readonly modelVersion = "1.0";

  constructor(private readonly inspectionService: InspectionService) {
    super();
  }

  async fetchData(refId: string): Promise<Result<PrintFormInput, DocumentError>> {
    if (!refId) {
      return err(documentErr(DOCUMENT_ERRORS.FETCH_FAILED, { reason: "inspectionId is required" }));
    }
    return ok({ inspectionId: refId });
  }

  async mapToModel(input: PrintFormInput): Promise<Record<string, unknown>> {
    const result = await this.inspectionService.generateInspectionForm({
      inspectionId: input.inspectionId,
      language: input.language,
    });

    if (result.isErr()) {
      throw documentErr(DOCUMENT_ERRORS.FETCH_FAILED, {
        reason: result.error.message,
        context: result.error.context,
      });
    }

    const formData = result.value;

    return {
      inspectionForm: {
        formId: formData.formId,
        formVersion: formData.formVersion ?? "1.0",
        generatedAt: formData.generatedAt instanceof Date ? formData.generatedAt.toISOString() : formData.generatedAt,
        language: formData.language ?? "MK",

        farm: {
          farmId: formData.farm.farmId,
          farmIdNumber: formData.farm.farmIdNumber ?? "",
          farmName: formData.farm.farmName ?? null,
          owner: {
            subjectId: formData.farm.owner?.subjectId ?? null,
            shortName: formData.farm.owner?.shortName ?? null,
            personalId: formData.farm.owner?.personalId ?? null,
          },
          keeper: {
            subjectId: formData.farm.keeper?.subjectId ?? null,
            shortName: formData.farm.keeper?.shortName ?? null,
          },
          address: {
            street: formData.farm.address?.street ?? null,
            city: formData.farm.address?.city ?? null,
            zipCode: formData.farm.address?.zipCode ?? null,
            commune: formData.farm.address?.commune ?? null,
            state: formData.farm.address?.state ?? null,
          },
        },

        inspector: {
          inspectorId: formData.inspector.inspectorId,
          shortName: formData.inspector.shortName ?? "",
          vsName: formData.inspector.vsName ?? null,
        },

        riskAnalysis: {
          selectedByRiskAnalysis: formData.riskAnalysis.selectedByRiskAnalysis ?? false,
          riskScore: formData.riskAnalysis.riskScore ?? null,
          riskCriteria: formData.riskAnalysis.riskCriteria ?? null,
          analysisPeriod: formData.riskAnalysis.analysisPeriod ?? null,
        },

        scheduledDate: formData.scheduledDate ?? null,
        inspectionDate: formData.inspectionDate ?? null,

        animals: (formData.animals ?? []).map((a: Record<string, unknown>) => ({
          animalId: a.animalId,
          earTagNumber: a.earTagNumber,
          stateCode: a.stateCode,
          sex: a.sex,
          breed: a.breed ?? null,
          birthDate: a.birthDate ?? null,
          motherId: a.motherId ?? null,
          currentStatus: a.currentStatus,
          tagPresent: a.tagPresent ?? null,
          tagCorrect: a.tagCorrect ?? null,
          animalPresent: a.animalPresent ?? null,
          discrepancyNote: a.discrepancyNote ?? null,
        })),

        result: {
          overallResult: formData.result?.overallResult ?? null,
          discrepanciesFound: formData.result?.discrepanciesFound ?? false,
          notes: formData.result?.notes ?? null,
        },

        signature: {
          keeperSigned: formData.signature?.keeperSigned ?? false,
          signedAt: formData.signature?.signedAt ?? null,
        },

        lifecycle: {
          formPrinted: formData.lifecycle?.formPrinted ?? true,
          formReturned: formData.lifecycle?.formReturned ?? false,
          storedAtVi: formData.lifecycle?.storedAtVi ?? false,
          retentionExpiry: formData.lifecycle?.retentionExpiry ?? null,
        },
      },
    };
  }
}
