/**
 * DocumentRegistry
 *
 * Pluggable singleton registry for document templates.
 * Templates register themselves on init. The generic document.generate
 * endpoint looks up templates by type.
 *
 * Design:
 * - Synchronous registration (templates added at module init)
 * - Runtime lookup by type string
 * - Type-safe via TypeScript generics on lookup
 * - Error sovereignty: lookup returns Result
 */

import { err, ok, type Result } from "neverthrow";
import type { DocumentError } from "../errors/document.errors.js";
import { DOCUMENT_ERRORS, documentErr } from "../errors/document.errors.js";
import type { DocumentTemplate } from "./document-template.js";

export class DocumentRegistry {
  private static instance: DocumentRegistry;
  private readonly templates = new Map<string, DocumentTemplate>();

  private constructor() { }

  /** Get the singleton instance */
  static getInstance(): DocumentRegistry {
    if (!DocumentRegistry.instance) {
      DocumentRegistry.instance = new DocumentRegistry();
    }
    return DocumentRegistry.instance;
  }

  /** Register a template. Overwrites if type already exists. */
  register(template: DocumentTemplate): void {
    this.templates.set(template.type, template);
  }

  /** Look up a template by type string. Returns Result for error sovereignty. */
  get(type: string): Result<DocumentTemplate, DocumentError> {
    const template = this.templates.get(type);
    if (!template) {
      return err(
        documentErr(DOCUMENT_ERRORS.TEMPLATE_NOT_FOUND, {
          type,
          availableTypes: Array.from(this.templates.keys()),
        }),
      );
    }
    return ok(template);
  }

  /** Check if a template type is registered */
  has(type: string): boolean {
    return this.templates.has(type);
  }

  /** List all registered template types */
  listTypes(): string[] {
    return Array.from(this.templates.keys());
  }

  /** Get the number of registered templates */
  get size(): number {
    return this.templates.size;
  }
}
