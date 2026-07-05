/**
 * DocumentService — Orchestrator
 *
 * The public API for document generation.
 *   documentService.generate('inspection-form', refId, 'yaml') → { content, documentType, ... }
 *
 * Flow:
 *   1. Look up template in DocumentRegistry
 *   2. Template.fetchData(refId) → domain data
 *   3. Template.mapToModel(data) → YAML-conformant model
 *   4. YamlSerializer.serialize(model) → YAML string
 *   5. Return DocumentResponse with metadata
 */

import { Injectable } from "@nestjs/common";
import { err, ok, type Result } from "neverthrow";
import { DocumentRegistry } from "../engine/document-registry.js";
import { type DocumentFormat, isFormatSupported, serializeToYaml } from "../engine/yaml-serializer.js";
import { DOCUMENT_ERRORS, documentErr, type DocumentError } from "../errors/document.errors.js";

export interface DocumentGenerateInput {
  type: string;
  refId: string;
  format?: string;
}

export interface DocumentResponse {
  documentType: string;
  documentName: string;
  modelVersion: string;
  modelPath: string;
  generatedAt: string;
  format: DocumentFormat;
  content: string;
}

@Injectable()
export class DocumentService {
  /**
   * Generate a document of the specified type.
   *
   * @param input.type - Document type (e.g. 'inspection-form', 'passport', 'movement')
   * @param input.refId - UUID of the domain entity
   * @param input.format - Output format ('yaml' | 'xml'). Defaults to 'yaml'
   * @returns DocumentResponse with YAML/XML content and metadata
   */
  async generate(input: DocumentGenerateInput): Promise<Result<DocumentResponse, DocumentError>> {
    const { type, refId, format = "yaml" } = input;

    // 1. Validate format
    if (!isFormatSupported(format)) {
      return err(documentErr(DOCUMENT_ERRORS.UNSUPPORTED_FORMAT, { format, supportedFormats: ["yaml", "xml"] }));
    }

    // 2. Look up template
    const registry = DocumentRegistry.getInstance();
    const templateResult = registry.get(type);
    if (templateResult.isErr()) {
      return err(templateResult.error);
    }

    const template = templateResult.value;

    // 3. Fetch domain data
    const dataResult = await template.fetchData(refId);
    if (dataResult.isErr()) {
      return err(dataResult.error);
    }

    // 4. Map to model
    let model: Record<string, unknown>;
    try {
      model = await template.mapToModel(dataResult.value);
    } catch (mapError) {
      return err(
        documentErr(DOCUMENT_ERRORS.VALIDATION_FAILED, {
          message: mapError instanceof Error ? mapError.message : "Unknown error in mapToModel",
          type,
        }),
      );
    }

    // 5. Serialize to YAML
    const serialized = serializeToYaml(model);
    if (serialized.isErr()) {
      return err(serialized.error);
    }

    return ok({
      documentType: type,
      documentName: template.name,
      modelVersion: template.modelVersion,
      modelPath: template.modelPath,
      generatedAt: new Date().toISOString(),
      format: format as DocumentFormat,
      content: serialized.value,
    });
  }
}
