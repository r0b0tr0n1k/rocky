/**
 * YAML Serializer
 *
 * Wraps js-yaml for document generation.
 * Converts document model objects to clean YAML strings.
 * Handles custom types (Date, UUID, etc.) for human-readable output.
 */

import yaml from "js-yaml";
import { err, ok, type Result } from "neverthrow";
import type { DocumentError } from "../errors/document.errors.js";
import { DOCUMENT_ERRORS, documentErr } from "../errors/document.errors.js";

export type DocumentFormat = "yaml" | "xml";

/**
 * Serialize a document model object to YAML.
 * Returns a Result — serialization failures are caught and wrapped.
 */
export function serializeToYaml(data: Record<string, unknown>): Result<string, DocumentError> {
  try {
    const processed = processDates(data);
    const output = yaml.dump(processed, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false,
      forceQuotes: false,
      quotingType: '"',
    });
    return ok(output);
  } catch (cause) {
    return err(
      documentErr(DOCUMENT_ERRORS.SERIALIZATION_FAILED, {
        message: cause instanceof Error ? cause.message : "Unknown serialization error",
      }),
    );
  }
}

/**
 * Validate output format is supported.
 */
export function serializeToXml(data: Record<string, unknown>): Result<string, DocumentError> {
  try {
    return ok(valueToXml(data, null));
  } catch (cause) {
    return err(
      documentErr(DOCUMENT_ERRORS.SERIALIZATION_FAILED, {
        message: cause instanceof Error ? cause.message : "Unknown XML serialization error",
      }),
    );
  }
}

function valueToXml(value: unknown, key: string | null): string {
  if (value === null || value === undefined) {
    return key ? `  <${key} xsi:nil="true"/>\n` : "";
  }
  if (Array.isArray(value)) {
    return value.map((item) => valueToXml(item, key ?? "item")).join("");
  }
  if (value instanceof Date) {
    return key ? `  <${key}>${value.toISOString()}</${key}>\n` : value.toISOString();
  }
  if (typeof value === "object") {
    const inner = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => valueToXml(v, k))
      .join("");
    return key ? `  <${key}>\n${inner}  </${key}>\n` : inner;
  }
  const text = String(value);
  return key ? `  <${key}>${escapeXml(text)}</${key}>\n` : escapeXml(text);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export function isFormatSupported(format: string): format is DocumentFormat {
  return ["yaml", "xml"].includes(format);
}

/**
 * Recursively process Date objects to ISO strings for clean YAML output.
 */
function processDates(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(processDates);
  }

  if (value !== null && typeof value === "object") {
    const processed: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      processed[key] = processDates(val);
    }
    return processed;
  }

  return value;
}
