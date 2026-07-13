// ── @rocky/pdf ──
// Document generation framework — YAML/XML intermediate output with pluggable PDF engine (future).

// Engine
export { DocumentRegistry } from "./engine/document-registry.js";
export { type DocumentTemplate, BaseDocumentTemplate } from "./engine/document-template.js";
export { serializeToYaml, isFormatSupported } from "./engine/yaml-serializer.js";
export type { DocumentFormat } from "./engine/yaml-serializer.js";

// Module
export { PdfModule } from "./pdf.module.js";

// Templates
export { InspectionFormTemplate } from "./templates/inspection-form.template.js";
export { PassportTemplate } from "./templates/passport.template.js";
export { MovementTemplate } from "./templates/movement.template.js";
export { ChedTemplate } from "./templates/ched.template.js";
export { EudrTemplate } from "./templates/eudr.template.js";
export { EarTagTemplate } from "./templates/ear-tag.template.js";

// Services
export { DocumentService } from "./services/document.service.js";
export type { DocumentGenerateInput, DocumentResponse, DocumentVerifyResult } from "./services/document.service.js";

// Errors
export { DocumentError, DOCUMENT_ERRORS, documentErr } from "./errors/document.errors.js";
export type { DocumentErrorCode } from "./errors/document.errors.js";

// QR (ear-tag linkage artifact)
export { generateQrPng, generateQrSvg, generateQrDataUrl } from "./engine/qr.js";

// Sign stage (PAdES / LTV)
export { type PdfSigner, NoOpSigner, Pkcs12Signer, HsmSigner, extractSignature } from "./sign/index.js";
export type { Pkcs12SignerOptions, HsmSignerOptions, SignatureInfo } from "./sign/index.js";
export { type TimestampAuthority, FakeTimestampAuthority, HttpTsaClient } from "./sign/timestamp.js";

// Credential signer (offline-verifiable signed QR — ADR-0084)
export {
  signCredential,
  verifyCredential,
  encodePayload,
  decodePayload,
  decodeEnvelope,
  encodeEnvelope,
  generateKeyPair,
} from "./credential/credential.js";
export type { CredentialPayload, CredentialEnvelope, CredentialVerifyResult, CredentialSeed } from "./credential/credential.js";
export { glnFromId, glnCheckDigit, isValidGln } from "./credential/gs1.js";

// Credential service (server-side sign/verify orchestration — ADR-0084)
export { CredentialService } from "./services/credential.service.js";
export type { CredentialOutput, CredentialResponseView, CredentialVerifyView, CredentialKeyConfig } from "./services/credential.service.js";

// PDF image embedding (on-document credential QR — ADR-0084 §7)
export { embedQrPng } from "./engine/pdf-embed.js";
export type { EmbedQrOptions } from "./engine/pdf-embed.js";

// Credential status list (ADR-0084 §4) — pure CRL-style publisher model.
export {
  buildCredentialStatusList,
  passportStatusToCredentialStatus,
  movementStateToCredentialStatus,
  isStatusListStale,
  resolveStatus,
} from "./credential/status-list.js";
export type {
  CredentialStatus,
  CredentialStatusList,
  CredentialStatusListEntry,
  BuildStatusListOptions,
} from "./credential/status-list.js";
