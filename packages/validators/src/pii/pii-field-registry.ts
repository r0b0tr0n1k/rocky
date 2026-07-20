import type { GdprArticleId } from "../compliance/gdpr-articles.js";
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
  /** Canonical GDPR articles governing this field (audit/reference only, NOT enforcement). */
  governingArticles?: GdprArticleId[];
}

export const PII_FIELD_REGISTRY: readonly PiiField[] = [
  // ── Subjects (keepers/holders) — the core direct PII ──
  {
    table: "subjects",
    column: "firstName",
    category: "direct",
    type: "name",
    defaultExcluded: true,
    description: "Keeper given name",
    governingArticles: ["ART_05", "ART_06"],
  },
  {
    table: "subjects",
    column: "firstNameAlt",
    category: "direct",
    type: "name",
    defaultExcluded: true,
    description: "Keeper given name (alternate script)",
    governingArticles: ["ART_05", "ART_06"],
  },
  {
    table: "subjects",
    column: "lastName",
    category: "direct",
    type: "name",
    defaultExcluded: true,
    description: "Keeper family name",
    governingArticles: ["ART_05", "ART_06"],
  },
  {
    table: "subjects",
    column: "lastNameAlt",
    category: "direct",
    type: "name",
    defaultExcluded: true,
    description: "Keeper family name (alternate script)",
    governingArticles: ["ART_05", "ART_06"],
  },
  {
    table: "subjects",
    column: "shortName",
    category: "indirect",
    type: "name",
    defaultExcluded: true,
    description: "Display name; personal when subject is an individual",
  },
  {
    table: "subjects",
    column: "shortNameAlt",
    category: "indirect",
    type: "name",
    defaultExcluded: true,
    description: "Display name (alternate script)",
  },
  {
    table: "subjects",
    column: "companyName",
    category: "direct",
    type: "name",
    defaultExcluded: true,
    description: "Legal entity name (keeper-as-company)",
    governingArticles: ["ART_05", "ART_06"],
  },
  {
    table: "subjects",
    column: "personalId",
    category: "direct",
    type: "nationalId",
    defaultExcluded: true,
    description: "National personal identifier (UCN) — highest-sensitivity PII",
    governingArticles: ["ART_05", "ART_06"],
  },
  {
    table: "subjects",
    column: "vatNumber",
    category: "direct",
    type: "taxId",
    defaultExcluded: true,
    description: "VAT / tax registration number",
  },
  {
    table: "subjects",
    column: "phoneNumber",
    category: "direct",
    type: "contact",
    defaultExcluded: true,
    description: "Keeper phone number",
    governingArticles: ["ART_05", "ART_06", "ART_13"],
  },
  {
    table: "subjects",
    column: "email",
    category: "direct",
    type: "contact",
    defaultExcluded: true,
    description: "Keeper email address",
    governingArticles: ["ART_05", "ART_06", "ART_13"],
  },
  {
    table: "subjects",
    column: "addressId",
    category: "indirect",
    type: "linkage",
    defaultExcluded: true,
    description: "FK to addresses — resolves to street-level PII",
    governingArticles: ["ART_05", "ART_06", "ART_13"],
  },

  // ── Addresses (resolved via subjects.addressId / farms.addressId) ──
  {
    table: "addresses",
    column: "name",
    category: "direct",
    type: "address",
    defaultExcluded: true,
    description: "Address label",
  },
  {
    table: "addresses",
    column: "geocodedAddress",
    category: "direct",
    type: "address",
    defaultExcluded: true,
    description: "Full geocoded street address",
    governingArticles: ["ART_05", "ART_06", "ART_13"],
  },
  {
    table: "addresses",
    column: "zipCodeId",
    category: "indirect",
    type: "address",
    defaultExcluded: true,
    description: "FK to zip_codes (postal code + city)",
  },
  {
    table: "zipCodes",
    column: "zipCode",
    category: "indirect",
    type: "address",
    defaultExcluded: true,
    description: "Postal code",
  },
  {
    table: "zipCodes",
    column: "name",
    category: "indirect",
    type: "address",
    defaultExcluded: true,
    description: "Commune / locality name",
  },

  // ── Farms — GPS + operator note ──
  {
    table: "farms",
    column: "addressId",
    category: "indirect",
    type: "linkage",
    defaultExcluded: true,
    description: "FK to addresses",
  },
  {
    table: "farms",
    column: "location",
    category: "indirect",
    type: "geo",
    defaultExcluded: true,
    description: "Farm GPS point — ties a natural person to a place (Art.9-adjacent)",
    governingArticles: ["ART_05", "ART_06"],
  },
  {
    table: "farms",
    column: "verificationNote",
    category: "indirect",
    type: "freeText",
    defaultExcluded: true,
    description: "Free-text verification note — may contain names",
  },

  // ── Farm-Subject binding — the singling-out linkage ──
  {
    table: "farm_subjects",
    column: "subjectId",
    category: "indirect",
    type: "linkage",
    defaultExcluded: true,
    description: "Keeper<->farm link; enables re-identification via holdings",
    governingArticles: ["ART_05", "ART_06"],
  },
  {
    table: "farm_subjects",
    column: "farmId",
    category: "indirect",
    type: "linkage",
    defaultExcluded: false,
    description: "Farm link (kept; the farm is not PII, the keeper behind it is)",
  },
  {
    table: "farm_subjects",
    column: "role",
    category: "indirect",
    type: "linkage",
    defaultExcluded: false,
    description: "Role on farm (not PII itself)",
  },

  // ── System users (operators/admins are natural persons too) ──
  {
    table: "auth_user",
    column: "email",
    category: "direct",
    type: "contact",
    defaultExcluded: true,
    description: "Operator email",
    governingArticles: ["ART_05", "ART_06", "ART_13"],
  },
  {
    table: "auth_user",
    column: "phone",
    category: "direct",
    type: "contact",
    defaultExcluded: true,
    description: "Operator phone",
    governingArticles: ["ART_05", "ART_06", "ART_13"],
  },

  // ── Sessions + audit — behavioral PII ──
  {
    table: "auth_session",
    column: "ipAddress",
    category: "indirect",
    type: "behavioral",
    defaultExcluded: true,
    description: "Client IP at login",
  },
  {
    table: "auth_session",
    column: "userAgent",
    category: "indirect",
    type: "behavioral",
    defaultExcluded: true,
    description: "Client user-agent",
  },
  {
    table: "audit_log",
    column: "userId",
    category: "indirect",
    type: "behavioral",
    defaultExcluded: true,
    description: "Actor reference",
  },
  {
    table: "audit_log",
    column: "sessionId",
    category: "indirect",
    type: "behavioral",
    defaultExcluded: true,
    description: "Session reference",
  },
  {
    table: "audit_log",
    column: "ipAddress",
    category: "indirect",
    type: "behavioral",
    defaultExcluded: true,
    description: "Actor IP",
  },
  {
    table: "audit_log",
    column: "userAgent",
    category: "indirect",
    type: "behavioral",
    defaultExcluded: true,
    description: "Actor user-agent",
  },
  {
    table: "audit_log",
    column: "oldValue",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Pre-change snapshot — may embed PII",
  },
  {
    table: "audit_log",
    column: "newValue",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Post-change snapshot — may embed PII",
  },
  {
    table: "audit_log",
    column: "changes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Diff snapshot — may embed PII",
  },

  // ── Geo / IoT — GPS is personal data when tied to a keeper ──
  {
    table: "sensor_readings",
    column: "location",
    category: "indirect",
    type: "geo",
    defaultExcluded: true,
    description: "Sensor GPS fix",
  },
  {
    table: "sensor_readings",
    column: "deviceId",
    category: "indirect",
    type: "device",
    defaultExcluded: true,
    description: "Device -> holder linkage",
  },
  {
    table: "geofences",
    column: "polygon",
    category: "indirect",
    type: "geo",
    defaultExcluded: true,
    description: "Geofence polygon (place tied to keeper)",
  },
  {
    table: "geofences",
    column: "geometry",
    category: "indirect",
    type: "geo",
    defaultExcluded: true,
    description: "Geofence geometry (jsonb)",
  },
  {
    table: "geofences",
    column: "cadastralReference",
    category: "indirect",
    type: "geo",
    defaultExcluded: true,
    description: "Cadastral parcel -> farm/keeper",
  },
  {
    table: "animal_geofence_events",
    column: "location",
    category: "indirect",
    type: "geo",
    defaultExcluded: true,
    description: "Animal GPS fix at event time",
  },
  {
    table: "pda_devices",
    column: "deviceIdentifier",
    category: "indirect",
    type: "device",
    defaultExcluded: true,
    description: "Field smartphone id -> keeper",
  },
  {
    table: "iot_devices",
    column: "deviceEui",
    category: "indirect",
    type: "device",
    defaultExcluded: true,
    description: "Device EUI -> holder",
  },

  // ── Free-text notes (any can contain a name) ──
  {
    table: "inspections",
    column: "notes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Inspection notes",
  },
  {
    table: "birth_notifications",
    column: "notes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Birth notification notes",
  },
  {
    table: "ear_tag_replacements",
    column: "notes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Replacement notes",
  },
  {
    table: "ear_tags",
    column: "notes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Ear-tag notes",
  },
  {
    table: "ear_tag_allocations",
    column: "notes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Allocation notes",
  },
  {
    table: "ear_tag_orders",
    column: "notes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Order notes",
  },
  {
    table: "ear_tag_orders",
    column: "internalNotes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Internal order notes",
  },
  {
    table: "ear_tag_orders",
    column: "supplierAddress",
    category: "derived",
    type: "address",
    defaultExcluded: true,
    description: "Supplier address",
  },
  {
    table: "ear_tag_takeovers",
    column: "notes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Takeover notes",
  },
  {
    table: "form_reprints",
    column: "notes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Reprint notes",
  },
  {
    table: "error_corrections",
    column: "resolutionNotes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Correction resolution notes",
  },

  // ── Derived / inferred attributes (k-anonymity concern, ADR-0054 strike 6) ──
  {
    table: "risk_analyses",
    column: "riskFactorsSnapshot",
    category: "derived",
    type: "derived",
    defaultExcluded: true,
    description: "Frozen risk variables — attribute disclosure",
  },

  // ── Animal registry (GDPR Art.9-adjacent: animal <-> keeper linkage via farm) ──
  {
    table: "animals",
    column: "currentFarmId",
    category: "indirect",
    type: "linkage",
    defaultExcluded: false,
    description: "FK to farms — keeper linkage (kept; farm is not PII, the keeper behind it is)",
  },

  // ── Cattle passports ──
  {
    table: "passports",
    column: "deliveredToKeeper",
    category: "indirect",
    type: "linkage",
    defaultExcluded: false,
    description: "FK to keeper on delivery",
  },
  {
    table: "passports",
    column: "passportNumber",
    category: "indirect",
    type: "linkage",
    defaultExcluded: false,
    description: "Animal passport identifier (links to a holder)",
  },

  // ── Movements (animal transported between farms/holders) ──
  {
    table: "movements",
    column: "fromFarmId",
    category: "indirect",
    type: "linkage",
    defaultExcluded: false,
    description: "Origin farm (keeper linkage)",
  },
  {
    table: "movements",
    column: "toFarmId",
    category: "indirect",
    type: "linkage",
    defaultExcluded: false,
    description: "Destination farm (keeper linkage)",
  },
  {
    table: "movements",
    column: "reason",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Free-text movement reason — may contain names",
  },
  {
    table: "movements",
    column: "verifiedBy",
    category: "indirect",
    type: "behavioral",
    defaultExcluded: true,
    description: "Verifier actor reference",
  },

  // ── Health (GDPR Art.9 special category — diagnosis/treatment/lab results) ──
  {
    table: "treatments",
    column: "diagnosisDesc",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Diagnosis free-text (health data)",
  },
  {
    table: "treatments",
    column: "treatmentDesc",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Treatment free-text (health data)",
  },
  {
    table: "treatments",
    column: "antibioticName",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Antibiotic name (health data)",
  },
  {
    table: "vaccinations",
    column: "notes",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Vaccination notes (health data)",
  },
  {
    table: "labTests",
    column: "result",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Lab result (health data)",
  },
  {
    table: "labTests",
    column: "interpretation",
    category: "derived",
    type: "freeText",
    defaultExcluded: true,
    description: "Lab interpretation (health data)",
  },
  {
    table: "labTests",
    column: "labName",
    category: "indirect",
    type: "name",
    defaultExcluded: true,
    description: "Lab / company name",
  },
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
  return piiFieldsForTable(table)
    .filter((f) => f.defaultExcluded)
    .map((f) => f.column);
}
