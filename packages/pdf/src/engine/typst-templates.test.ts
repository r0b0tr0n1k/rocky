/**
 * typst-templates.test.ts — Prove the per-type Typst template system works
 *
 * Tests the three new primitives:
 * 1. TEMPLATE_SOURCES map resolves every registered document type
 * 2. buildSectionedModel() converts flat/sectioned models correctly
 * 3. The movement template compiles to a valid PDF (network-gated)
 *
 * Follows the same doc-test pattern as TESTING_DOCTRINE.md: each assertion
 * proves a concrete claim about the system, so if the template map changes
 * or a section structure breaks, this test catches it in CI.
 *
 * Run: pnpm --filter @rocky/pdf test
 */

import { describe, expect, it } from "vitest";
import {
  TEMPLATE_SOURCES,
  resolveTypstTemplate,
  buildSectionedModel,
  GENERIC_FALLBACK_TYPST,
  type DocumentSection,
} from "./typst-templates.js";
import { renderTypst } from "./typst-renderer.js";
import type { DocumentModelMeta } from "./typst-document.template.js";

// ── Network gate (borrowed from typst-renderer.test.ts) ──────────────
// The Typst WASM compiler fetches default fonts from cdn.jsdelivr.net;
// when offline the render fails but the structural tests still pass.
let networkOk = false;
try {
  await fetch("https://cdn.jsdelivr.net/", { method: "HEAD", signal: AbortSignal.timeout(4000) });
  networkOk = true;
} catch {
  networkOk = false;
}

// ── Shared test state ────────────────────────────────────────────────
const SAMPLE_META: DocumentModelMeta = {
  title: "Movement Declaration",
  subtitle: "movement · v1.0",
};

// ── Test: Template Source Resolution ─────────────────────────────────

describe("resolveTypstTemplate", () => {
  it("returns the movement template for type 'movement'", () => {
    const source = resolveTypstTemplate("movement");
    expect(source).toBeTypeOf("string");
    expect(source.length).toBeGreaterThan(100);
    // Should be a real Typst template, not the generic fallback
    expect(source).not.toBe(GENERIC_FALLBACK_TYPST);
  });

  it("returns the generic fallback for unregistered types (backward-compatible)", () => {
    const source = resolveTypstTemplate("passport");
    expect(source).toBe(GENERIC_FALLBACK_TYPST);
  });

  it("returns the generic fallback for unknown types", () => {
    const source = resolveTypstTemplate("__nonexistent__");
    expect(source).toBe(GENERIC_FALLBACK_TYPST);
  });

  it("TEMPLATE_SOURCES map contains the movement entry", () => {
    expect(TEMPLATE_SOURCES.has("movement")).toBe(true);
    expect(TEMPLATE_SOURCES.get("movement")?.length).toBeGreaterThan(0);
  });

  it("every TEMPLATE_SOURCES entry has non-empty content", () => {
    for (const [type, source] of TEMPLATE_SOURCES.entries()) {
      expect(source.length, `Template source for '${type}' is empty`).toBeGreaterThan(0);
      // Every Typst template should contain a page setup directive
      expect(source, `Template '${type}' missing page setup`).toContain("set page");
    }
  });
});

// ── Test: Sectioned Model Builder ────────────────────────────────────

describe("buildSectionedModel", () => {
  it("converts a flat model to auto-generated sections", () => {
    const flat = {
      declarationId: "M-2026-0001",
      movementType: "death",
      language: "MK",
      animalEarTag: "MK 00000001",
    };

    const result = buildSectionedModel(flat, SAMPLE_META);

    expect(result.title).toBe("Movement Declaration");
    expect(result.subtitle).toBe("movement · v1.0");
    expect(result.sections).toHaveLength(1);
    const sec0 = result.sections[0]!;
    expect(sec0.type).toBe("fields");
    expect(sec0.fields).toBeDefined();
    // Flat keys (except excluded) become fields
    const labels = sec0.fields!.map((f) => f.label);
    expect(labels).toContain("declarationId");
    expect(labels).toContain("movementType");
    expect(labels).toContain("animalEarTag");
    // language should be promoted, not a field
    expect(labels).not.toContain("language");
    expect(result.language).toBe("MK");
  });

  it("preserves an already-sectioned model", () => {
    const sections: DocumentSection[] = [
      { title: "Movement Details", type: "fields", fields: [{ label: "Type", value: "death" }] },
      { title: "Animal", type: "table", columns: 2, header: ["Key", "Value"], rows: [["Ear Tag", "MK 00000001"]] },
    ];

    const model = { sections, language: "EN", inspectorName: "Inspector Gadget" };
    const result = buildSectionedModel(model, SAMPLE_META);

    expect(result.sections).toHaveLength(2);
    const sec0 = result.sections[0]!;
    const sec1 = result.sections[1]!;
    expect(sec0.type).toBe("fields");
    expect(sec1.type).toBe("table");
    expect(sec1.columns).toBe(2);
    expect(result.language).toBe("EN");
    expect(result.inspectorName).toBe("Inspector Gadget");
  });

  it("passes metadata through for empty models", () => {
    const result = buildSectionedModel({}, SAMPLE_META);
    expect(result.title).toBe("Movement Declaration");
    expect(result.sections).toHaveLength(1);
    const fields = result.sections[0]!.fields;
    expect(fields).toHaveLength(0);
  });

  it("serializes nested objects as JSON strings in fields", () => {
    const flat = {
      fromFarm: { id: "farm-1", name: "Kozjak" },
    };
    const result = buildSectionedModel(flat, SAMPLE_META);
    const farmField = result.sections[0]!.fields!.find((f) => f.label === "fromFarm");
    expect(farmField).toBeDefined();
    expect(farmField!.value).toContain("farm-1");
    expect(farmField!.value).toContain("Kozjak");
  });
});

// ── Test: Render integrity (network-gated) ──────────────────────────

describe.skipIf(!networkOk)("renderTypst with per-type template", () => {
  it("compiles the movement template to a valid PDF", async () => {
    const source = resolveTypstTemplate("movement");

    // Build a realistic sectioned model as the pipeline would
    const sections: DocumentSection[] = [
      {
        title: "Movement Details",
        type: "fields",
        fields: [
          { label: "Declaration ID", value: "M-2026-0001" },
          { label: "Movement Type", value: "death" },
          { label: "Movement Date", value: "2026-07-19" },
          { label: "Reason", value: "Slaughter" },
        ],
      },
      {
        title: "Animal Information",
        type: "table",
        columns: 2,
        header: ["Property", "Value"],
        rows: [
          ["Ear Tag Number", "MK 00000001"],
          ["Sex", "Female"],
          ["Breed", "Simmental"],
          ["Birth Date", "2024-03-15"],
          ["Current Status", "Active"],
        ],
      },
      {
        title: "Departure Farm",
        type: "fields",
        fields: [
          { label: "Farm ID", value: "F-001" },
          { label: "Farm Name", value: "Kozjak" },
          { label: "Municipality", value: "Tetovo" },
        ],
      },
      {
        title: "Death Information",
        type: "fields",
        fields: [
          { label: "Death Date", value: "2026-07-19" },
          { label: "Death Cause", value: "Emergency slaughter" },
          { label: "Stillborn", value: "No" },
        ],
      },
      {
        title: "Inspector's Note",
        type: "note",
        content:
          "Routine slaughterhouse inspection. Animal was fit for transport at time of departure. Ear tag intact and legible.",
      },
    ];

    const inputs = {
      model: JSON.stringify({
        title: "Movement / Transport Declaration",
        subtitle: "movement · v1.0",
        language: "MK",
        generatedAt: new Date().toISOString(),
        inspectorName: "Д-р. Иван Петровски",
        sections,
      }),
    };

    const pdf = await renderTypst({ template: source, inputs });

    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(0);
    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  }, 120_000);

  it("renders the generic fallback template (backward-compatible)", async () => {
    const inputs = {
      model: JSON.stringify({
        title: "Generic Document",
        subtitle: "unknown · v0.1",
        sections: [
          {
            title: "Data Fields",
            type: "fields",
            fields: [
              { label: "Type", value: "fallback test" },
              { label: "Status", value: "ok" },
            ],
          },
        ],
      }),
    };

    const pdf = await renderTypst({ template: GENERIC_FALLBACK_TYPST, inputs });

    expect(pdf).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");
  }, 120_000);
});

// ── Integration: resolveTypstTemplate + buildSectionedModel ─────────

describe("pipeline integration (render pipeline mock)", () => {
  it("resolve → build — the two-step the document.service.ts uses", () => {
    // Simulate what document.service.ts does at line 138-139 + buildSectionedModel
    const type = "movement";
    const templateSource = resolveTypstTemplate(type);
    expect(templateSource).toBeTypeOf("string");

    // Simulate a flat model (as most mapToModel()s still return today)
    const flatAnimalModel = {
      declarationId: "M-2026-0002",
      movementType: "pasture",
      movementDate: "2026-07-19",
      animalEarTag: "MK 00000002",
      animalSex: "Male",
      language: "EN",
    };

    const meta: DocumentModelMeta = { title: "Movement Declaration", subtitle: "movement · v1.0" };
    const structured = buildSectionedModel(flatAnimalModel, meta);
    expect(structured.sections).toHaveLength(1);

    // The JSON round-trip: this is what the pipeline sends to renderTypst as sys.inputs
    const modelJson = JSON.stringify(structured);
    expect(modelJson).toContain("Movement Declaration");
    expect(modelJson).toContain("MK 00000002");
  });

  it("TEMPLATE_SOURCES map is a ReadonlyMap (safety)", () => {
    // The ReadonlyMap type is a compile-time contract; at runtime it's a
    // regular Map, but add() calls fail because the TS type prevents it.
    // Runtime detection: check that the value is a Map, not a plain object.
    expect(TEMPLATE_SOURCES).toBeInstanceOf(Map);
    expect(TEMPLATE_SOURCES.size).toBeGreaterThanOrEqual(1);
  });
});
