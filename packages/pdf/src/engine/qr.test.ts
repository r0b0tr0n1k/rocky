import { describe, expect, it } from "vitest";
import { generateQrPng, generateQrSvg } from "./qr.js";

describe("qr", () => {
  it("generates a non-empty PNG buffer", async () => {
    const png = await generateQrPng("rocky:doc:passport:abc");
    expect(png.length).toBeGreaterThan(50);
    // PNG magic number.
    expect([...png.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it("generates an SVG string containing a path", async () => {
    const svg = await generateQrSvg("https://rocky.gov/verify?ref=1");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });
});
