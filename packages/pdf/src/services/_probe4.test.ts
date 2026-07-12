import { describe, expect, it } from "vitest";
import { GENERIC_DOCUMENT_TYPST, buildDocumentModelInputs } from "../engine/typst-document.template.js";
describe("p4", () => {
  it("imports", () => {
    expect(typeof GENERIC_DOCUMENT_TYPST).toBe("string");
  });
});
