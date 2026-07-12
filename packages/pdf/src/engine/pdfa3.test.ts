/**
 * Unit test: `wrapPdfA3` turns a visual PDF into a PDF/A-3 hybrid container.
 * Uses a blank visual PDF (no Typst) to isolate the wrapper behaviour — the
 * structural tokens below are the PDF/A-3 contract (ADR-0082 §3).
 */
import { PDFDocument } from "@cantoo/pdf-lib";
import { describe, expect, it } from "vitest";
import { wrapPdfA3, type PdfA3Attachment } from "./pdfa3.js";

async function blankVisual(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  return doc.save();
}

function decode(pdf: Uint8Array): string {
  // latin1 keeps every byte (incl. high bytes) as a char so binary tokens match.
  return new TextDecoder("latin1").decode(pdf);
}

describe("wrapPdfA3", () => {
  it("produces a PDF/A-3 hybrid container with the source embedded", async () => {
    const visual = await blankVisual();
    const attachments: PdfA3Attachment[] = [
      {
        filename: "test.yaml",
        buffer: new TextEncoder().encode("hello: world\n"),
        mimeType: "application/yaml",
      },
    ];
    const wrapped = await wrapPdfA3({
      pdf: visual,
      attachments,
      meta: {
        title: "Test",
        subject: "Test subject",
        documentId: "ref-123",
        conformance: "B",
      },
    });
    const text = decode(wrapped);

    expect(text.startsWith("%PDF-")).toBe(true);
    // Associated file + AF relationship (PDF/A-3 hybrid requirement)
    expect(text).toContain("/EmbeddedFile");
    expect(text).toContain("/AF");
    expect(text).toContain("/AFRelationship");
    // PDF/A-3 XMP identifier
    expect(text).toContain("pdfaid:part");
    expect(text).toContain(">3<");
    expect(text).toContain("pdfaid:conformance");
    expect(text).toContain(">B<");
    // OutputIntent with sRGB ICC (mandatory for /A conformance)
    expect(text).toContain("OutputIntent");
    expect(text).toContain("GTS_PDFA1");
    // Not signed here — that is the separate sign stage.
    expect(text).not.toContain("/Sig");
  });

  it("embeds multiple associated files", async () => {
    const visual = await blankVisual();
    const wrapped = await wrapPdfA3({
      pdf: visual,
      attachments: [
        { filename: "a.yaml", buffer: new TextEncoder().encode("a: 1"), mimeType: "application/yaml" },
        { filename: "b.xml", buffer: new TextEncoder().encode("<b/>"), mimeType: "application/xml" },
      ],
      meta: { title: "T", subject: "S", documentId: "r1" },
    });
    const text = decode(wrapped);
    expect(text).toContain("a.yaml");
    expect(text).toContain("b.xml");
    expect(text).toContain("/Filespec");
  });
});
