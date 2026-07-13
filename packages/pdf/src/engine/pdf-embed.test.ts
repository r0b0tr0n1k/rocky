import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts, rgb } from "@cantoo/pdf-lib";
import { embedQrPng } from "./pdf-embed.js";
import { generateQrPng } from "./qr.js";

async function blankPdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([200, 200]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("Rocky Passport", { x: 20, y: 180, size: 12, font, color: rgb(0, 0, 0) });
  return new Uint8Array(await pdf.save());
}

describe("embedQrPng", () => {
  it("stamps a QR onto the first page and grows the file", async () => {
    const base = await blankPdf();
    const qr = await generateQrPng("rocky:cattle/verify?type=passport&refId=abc-123", {
      width: 120,
    });

    const stamped = await embedQrPng(base, qr, { size: 60 });

    const header = new TextDecoder().decode(stamped.slice(0, 5));
    expect(header).toBe("%PDF-");
    expect(stamped.length).toBeGreaterThan(base.length);
  });

  it("throws cleanly when the PDF has no pages", async () => {
    const empty = new Uint8Array(0);
    const qr = await generateQrPng("x", { width: 40 });
    await expect(embedQrPng(empty, qr)).rejects.toThrow();
  });
});
