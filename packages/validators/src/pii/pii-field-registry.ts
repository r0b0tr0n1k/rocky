/**
 * PII Field Registry (ADR-0061 D1)
 *
 * The single machine-readable source of truth for WHAT counts as personal data.
 * Validators, the API projection layer (D5), and the mobile UI (mask-by-default)
 * all consult this registry to decide what to mask, sign, and log. No field is
 * "PII by intuition" — if it is not here, it is not PII for compliance purposes.
 *
 * Three categories (GDPR Art.4(1) + ADR-0061 D1):
 *  - direct:   identifies a natural person outright (name, contact, national id).
 *  - indirect: identifies when linked/singled-out (subject<->farm linkage, GPS).
 *  - derived:  inferred/composite disclosure (herd composition, risk snapshot).
 *
 * `defaultExcluded` = the field is OMITTED from default API projections unless the
 * caller holds `pii:read` AND supplies a `purpose` (Art.25 data-protection-by-design,
 * Art.5(1)(c) minimization). The cheapest breach is the one that never reaches the wire.
 *
 * This registry is STATIC taxonomy. Jurisdiction-specific retention / overrides live
 * in the RuleSet (ADR-0061 D10), NOT here. Edit this file when a column's PII nature
 * changes — it is the contract that the masking + signing layers depend on.
 */

export type PiiCategory = "direct" | "indirect" | "derived";

export type PiiType =
  | "name"
  | "contact"
  | "nationalId"
  | "taxId"
  | "address"
  | "geo"
  | "behavioral"
  | "freeText"
  | "linkage"
  | "device"
  | "derived";

export interface PiiField {
  /** Schema table the column belongs to. */
  table: string;
  /** Column name in that table. */
  column: string;
  category: PiiCategory;
  type: PiiType;
  /** Omitted from default projections unless pii:read + purpose (D5). */
  defaultExcluded: boolean;
  description: string;
}

export const PII_FIELD_REGISTRY: readonly PiiField[] = [
  // ── Subjects (keepers/holders) — the core direct PII ──
  { table: "subjects", column: "firstName", category: "direct", type: "name", defaultExcluded: true, description: "Keeper given name" },
  { table: "subjects", column: "firstNameAlt", category: "direct", type: "name", defaultExcluded: true, description: "Keeper given name (alternate script)" },
  { table: "subjects", column: "lastName", category: "direct", type: "name", defaultExcluded: true, description: "Keeper family name" },
  { table: "subjects", column: "lastNameAlt", category: "direct", type: "name", defaultExcluded: true, description: "Keeper family name (alternate script)" },
  { table: "subjects", column: "shortName", category: "indirect", type: "name", defaultExcluded: true, description: "Display name; personal when subject is an individual" },
  { table: "subjects", column: "shortNameAlt", category: "indirect", type: "name", defaultExcluded: true, description: "Display name (alternate script)" },
  { table: "subjects", column: "companyName", category: "direct", type: "name", defaultExcluded: true, description: "Legal entity name (keeper-as-company)" },
  { table: "subjects", column: "personalId", category: "direct", type: "nationalId", defaultExcluded: true, description: "National personal identifier (UCN) — highest-sensitivity PII" },
  { table: "subjects", column: "vatNumber", category: "direct", type: "taxId", defaultExcluded: true, description: "VAT / tax registration number" },
  { table: "subjects", column: "phoneNumber", category: "direct", type: "contact", defaultExcluded: true, description: "Keeper phone number" },
  { table: "subjects", column: "email", category: "direct", type: "contact", defaultExcluded: true, description: "Keeper email address" },
  { table: "subjects", column: "addressId", category: "indirect", type: "linkage", defaultExcluded: true, description: "FK to addresses — resolves to street-level PII" },

  // ── Addresses (resolved via subjects.addressId / farms.addressId) ──
  { table: "addresses", column: "name", category: "direct", type: "address", defaultExcluded: true, description: "Address label" },
  { table: "addresses", column: "geocodedAddress", category: "direct", type: "address", defaultExcluded: true, description: "Full geocoded street address" },
  { table: "addresses", column: "zipCodeId", category: "indirect", type: "address", defaultExcluded: true, description: "FK to zip_codes (postal code + city)" },
  { table: "zipCodes", column: "zipCode", category: "indirect", type: "address", defaultExcluded: true, description: "Postal code" },
  { table: "zipCodes", column: "name", category: "indirect", type: "address", defaultExcluded: true, description: "Commune / locality name" },

  // ── Farms — GPS + operator note ──
  { table: "farms", column: "addressId", category: "indirect", type: "linkage", defaultExcluded: true, description: "FK to addresses" },
  { table: "farms", column: "location", category: "indirect", type: "geo", defaultExcluded: true, description: "Farm GPS point — ties a natural person to a place (Art.9-adjacent)" },
  { table: "farms", column: "verificationNote", category: "indirect", type: "freeText", defaultExcluded: true, description: "Free-text verification note — may contain names" },

  // ── Farm-Subject binding — the singling-out linkage ──
  { table: "farm_subjects", column: "subjectId", category: "indirect", type: "linkage", defaultExcluded: true, description: "Keeper<->farm link; enables re-identification via holdings" },
  { table: "farm_subjects", column: "farmId", category: "indirect", type: "linkage", defaultExcluded: false, description: "Farm link (kept; the farm is not PII, the keeper behind it is)" },
  { table: "farm_subjects", column: "role", category: "indirect", type: "linkage", defaultExcluded: false, description: "Role on farm (not PII itself)" },

  // ── System users (operators/admins are natural persons too) ──
  { table: "auth_user", column: "email", category: "direct", type: "contact", defaultExcluded: true, description: "Operator email" },
  { table: "auth_user", column: "phone", category: "direct", type: "contact", defaultExcluded: true, description: "Operator phone" },

  // ── Sessions + audit — behavioral PII ──
  { table: "auth_session", column: "ipAddress", category: "indirect", type: "behavioral", defaultExcluded: true, description: "Client IP at login" },
  { table: "auth_session", column: "userAgent", category: "indirect", type: "behavioral", defaultExcluded: true, description: "Client user-agent" },
  { table: "audit_log", column: "userId", category: "indirect", type: "behavioral", defaultExcluded: true, description: "Actor reference" },
  { table: "audit_log", column: "sessionId", category: "indirect", type: "behavioral", defaultExcluded: true, description: "Session reference" },
  { table: "audit_log", column: "ipAddress", category: "indirect", type: "behavioral", defaultExcluded: true, description: "Actor IP" },
  { table: "audit_log", column: "userAgent", category: "indirect", type: "behavioral", defaultExcluded: true, description: "Actor user-agent" },
  { table: "audit_log", column: "oldValue", category: "derived", type: "freeText", defaultExcluded: true, description: "Pre-change snapshot — may embed PII" },
  { table: "audit_log", column: "newValue", category: "derived", type: "freeText", defaultExcluded: true, description: "Post-change snapshot — may embed PII" },
  { table: "audit_log", column: "changes", category: "derived", type: "freeText", defaultExcluded: true, description: "Diff snapshot — may embed PII" },

  // ── Geo / IoT — GPS is personal data when tied to a keeper ──
  { table: "sensor_readings", column: "location", category: "indirect", type: "geo", defaultExcluded: true, description: "Sensor GPS fix" },
  { table: "sensor_readings", column: "deviceId", category: "indirect", type: "device", defaultExcluded: true, description: "Device -> holder linkage" },
  { table: "geofences", column: "polygon", category: "indirect", type: "geo", defaultExcluded: true, description: "Geofence polygon (place tied to keeper)" },
  { table: "geofences", column: "geometry", category: "indirect", type: "geo", defaultExcluded: true, description: "Geofence geometry (jsonb)" },
  { table: "geofences", column: "cadastralReference", category: "indirect", type: "geo", defaultExcluded: true, description: "Cadastral parcel -> farm/keeper" },
  { table: "animal_geofence_events", column: "location", category: "indirect", type: "geo", defaultExcluded: true, description: "Animal GPS fix at event time" },
  { table: "pda_devices", column: "deviceIdentifier", category: "indirect", type: "device", defaultExcluded: true, description: "Field smartphone id -> keeper" },
  { table: "iot_devices", column: "deviceEui", category: "indirect", type: "device", defaultExcluded: true, description: "Device EUI -> holder" },

  // ── Free-text notes (any can contain a name) ──
  { table: "inspections", column: "notes", category: "derived", type: "freeText", defaultExcluded: true, description: "Inspection notes" },
  { table: "birth_notifications", column: "notes", category: "derived", type: "freeText", defaultExcluded: true, description: "Birth notification notes" },
  { table: "ear_tag_replacements", column: "notes", category: "derived", type: "freeText", defaultExcluded: true, description: "Replacement notes" },
  { table: "ear_tags", column: "notes", category: "derived", type: "freeText", defaultExcluded: true, description: "Ear-tag notes" },
  { table: "ear_tag_allocations", column: "notes", category: "derived", type: "freeText", defaultExcluded: true, description: "Allocation notes" },
  { table: "ear_tag_orders", column: "notes", category: "derived", type: "freeText", defaultExcluded: true, description: "Order notes" },
  { table: "ear_tag_orders", column: "internalNotes", category: "derived", type: "freeText", defaultExcluded: true, description: "Internal order notes" },
  { table: "ear_tag_orders", column: "supplierAddress", category: "derived", type: "address", defaultExcluded: true, description: "Supplier address" },
  { table: "ear_tag_takeovers", column: "notes", category: "derived", type: "freeText", defaultExcluded: true, description: "Takeover notes" },
  { table: "form_reprints", column: "notes", category: "derived", type: "freeText", defaultExcluded: true, description: "Reprint notes" },
  { table: "error_corrections", column: "resolutionNotes", category: "derived", type: "freeText", defaultExcluded: true, description: "Correction resolution notes" },

  // ── Derived / inferred attributes (k-anonymity concern, ADR-0054 strike 6) ──
  { table: "risk_analyses", column: "riskFactorsSnapshot", category: "derived", type: "derived", defaultExcluded: true, description: "Frozen risk variables — attribute disclosure" },
] as const;

const REGISTRY_BY_TABLE = new Map<string, PiiField[]>();
for (const field of PII_FIELD_REGISTRY) {
  const list = REGISTRY_BY_TABLE.get(field.table) ?? [];
  list.push(field);
  REGISTRY_BY_TABLE.set(field.table, list);
}

/** All PII fields declared for a table. */
export function piiFieldsForTable(table: string): readonly PiiField[] {
  return REGISTRY_BY_TABLE.get(table) ?? [];
}

/** True if (table, column) is registered as PII. */
export function isPiiField(table: string, column: string): boolean {
  return piiFieldsForTable(table).some((f) => f.column === column);
}

/** Columns of a table that must be excluded from default projections. */
export function defaultExcludedColumns(table: string): readonly string[] {
  return piiFieldsForTable(table).filter((f) => f.defaultExcluded).map((f) => f.column);
}
