import { toBuffer, toString } from "qrcode";

/**
 * QR code generation for physical artifacts (ear-tag linkage, document
 * verification slips). The on-page document QR is rendered inside the Typst
 * template via Typst's native `qrcode()` — this module produces *standalone*
 * images for printing onto ear tags / labels, exactly mirroring the data the
 * document embeds.
 */

export type QrErrorCorrection = "L" | "M" | "Q" | "H";

export interface QrOptions {
  /** Quiet-zone modules around the symbol. Default 2. */
  margin?: number;
  /** Pixel width/height of the square image. Default 256. */
  width?: number;
  /** QR error-correction level. Default "M". */
  errorCorrectionLevel?: QrErrorCorrection;
}

const DEFAULTS: Required<QrOptions> = {
  margin: 2,
  width: 256,
  errorCorrectionLevel: "M",
};

/** Generate a QR code as a PNG buffer (RGBA, square). */
export async function generateQrPng(
  text: string,
  opts: QrOptions = {},
): Promise<Uint8Array> {
  const merged = { ...DEFAULTS, ...opts };
  const png = await toBuffer(text, {
    type: "png",
    margin: merged.margin,
    width: merged.width,
    errorCorrectionLevel: merged.errorCorrectionLevel,
  });
  return new Uint8Array(png);
}

/** Generate a QR code as an SVG string (scalable, print-friendly). */
export async function generateQrSvg(
  text: string,
  opts: QrOptions = {},
): Promise<string> {
  const merged = { ...DEFAULTS, ...opts };
  return toString(text, {
    type: "svg",
    margin: merged.margin,
    width: merged.width,
    errorCorrectionLevel: merged.errorCorrectionLevel,
  });
}
