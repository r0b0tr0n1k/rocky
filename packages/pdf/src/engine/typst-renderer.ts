/**
 * typst-renderer — WASM-backed visual render stage (ADR-0082)
 *
 * Renders a Typst (.typ) template to PDF bytes using the prebuilt
 * `@myriaddreamin/typst.ts` WASM compiler (no Rust toolchain at build time).
 *
 * This is the `format: "pdf"` render step of the PDF/A-3 hybrid pipeline.
 * Downstream stages (not here) embed the source as PDF/A-3 via `@e-invoice-eu`
 * and PAdES-sign via the HSM.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createTypstCompiler,
  initOptions,
  loadFonts,
  MemoryAccessModel,
  type TypstCompiler,
} from "@myriaddreamin/typst.ts";
import { CompileFormatEnum } from "@myriaddreamin/typst.ts/compiler";

/**
 * PDF/A font rule: every font in the rendered document MUST be embedded. We do
 * NOT rely on host system fonts. Instead we bundle a fixed, open-licensed set
 * under `packages/pdf/assets/fonts/` and let Typst embed + subset + emit a
 * ToUnicode CMap. DejaVu Sans covers the Latin + Cyrillic scripts Rocky needs
 * (Macedonian). The PDF/A-3 wrapper (@e-invoice-eu) adds the OutputIntent +
 * embedded XML; it does NOT re-embed fonts, so Typst must already produce an
 * embed-all-fonts PDF. Conformance is asserted by veraPDF in CI.
 *
 * NOTE: at runtime `import.meta.url` resolves under `dist/engine/`, so the
 * build must copy `assets/` to `dist/assets/` (see package build step).
 */
const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "assets", "fonts");
const LOGO_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "assets", "rocky-goat.png");
const FONT_FILES = [
  "DejaVuSans.ttf",
  "DejaVuSans-Bold.ttf",
  "DejaVuSans-Oblique.ttf",
  "DejaVuSans-BoldOblique.ttf",
];

export function loadLogoPng(): Uint8Array | null {
  if (!existsSync(LOGO_PATH)) return null;
  return new Uint8Array(readFileSync(LOGO_PATH));
}

function resolveFonts(): Uint8Array[] {
  return FONT_FILES.map((name) => join(FONT_DIR, name))
    .filter((path) => existsSync(path))
    .map((path) => new Uint8Array(readFileSync(path)));
}

let compilerPromise: Promise<TypstCompiler> | null = null;
let accessModel: MemoryAccessModel | null = null;

/**
 * Lazily build and initialize a shared Typst compiler with an in-memory
 * filesystem. Initialization is heavy (loads the WASM module + bundled fonts),
 * so we memoize a single instance. The shared in-memory `accessModel` is also
 * where callers inject virtual files (e.g. a `model.json` for templates).
 */
async function getCompiler(): Promise<TypstCompiler> {
  if (!compilerPromise) {
    const compiler = createTypstCompiler();
    accessModel = new MemoryAccessModel();
    compilerPromise = compiler
      .init({
        beforeBuild: [
          initOptions.withAccessModel(accessModel),
          loadFonts(resolveFonts()),
        ],
      })
      .then(() => compiler)
      .catch((error) => {
        // Reset so a later call can retry (e.g. after installing fonts).
        compilerPromise = null;
        accessModel = null;
        throw error;
      });
  }
  return compilerPromise;
}

export interface TypstRenderInput {
  /** Typst source (.typ). May reference `sys.inputs` / injected files. */
  template: string;
  /** Values exposed to the template via `sys.inputs` (strings only). */
  inputs?: Record<string, string>;
  /**
   * Extra virtual files to make available to the template (e.g. `model.json`).
   * Keyed by absolute path; the template reads them via `read("<name>")`.
   */
  files?: Record<string, Uint8Array>;
  /** Virtual main file path. Defaults to `/main.typ` (absolute, per typst.ts). */
  mainFilePath?: string;
}

/**
 * Compile a Typst template to PDF bytes.
 * @throws if the compiler yields no artifact (template/diagnostics error).
 */
export async function renderTypst(input: TypstRenderInput): Promise<Uint8Array> {
  const mainFilePath = input.mainFilePath ?? "/main.typ";
  const compiler = await getCompiler();

  compiler.addSource(mainFilePath, input.template);

  if (input.files && accessModel) {
    const now = new Date();
    for (const [path, bytes] of Object.entries(input.files)) {
      accessModel.insertFile(path, bytes, now);
    }
  }

  const result = await compiler.compile({
    mainFilePath,
    format: CompileFormatEnum.pdf,
    inputs: input.inputs ?? {},
  });

  if (!result?.result) {
    const diagnostics = result?.diagnostics
      ? JSON.stringify(result.diagnostics)
      : "no artifact produced";
    throw new Error(`Typst render failed: ${diagnostics}`);
  }

  return result.result;
}
