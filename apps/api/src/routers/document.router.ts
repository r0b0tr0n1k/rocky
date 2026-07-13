// --- Document Router - Generic Document Generation ---
//
// Single endpoint: document.generate(type, refId, format) -> DocumentResponse
// Supports all registered document types (inspection-form, passport, movement, etc.)

import { Inject, Injectable } from "@nestjs/common";
import { ExecutionEventEmitter } from "@rocky/execution/index.js";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import type { DocumentGenerateInput } from "@rocky/pdf/index.js";
import { DocumentService } from "@rocky/pdf/index.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import {
  documentGenerateRequestSchema,
  documentResponseSchema,
  documentVerifyRequestSchema,
  documentVerifyResponseSchema,
  documentCredentialRequestSchema,
  documentCredentialResponseSchema,
  documentCredentialVerifyRequestSchema,
  documentCredentialVerifyResponseSchema,
} from "@rocky/validators/api/index.js";
import { DOCUMENT_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { documentStatusListResponseSchema } from "@rocky/validators/api/index.js";
import { CredentialStatusListService } from "../pdf/status-list.service.js";
import { Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";
import type { SubtypeGuillotine, ActivateGuillotines } from "@rocky/validators/utils";

const unwrap = createResultUnwrapper(DOCUMENT_TRPC_ERROR_MAP);


// Named output schemas (were inline) — required so Bridge 2b can reference
// `z.output<typeof X>` and prove the declared contract vs the service Result.
const listTypesSchema = z.array(z.string());
@Router({ alias: "document" })
@RegisterPolicy("document")
@Policy({ authenticated: true })
@Injectable()
export class DocumentRouter {
  constructor(
    @Inject(DocumentService) private readonly documentService: DocumentService,
    @Inject(ExecutionEventEmitter) private readonly eventEmitter: ExecutionEventEmitter,
    @Inject(CredentialStatusListService) private readonly statusListService: CredentialStatusListService,
  ) { }

  /**
   * Generate a document of the specified type.
   *
   * Example: document.generate({ type: 'inspection-form', refId: 'uuid-here', format: 'yaml' })
   * Returns YAML content + metadata.
   */
  @Mutation({ input: documentGenerateRequestSchema, output: documentResponseSchema })
  async generate(@Input() input: DocumentGenerateInput) {
    const result = await this.documentService.generate(input);
    if (result.isOk()) {
      this.eventEmitter.emit({
        type: "document:generated",
        documentType: result.value.documentType,
        refId: input.refId,
        format: result.value.format,
        timestamp: new Date(),
      });
    }
    return unwrap(result);
  }

  @Query({ input: documentVerifyRequestSchema, output: documentVerifyResponseSchema })
  async verify(@Input() input: { type: string; refId: string }) {
    const result = await this.documentService.verify(input);
    return unwrap(result);
  }

  /**
   * Build + sign an offline-verifiable credential QR for an entity (ADR-0084).
   * Returns the wire envelope + a QR data URL; the same envelope is also
   * embedded on the entity's PDF (on-document QR, ADR-0084 §7).
   */
  @Query({ input: documentCredentialRequestSchema, output: documentCredentialResponseSchema })
  async credential(@Input() input: { type: string; refId: string }) {
    const result = await this.documentService.credential(input);
    return unwrap(result);
  }

  /**
   * Verify a raw credential QR string (scanned / pasted) against the pinned
   * public key. `valid` means the signature is intact — callers still consult
   * the credential status list to decide revoked / expired (ADR-0084 §4).
   */
  @Query({ input: documentCredentialVerifyRequestSchema, output: documentCredentialVerifyResponseSchema })
  async verifyCredential(@Input() input: { qr: string }) {
    return this.documentService.verifyCredential(input.qr);
  }

  /**
   * List all available document types.
   */
  @Query({ input: z.object({}).optional(), output: listTypesSchema })
  async listTypes() {
    const { DocumentRegistry } = await import("@rocky/pdf/index.js");
    const registry = DocumentRegistry.getInstance();
    return registry.listTypes();
  }

  /**
   * Current credential status list (ADR-0084 §4) — a CRL-style revocation
   * list sourced from in-domain state machines (passport SEIZED / CANCELLED).
   * The verifier surfaces `list.issuedAt` as "status list last synced".
   */
  @Query({ input: z.object({}).optional(), output: documentStatusListResponseSchema })
  async statusList() {
    const list = await this.statusListService.buildStatusList();
    return { list, lastSyncedIso: list.issuedAt };
  }
}

// SubtypeGuillotine (one-directional: schema output ⊆ return type) — response
// schemas are Drizzle-derived projections; the hand-written interface is the
// wider SSOT, so AssertEqual would false-positive. See audit G3.
type _verify_generateOutput = SubtypeGuillotine<
  z.output<typeof documentResponseSchema>,
  Awaited<ReturnType<DocumentRouter["generate"]>>
>;
type _verify_listTypesOutput = SubtypeGuillotine<
  z.output<typeof listTypesSchema>,
  Awaited<ReturnType<DocumentRouter["listTypes"]>>
>;
type _verify_verifyOutput = SubtypeGuillotine<
  z.output<typeof documentVerifyResponseSchema>,
  Awaited<ReturnType<DocumentRouter["verify"]>>
>;
type _verify_credentialOutput = SubtypeGuillotine<
  z.output<typeof documentCredentialResponseSchema>,
  Awaited<ReturnType<DocumentRouter["credential"]>>
>;
type _verify_verifyCredentialOutput = SubtypeGuillotine<
  z.output<typeof documentCredentialVerifyResponseSchema>,
  Awaited<ReturnType<DocumentRouter["verifyCredential"]>>
>;
type _verify_statusListOutput = SubtypeGuillotine<
  z.output<typeof documentStatusListResponseSchema>,
  Awaited<ReturnType<DocumentRouter["statusList"]>>
>;

export type _DocumentGuillotines = ActivateGuillotines<[
  _verify_generateOutput,
  _verify_listTypesOutput,
  _verify_verifyOutput,
  _verify_credentialOutput,
  _verify_verifyCredentialOutput,
  _verify_statusListOutput
]>;
