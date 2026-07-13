/**
 * Spike test: prove the prebuilt `@myriaddreamin/typst.ts` WASM compiler renders
 * a Typst template to a valid PDF in our Node/vitest environment (ADR-0082).
 */
import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderTypst } from "./typst-renderer.js";

/**
 * Network probe. The Typst WASM compiler opportunistically fetches default
 * font assets from `cdn.jsdelivr.net`; when that host is unreachable (offline
 * CI / sandbox) the render fails. Gate the spike so the suite stays green
 * offline — the deterministic sign/verify logic lives in `pades-cms.test.ts`.
 */
let networkOk = false;
try {
  await fetch("https://cdn.jsdelivr.net/", { method: "HEAD", signal: AbortSignal.timeout(4000) });
  networkOk = true;
} catch {
  networkOk = false;
}

const MINIMAL_TYP = `#set page(width: 210mm, height: 297mm)
= Rocky Test Document

Hello from Typst WASM — PDF/A-3 hybrid pipeline (ADR-0082).
`;

describe.skipIf(!networkOk)("renderTypst (WASM spike)", () => {
  it("compiles a minimal .typ template to PDF bytes", async () => {
    const pdf = await renderTypst({ template: MINIMAL_TYP });

    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(0);

    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");
  }, 120_000);

  it("renders Macedonian (Cyrillic) text with bundled fonts", async () => {
    const template = `#set page(width: 210mm, height: 297mm)
#set text(font: "DejaVu Sans")
= Известување за пасиште

Фарма Козјак — ЕУДР проверка на локацијата.
`;
    const pdf = await renderTypst({ template });

    expect(pdf).toBeInstanceOf(Uint8Array);
    const header = new TextDecoder().decode(pdf.slice(0, 5));
    expect(header).toBe("%PDF-");

    // Side effect: drop a sample so the rendered glyphs can be eyeballed.
    writeFileSync("/tmp/rocky-typst-mk-sample.pdf", pdf);
  }, 120_000);
});
