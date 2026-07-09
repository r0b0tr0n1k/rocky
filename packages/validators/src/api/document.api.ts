// ── Document API Schemas — Diamond Seal ──
//
// Generic document generation endpoint.
// Single endpoint: document.generate(type, refId, format) → DocumentResponse

import { z } from "zod";
import type { NoDriftSimple, ActivateGuillotines } from "../utils/type-bridge.js";

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const documentGenerateRequestSchema = z.strictObject({
  /** Document type — matches the template type (e.g. 'inspection-form', 'passport', 'movement') */
  type: z.string().min(1, "Document type is required"),

  /** UUID of the domain entity (inspection ID, passport ID, movement ID, etc.) */
  refId: z.uuid("refId must be a valid UUID"),

  /** Output format — defaults to 'yaml'. 'xml' supported for future use. */
  format: z.enum(["yaml", "xml"]).default("yaml"),
}) satisfies z.ZodType<DocumentGenerateRequest>;

export interface DocumentGenerateRequest {
  type: string;
  refId: string;
  format: "yaml" | "xml";
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════

export const documentResponseSchema = z.strictObject({
  /** Document type (e.g. 'inspection-form') */
  documentType: z.string(),

  /** Human-readable document name (e.g. 'Inspection Form') */
  documentName: z.string(),

  /** Semantic version of the YAML model used */
  modelVersion: z.string(),

  /** Path to the YAML model file */
  modelPath: z.string(),

  /** ISO 8601 timestamp of generation */
  generatedAt: z.string(),

  /** Output format */
  format: z.enum(["yaml", "xml"]),

  /** The document content as a YAML string */
  content: z.string(),
}) satisfies z.ZodType<DocumentResponse>;

export interface DocumentResponse {
  documentType: string;
  documentName: string;
  modelVersion: string;
  modelPath: string;
  generatedAt: string;
  format: "yaml" | "xml";
  content: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// GUILLOTINES
// ═══════════════════════════════════════════════════════════════════════════

type _drift_documentGenerateRequest = NoDriftSimple<
  z.infer<typeof documentGenerateRequestSchema>,
  DocumentGenerateRequest
>;

type _drift_documentResponse = NoDriftSimple<
  z.infer<typeof documentResponseSchema>,
  DocumentResponse
>;

export type _DocumentGuillotines = ActivateGuillotines<
  [ _drift_documentGenerateRequest, _drift_documentResponse ]
>;
