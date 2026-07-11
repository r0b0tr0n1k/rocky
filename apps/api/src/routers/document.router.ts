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
} from "@rocky/validators/api/index.js";
import { DOCUMENT_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
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

  /**
   * List all available document types.
   */
  @Query({ input: z.object({}).optional(), output: listTypesSchema })
  async listTypes() {
    const { DocumentRegistry } = await import("@rocky/pdf/index.js");
    const registry = DocumentRegistry.getInstance();
    return registry.listTypes();
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

export type _DocumentGuillotines = ActivateGuillotines<[
  _verify_generateOutput,
  _verify_listTypesOutput
]>;
