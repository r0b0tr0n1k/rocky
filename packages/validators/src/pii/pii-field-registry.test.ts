import { describe, expect, it } from "vitest";
import {
  PII_FIELD_REGISTRY,
  defaultExcludedColumns,
  isPiiField,
  piiFieldsForTable,
} from "./pii-field-registry.js";

describe("PII_FIELD_REGISTRY (ADR-0061 D1)", () => {
  it("registers known direct PII on subjects", () => {
    expect(isPiiField("subjects", "personalId")).toBe(true);
    expect(isPiiField("subjects", "email")).toBe(true);
    expect(isPiiField("subjects", "firstName")).toBe(true);
  });

  it("treats geo/linkage as indirect PII, not 'not PII'", () => {
    expect(isPiiField("farms", "location")).toBe(true);
    expect(isPiiField("farm_subjects", "subjectId")).toBe(true);
    expect(isPiiField("geofences", "polygon")).toBe(true);
  });

  it("marks free-text notes as derived PII", () => {
    expect(isPiiField("inspections", "notes")).toBe(true);
    expect(isPiiField("error_corrections", "resolutionNotes")).toBe(true);
  });

  it("returns per-table field lists", () => {
    const subjects = piiFieldsForTable("subjects");
    expect(subjects.length).toBeGreaterThanOrEqual(11);
    expect(subjects.every((f) => f.table === "subjects")).toBe(true);
  });

  it("returns default-excluded columns for projection masking", () => {
    const excluded = defaultExcludedColumns("subjects");
    expect(excluded).toContain("personalId");
    expect(excluded).toContain("email");
    // farm_subjects.role/farmId are NOT default-excluded (they are not PII themselves)
    expect(defaultExcludedColumns("farm_subjects")).not.toContain("role");
  });

  it("registry is non-empty and every entry is well-formed", () => {
    expect(PII_FIELD_REGISTRY.length).toBeGreaterThan(30);
    for (const f of PII_FIELD_REGISTRY) {
      expect(f.table).toBeTruthy();
      expect(f.column).toBeTruthy();
      expect(["direct", "indirect", "derived"]).toContain(f.category);
    }
  });
});
