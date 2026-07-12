import { ok } from "neverthrow";
import { beforeAll, describe, expect, it } from "vitest";
import { DocumentRegistry } from "../engine/document-registry.js";
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
      return ok({ farm: "Kozjak", count: 12, lineage: { sire: "A", dam: "B" } });
    },
    async mapToModel(data) {
      return data as Record<string, unknown>;
    },
  });
});
function pdfHeader(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes.slice(0, 5));
}
describe("probe2", () => {
  it("pdf supported", () => {
    expect(isFormatSupported("pdf")).toBe(true);
  });
  it("renders pdf via generate", async () => {
    const service = new DocumentService();
    const result = await service.generate({ type: FAKE_TYPE, refId: "x", format: "pdf" });
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const pdf = Buffer.from(result.value.content, "base64");
      expect(pdfHeader(pdf)).toBe("%PDF-");
    }
  }, 120_000);
});
