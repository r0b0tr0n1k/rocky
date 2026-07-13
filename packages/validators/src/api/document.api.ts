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

  /** Output format — 'yaml' (default), 'xml', or 'pdf' (signed PDF/A-3). */
  format: z.enum(["yaml", "xml", "pdf"]).default("yaml"),
}) satisfies z.ZodType<DocumentGenerateRequest>;

export interface DocumentGenerateRequest {
  type: string;
  refId: string;
  format: "yaml" | "xml" | "pdf";
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
  format: z.enum(["yaml", "xml", "pdf"]),

  /** The document content — YAML/XML text, or base64 PDF for 'pdf'. */
  content: z.string(),
}) satisfies z.ZodType<DocumentResponse>;

export interface DocumentResponse {
  documentType: string;
  documentName: string;
  modelVersion: string;
  modelPath: string;
  generatedAt: string;
  format: "yaml" | "xml" | "pdf";
  content: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// VERIFY SCHEMAS (PAdES QR verification loop)
// ═══════════════════════════════════════════════════════════════════════════

/** Request: re-derive + verify a document's PAdES seal by type + refId. */
export const documentVerifyRequestSchema = z.strictObject({
  type: z.string().min(1, "Document type is required"),
  refId: z.uuid("refId must be a valid UUID"),
}) satisfies z.ZodType<DocumentVerifyRequest>;

export interface DocumentVerifyRequest {
  type: string;
  refId: string;
}

/** Response: signature facts + document metadata (no PII beyond the doc id). */
export const documentVerifyResponseSchema = z.strictObject({
  documentType: z.string(),
  documentName: z.string(),
  modelVersion: z.string(),
  generatedAt: z.string(),
  refId: z.string(),
  valid: z.boolean(),
  signerSubject: z.string().nullable(),
  signerIssuer: z.string().nullable(),
  serialNumber: z.string().nullable(),
  algorithm: z.string().nullable(),
  signedAt: z.string().nullable(),
  hasTimestamp: z.boolean(),
  timestampedAt: z.string().nullable(),
  hasRevocation: z.boolean(),
  message: z.string(),
}) satisfies z.ZodType<DocumentVerifyResult>;

export interface DocumentVerifyResult {
  documentType: string;
  documentName: string;
  modelVersion: string;
  generatedAt: string;
  refId: string;
  valid: boolean;
  signerSubject: string | null;
  signerIssuer: string | null;
  serialNumber: string | null;
  algorithm: string | null;
  signedAt: string | null;
  hasTimestamp: boolean;
  timestampedAt: string | null;
  hasRevocation: boolean;
  message: string;
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

type _drift_documentVerifyRequest = NoDriftSimple<
  z.infer<typeof documentVerifyRequestSchema>,
  DocumentVerifyRequest
>;

type _drift_documentVerifyResponse = NoDriftSimple<
  z.infer<typeof documentVerifyResponseSchema>,
  DocumentVerifyResult
>;

// ═══════════════════════════════════════════════════════════════════════════
// CREDENTIAL SCHEMAS (offline-verifiable signed QR — ADR-0084)
// ═══════════════════════════════════════════════════════════════════════════

/** Request: build + sign a credential for an entity. */
export const documentCredentialRequestSchema = z.strictObject({
  type: z.string().min(1, "Document type is required"),
  refId: z.uuid("refId must be a valid UUID"),
}) satisfies z.ZodType<DocumentCredentialRequest>;

export interface DocumentCredentialRequest {
  type: string;
  refId: string;
}

/** Canonical credential payload (what the QR signs over). */
export const credentialPayloadViewSchema = z.strictObject({
  iss: z.string(),
  sub: z.string(),
  typ: z.string(),
  iat: z.number(),
  exp: z.number(),
  kid: z.string(),
  farmId: z.string().optional(),
  species: z.string().optional(),
  facilityId: z.string().optional(),
  operatorId: z.string().optional(),
}) satisfies z.ZodType<CredentialPayloadView>;

export interface CredentialPayloadView {
  iss: string;
  sub: string;
  typ: string;
  iat: number;
  exp: number;
  kid: string;
  farmId?: string;
  species?: string;
  facilityId?: string;
  operatorId?: string;
}

/** Response: the wire envelope + printable QR data URL (and decoded payload). */
export const documentCredentialResponseSchema = z.strictObject({
  envelope: z.string(),
  qrDataUrl: z.string(),
  payload: credentialPayloadViewSchema,
}) satisfies z.ZodType<DocumentCredentialResponse>;

export interface DocumentCredentialResponse {
  envelope: string;
  qrDataUrl: string;
  payload: CredentialPayloadView;
}

/** Request: verify a raw credential QR string (scanned / pasted). */
export const documentCredentialVerifyRequestSchema = z.strictObject({
  qr: z.string().min(1, "Credential QR string is required"),
}) satisfies z.ZodType<DocumentCredentialVerifyRequest>;

export interface DocumentCredentialVerifyRequest {
  qr: string;
}

/** Response: signature validity + decoded payload + credential status-list note. */
export const documentCredentialVerifyResponseSchema = z.strictObject({
  valid: z.boolean(),
  expired: z.boolean(),
  kid: z.string(),
  algorithm: z.string(),
  payload: credentialPayloadViewSchema,
  message: z.string(),
}) satisfies z.ZodType<DocumentCredentialVerifyResponse>;

export interface DocumentCredentialVerifyResponse {
  valid: boolean;
  expired: boolean;
  kid: string;
  algorithm: string;
  payload: CredentialPayloadView;
  message: string;
}

type _drift_documentCredentialRequest = NoDriftSimple<
  z.infer<typeof documentCredentialRequestSchema>,
  DocumentCredentialRequest
>;
type _drift_documentCredentialResponse = NoDriftSimple<
  z.infer<typeof documentCredentialResponseSchema>,
  DocumentCredentialResponse
>;
type _drift_documentCredentialVerifyRequest = NoDriftSimple<
  z.infer<typeof documentCredentialVerifyRequestSchema>,
  DocumentCredentialVerifyRequest
>;
type _drift_documentCredentialVerifyResponse = NoDriftSimple<
  z.infer<typeof documentCredentialVerifyResponseSchema>,
  DocumentCredentialVerifyResponse
>;

export type _DocumentGuillotines = ActivateGuillotines<
  [ _drift_documentGenerateRequest, _drift_documentResponse, _drift_documentVerifyRequest, _drift_documentVerifyResponse, _drift_documentCredentialRequest, _drift_documentCredentialResponse, _drift_documentCredentialVerifyRequest, _drift_documentCredentialVerifyResponse ]
>;
