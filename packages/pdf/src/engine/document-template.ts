/**
 * DocumentTemplate Interface & Base Class
 *
 * The core abstraction for document generation.
 * Every printable document type implements this interface.
 *
 * Architecture:
 *   DocumentTemplate.fetchData(refId) → domain data
 *   DocumentTemplate.mapToModel(data) → YAML-conformant model object
 *   YamlSerializer.serialize(model) → YAML string
 *
 * Adding a new document type = implement this interface + register in DocumentRegistry.
 */

import type { Result } from "neverthrow";
import type { DocumentError } from "../errors/document.errors.js";
import type { DocumentFormat } from "./yaml-serializer.js";

export interface DocumentTemplate<TData = unknown, TModel extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique type identifier matching the YAML model filename (e.g. 'inspection-form') */
  readonly type: string;

  /** Relative path to the YAML model (e.g. 'models/inspection-form.yaml') */
  readonly modelPath: string;

  /** Human-readable document name (e.g. 'Inspection Form') */
  readonly name: string;

  /** Supported output formats */
  readonly availableFormats: DocumentFormat[];

  /** Semantic version from the YAML model */
  readonly modelVersion: string;

  /**
   * Fetch domain data needed to build the document.
   * Each template knows what repositories to query.
   */
  fetchData(refId: string): Promise<Result<TData, DocumentError>>;

  /**
   * Map fetched domain data to the YAML model structure.
   * Should be a pure function — no side effects. Can be async for complex transformations.
   */
  mapToModel(data: TData): TModel | Promise<TModel>;
}

/**
 * Base class providing common template functionality.
 * Extend this instead of implementing DocumentTemplate directly.
 */
export abstract class BaseDocumentTemplate<TData, TModel extends Record<string, unknown>>
  implements DocumentTemplate<TData, TModel>
{
  abstract readonly type: string;
  abstract readonly modelPath: string;
  abstract readonly name: string;
  abstract readonly modelVersion: string;

  readonly availableFormats: DocumentFormat[] = ["yaml"];

  abstract fetchData(refId: string): Promise<Result<TData, DocumentError>>;
  abstract mapToModel(data: TData): TModel | Promise<TModel>;
}
