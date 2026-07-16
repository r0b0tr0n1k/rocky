/**
 * PDF image embedding (ADR-0084 §7).
 *
 * Embeds a pre-rendered QR PNG onto a PDF page using `@cantoo/pdf-lib`. This is
 * the mechanism that unblocks the "on-document QR" that the prebuilt Typst WASM
 * sandbox could not produce (no native `qrcode()` and no vfs `image()` reads).
 * We render the visual via Typst, then stamp the credential QR here before the
 * PDF/A-3 wrap + PAdES seal.
 */

import { PDFDocument, rgb } from "@cantoo/pdf-lib";

export interface EmbedQrOptions {
  /** Bottom-left X in PDF points. Defaults to top-right with 24pt margin. */
  x?: number;
  /** Bottom-left Y in PDF points. Defaults to top-right with 24pt margin. */
  y?: number;
  /** Square size in PDF points. Default 90. */
  size?: number;
  /** Optional caption drawn under the QR. */
  label?: string;
}

/**
 * Embed `qrPng` onto the first page of `pdfBytes`, returning the modified PDF.
 * Best-effort: callers should catch and fall back to the un-embedded PDF.
 */
export async function embedQrPng(
  pdfBytes: Uint8Array,
  qrPng: Uint8Array,
  opts: EmbedQrOptions = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes);
  const png = await pdf.embedPng(qrPng);
  const size = opts.size ?? 90;
  const page = pdf.getPages()[0];
  if (!page) throw new Error("PDF has no pages to embed a QR onto");

  const { width, height } = page.getSize();
  const x = opts.x ?? width - size - 24;
  const y = opts.y ?? height - size - 24;

  page.drawImage(png, { x, y, width: size, height: size });
  if (opts.label) {
    page.drawText(opts.label, { x, y: y - 12, size: 7, color: rgb(0, 0, 0) });
  }

  const bytes = await pdf.save();
  return new Uint8Array(bytes);
}


/**
 * Embed the Rocky brand logo (ADR branding) onto the first page of a PDF using
 * `@cantoo/pdf-lib`. Mirrors `embedQrPng`: the prebuilt Typst WASM sandbox
 * cannot read images from its vfs, so the logo is stamped post-render. Placed
 * top-left as a letterhead mark; the visual template reserves a top strip so
 * it never overlaps the document title.
 */
export interface EmbedLogoOptions {
  /** Width in PDF points. Default 120. */
  width?: number;
  /** Left margin in PDF points. Default 24. */
  x?: number;
  /** Top margin (distance from top edge) in PDF points. Default 24. */
  top?: number;
}

export async function embedLogoPng(
  pdfBytes: Uint8Array,
  logoPng: Uint8Array,
  opts: EmbedLogoOptions = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes);
  const img = await pdf.embedPng(logoPng);
  const page = pdf.getPages()[0];
  if (!page) throw new Error("PDF has no pages to embed a logo onto");

  const w = opts.width ?? 120;
  const h = w * (img.height / img.width);
  const { width, height } = page.getSize();
  const x = opts.x ?? 24;
  const y = height - h - (opts.top ?? 24);

  page.drawImage(img, { x, y, width: w, height: h });

  const bytes = await pdf.save();
  return new Uint8Array(bytes);
}
