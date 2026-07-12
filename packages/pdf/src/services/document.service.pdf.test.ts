/**
 * Integration test: `DocumentService.generate({ format: "pdf" })` renders a
 * Typst visual PDF (ADR-0082). Uses a fake template registered in the shared
 * registry so no DB is needed.
 */
import { ok } from "neverthrow";
import { beforeAll, describe, expect, it } from "vitest";
import { DocumentRegistry } from "../engine/document-registry.js";
import { renderTypst } from "../engine/typst-renderer.js";
import { DocumentService } from "./document.service.js";
import { isFormatSupported } from "../engine/yaml-serializer.js";

const FAKE_TYPE = "test-pdf-doc";

beforeAll(() => {
  DocumentRegistry.getInstance().register({
    type: FAKE_TYPE,
    name: "Test PDF Document",
    modelPath: "models/test-pdf.yaml",
    modelVersion: "1.0.0",
    availableFormats: ["yaml", "pdf"],
    async fetchData() {
      // Cyrillic + nested object to prove script coverage + JSON model passing.
      return ok({ farm: "Фарма Козјак", count: 12, lineage: { sire: "A", dam: "B" } });
    },
    async mapToModel(data) {
      return data as Record<string, unknown>;
    },
  });
});

function pdfHeader(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes.slice(0, 5));
}

describe("DocumentService.generate — pdf branch", () => {
  it("reports pdf as a supported format", () => {
    expect(isFormatSupported("pdf")).toBe(true);
  });

  it("renders a Typst PDF/A-3 hybrid (base64) for format: 'pdf'", async () => {
    const service = new DocumentService();
    const result = await service.generate({ type: FAKE_TYPE, refId: "x", format: "pdf" });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const r = result.value;
      expect(r.format).toBe("pdf");
      expect(r.documentName).toBe("Test PDF Document");
      const pdf = Buffer.from(r.content, "base64");
      expect(pdfHeader(pdf)).toBe("%PDF-");
      expect(pdf.length).toBeGreaterThan(0);

      const text = pdf.toString("latin1");
      // PDF/A-3 hybrid contract: embedded source + AF + XMP pdfaid + OutputIntent
      expect(text).toContain("/EmbeddedFile");
      expect(text).toContain("/AF");
      expect(text).toContain("pdfaid:part");
      expect(text).toContain(">3<");
      expect(text).toContain("OutputIntent");
      // No signer configured in this test → left unsigned (NoOp default).
      expect(text).not.toContain("/Sig");
    }
  }, 120_000);

  it("applies the configured signer to the wrapped PDF/A-3 buffer", async () => {
    const service = new DocumentService();
    let sealed = false;
    service.useSigner({
      name: "marker",
      async sign(input) {
        sealed = true;
        return Buffer.concat([Buffer.from(input), Buffer.from("SEALED-BY-" + this.name)]);
      },
    });
    const result = await service.generate({ type: FAKE_TYPE, refId: "x", format: "pdf" });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const pdf = Buffer.from(result.value.content, "base64");
      expect(sealed).toBe(true);
      expect(pdf.toString("latin1")).toContain("SEALED-BY-marker");
    }
  }, 120_000);

  it("passes the model to Typst via JSON in sys.inputs", async () => {
    const pdf = await renderTypst({
      template: `#let d = json.decode(sys.inputs.at("model", default: "{}"))\n= #d.at("name", default: "?")`,
      inputs: { model: JSON.stringify({ name: "Фарма Козјак" }) },
    });
    expect(pdfHeader(pdf)).toBe("%PDF-");
  }, 120_000);
});
