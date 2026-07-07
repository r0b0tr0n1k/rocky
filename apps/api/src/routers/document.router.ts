// --- Document Router - Generic Document Generation ---
//
// Single endpoint: document.generate(type, refId, format) -> DocumentResponse
// Supports all registered document types (inspection-form, passport, movement, etc.)

import { Inject, Injectable } from "@nestjs/common";
import { Policy, RegisterPolicy } from "@rocky/authorization/index.js";
import type { DocumentGenerateInput } from "@rocky/pdf/index.js";
import { DocumentService } from "@rocky/pdf/index.js";
import { createResultUnwrapper } from "@rocky/trpc/index.js";
import { documentGenerateRequestSchema } from "@rocky/validators/api/index.js";
import { DOCUMENT_TRPC_ERROR_MAP } from "@rocky/validators/errors/index.js";
import { Input, Mutation, Query, Router } from "nestjs-trpc";
import { z } from "zod";

const unwrap = createResultUnwrapper(DOCUMENT_TRPC_ERROR_MAP);

@Router({ alias: "document" })
@RegisterPolicy("document")
@Policy({ authenticated: true })
@Injectable()
export class DocumentRouter {
  constructor(@Inject(DocumentService) private readonly documentService: DocumentService) { }

  /**
   * Generate a document of the specified type.
   *
   * Example: document.generate({ type: 'inspection-form', refId: 'uuid-here', format: 'yaml' })
   * Returns YAML content + metadata.
   */
  @Mutation({ input: documentGenerateRequestSchema })
  async generate(@Input() input: DocumentGenerateInput) {
    return unwrap(await this.documentService.generate(input));
  }

  /**
   * List all available document types.
   */
  @Query({ input: z.object({}).optional() })
  async listTypes() {
    const { DocumentRegistry } = await import("@rocky/pdf/index.js");
    const registry = DocumentRegistry.getInstance();
    return registry.listTypes();
  }
}
