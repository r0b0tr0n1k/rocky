// ── CHED-A API Schemas — Diamond Seal (WO-121, R9 IMSOC 2019/1715) ──
//
// CHED-A (Common Health Entry Document — Animals) generation for TRACES NT.
// The generic document.generate endpoint (type "ched-a") is the transport; this
// schema is the declared contract for CHED requests and the CHED data model.

import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMA (defensive: constrains type to the CHED-A literal)
// ═══════════════════════════════════════════════════════════════════════════

export const generateChedRequestSchema = z.strictObject({
  /** Document type — must be the CHED-A template literal. */
  type: z.literal("ched-a"),

  /** UUID of the outbound movement the CHED is generated for. */
  refId: z.uuid("refId must be a valid UUID"),

  /** Output format — CHED defaults to xml for TRACES NT import. */
  format: z.enum(["yaml", "xml"]).default("xml"),
}) satisfies z.ZodType<GenerateChedRequest>;

export interface GenerateChedRequest {
  type: "ched-a";
  refId: string;
  format: "yaml" | "xml";
}

// ═══════════════════════════════════════════════════════════════════════════
// MODEL SCHEMA (structural; the template builds it imperatively)
// ═══════════════════════════════════════════════════════════════════════════

export const chedModelSchema = z
  .object({
    chedType: z.literal("CHED-A"),
    documentType: z.string(),
    consignment: z.record(z.string(), z.unknown()),
    originHolding: z.record(z.string(), z.unknown()),
    destination: z.record(z.string(), z.unknown()),
    animals: z.array(z.record(z.string(), z.unknown())),
    healthAttestations: z.record(z.string(), z.unknown()),
    transport: z.record(z.string(), z.unknown()),
    kdes: z.array(z.object({ element: z.string(), value: z.unknown() })),
  })
  .passthrough();
