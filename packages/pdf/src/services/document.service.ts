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

import { Inject, Injectable } from "@nestjs/common";
import { AFRelationship } from "@cantoo/pdf-lib";
import { err, ok, type Result } from "neverthrow";
import { DocumentRegistry } from "../engine/document-registry.js";
import {
  type DocumentFormat,
  isFormatSupported,
  serializeToYaml,
  serializeToXml,
} from "../engine/yaml-serializer.js";
import { DOCUMENT_ERRORS, documentErr, DocumentError } from "../errors/document.errors.js";
import { buildDocumentModelInputs, GENERIC_DOCUMENT_TYPST } from "../engine/typst-document.template.js";
import { renderTypst } from "../engine/typst-renderer.js";
import { wrapPdfA3 } from "../engine/pdfa3.js";
import { NoOpSigner, type PdfSigner, extractSignature, type SignatureInfo } from "../sign/index.js";
import { CredentialService, type CredentialResponseView, type CredentialVerifyView } from "./credential.service.js";
import { type CredentialBatchManifest } from "../credential/batch.js";
import { embedQrPng } from "../engine/pdf-embed.js";

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

/** Result of `DocumentService.verify` — signature facts plus document metadata. */
export interface DocumentVerifyResult extends SignatureInfo {
  documentType: string;
  documentName: string;
  modelVersion: string;
  generatedAt: string;
  refId: string;
}

@Injectable()
export class DocumentService {
  /**
   * The universal sign stage (ADR-0082 §2). Defaults to `NoOpSigner` so local
   * development and deterministic tests stay unsigned; production wires a real
   * seal via `useSigner(new HsmSigner(...))` or `new Pkcs12Signer(...)`.
   */
  private signer: PdfSigner = new NoOpSigner();

  constructor(
    @Inject(CredentialService) private readonly credentialService: CredentialService = new CredentialService(),
  ) {}

  /** Replace the active signer (e.g. with `HsmSigner` at bootstrap). */
  useSigner(signer: PdfSigner): void {
    this.signer = signer;
  }
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
      // Preserve a domain DocumentError (e.g. CHED_PRECONDITION_FAILED) instead of
      // collapsing it into VALIDATION_FAILED.
      if (mapError instanceof DocumentError) return err(mapError);
      return err(
        documentErr(DOCUMENT_ERRORS.VALIDATION_FAILED, {
          message: mapError instanceof Error ? mapError.message : "Unknown error in mapToModel",
          type,
        }),
      );
    }

    // 5. Serialize / render to the requested format.
    //    yaml | xml  → text intermediate (stable API, ADR-0009)
    //    pdf        → Typst visual render → base64 PDF (PDF/A-3 wrap via
    //                 @cantoo/pdf-lib + PAdES seal by the active signer)
    // The YAML intermediate is the canonical source (ADR-0009). It is returned
    // directly for yaml/xml formats and embedded into the PDF/A-3 hybrid below.
    const yamlResult = serializeToYaml(model);

    if (format === "pdf") {
      const inputs = buildDocumentModelInputs(model, {
        title: template.name,
        subtitle: `${template.type} · v${template.modelVersion}`,
      });
      let pdf: Uint8Array;
      try {
        pdf = await renderTypst({ template: GENERIC_DOCUMENT_TYPST, inputs });
      } catch (renderError) {
        return err(
          documentErr(DOCUMENT_ERRORS.SERIALIZATION_FAILED, {
            message: renderError instanceof Error ? renderError.message : "Typst render failed",
            type,
          }),
        );
      }

      // On-document credential QR (ADR-0084 §7): if the template supports
      // credentials and a signing key is configured, stamp the self-contained
      // signed QR onto the visual before wrapping. Best-effort — embed
      // failure falls back to the un-embedded visual.
      let pdfToWrap = pdf;
      if (this.credentialService.hasSigningKey() && typeof template.mapToCredential === "function") {
        const cred = await this.credentialService.generate({ type, refId });
        if (cred.isOk()) {
          try {
            pdfToWrap = await embedQrPng(pdf, cred.value.qrPng, {
              label: `${type} · scan to verify`,
            });
          } catch {
            pdfToWrap = pdf;
          }
        }
      }

      // Wrap as PDF/A-3 (embed the source YAML as an associated file) and then
      // seal with the configured signer (PAdES). The signer is the universal
      // sign stage (ADR-0082 §2); the default NoOpSigner keeps non-prod
      // deterministic, but production must wire HsmSigner/Pkcs12Signer so no
      // unsigned PDF ever egresses.
      const sourceBytes = new TextEncoder().encode(
        yamlResult.isOk() ? yamlResult.value : "",
      );
      let sealed: Uint8Array;
      try {
        const pdfa3 = await wrapPdfA3({
          pdf: pdfToWrap,
          attachments: [
            {
              filename: `${type}.yaml`,
              buffer: sourceBytes,
              mimeType: "application/yaml",
              description: `${template.name} source (ADR-0009 intermediate)`,
              afRelationship: AFRelationship.Alternative,
            },
          ],
          meta: {
            title: template.name,
            subject: `${template.name} · ${refId}`,
            author: "Rocky",
            creator: "Rocky PDF Service",
            producer: "Rocky PDF Service",
            keywords: [template.type, "PDF/A-3"],
            language: "en",
            documentId: refId,
            conformance: "B",
          },
        });
        sealed = await this.signer.sign(pdfa3);
      } catch (sealError) {
        return err(
          documentErr(DOCUMENT_ERRORS.SERIALIZATION_FAILED, {
            message: sealError instanceof Error ? sealError.message : "PDF/A-3 wrap or PAdES sign failed",
            type,
          }),
        );
      }

      return ok({
        documentType: type,
        documentName: template.name,
        modelVersion: template.modelVersion,
        modelPath: template.modelPath,
        generatedAt: new Date().toISOString(),
        format: "pdf",
        content: Buffer.from(sealed).toString("base64"),
      });
    }

    const serialized = format === "xml" ? serializeToXml(model) : yamlResult;
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

  /**
   * Verify a document: regenerate it (signed, with the active seal) and read
   * the PAdES signature facts back out. This is the server side of the QR
   * verification loop (ADR-0082): a third party can confirm the document is
   * sealed and, if LTV was applied, timestamped + revocation-archived.
   */
  async verify(input: { type: string; refId: string }): Promise<Result<DocumentVerifyResult, DocumentError>> {
    const gen = await this.generate({ ...input, format: "pdf" });
    if (gen.isErr()) return err(gen.error);
    const pdf = Buffer.from(gen.value.content, "base64");
    const signature = extractSignature(pdf);
      return ok({
        documentType: gen.value.documentType,
        documentName: gen.value.documentName,
        modelVersion: gen.value.modelVersion,
        generatedAt: gen.value.generatedAt,
        refId: input.refId,
        ...signature,
      });
  }

  /**
   * Produce an offline-verifiable signed-QR credential for an entity (ADR-0084).
   * Delegates to `CredentialService`, which signs with the configured Ed25519
   * key and returns the wire envelope + printable QR forms.
   */
  credential(input: { type: string; refId: string }): Promise<Result<CredentialResponseView, DocumentError>> {
    return this.credentialService.generate(input);
  }

  /**
   * Verify a credential envelope string against the pinned public key (ADR-0084).
   * `valid` means the signature is intact — callers still consult the credential
   * status list to decide revoked / expired.
   */
  /**
   * Produce a batch of offline-verifiable signed-QR credentials in one session
   * (ADR-0084 §6 — HSM bulk throughput) and return the digest-protected batch
   * manifest. Delegates to `CredentialService.signBatch`.
   */
  credentialBatch(
    inputs: { type: string; refId: string }[],
  ): Promise<Result<CredentialBatchManifest, DocumentError>> {
    return this.credentialService.signBatch(inputs);
  }

  verifyCredential(envelope: string): CredentialVerifyView {
    return this.credentialService.verify(envelope);
  }
}
