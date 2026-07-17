import nextra from "nextra";
import { existsSync } from "node:fs";
import path from "node:path";

// Monorepo root = the directory containing pnpm-workspace.yaml, found by
// walking up from cwd. Next/Turbopack's OWN root inference also walks up, but
// it latches onto the FIRST workspace file it meets — and a stray
// $HOME/pnpm-workspace.yaml (installed by a tool such as opencode) sits ABOVE
// the real one, so without this explicit root Turbopack treats $HOME as the
// monorepo root and scans a massive tree (incl. unrelated projects like
// ~/upgraded-giggle). That makes `next build` crawl and get SIGTERM'd (143).
// Mirrors the identical fix in apps/web/next.config.ts.
// No import.meta.url / node:path default imports: those forced Next to emit a
// CJS config that breaks under package.json "type": "module".
function findMonorepoRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (existsSync(`${dir}/pnpm-workspace.yaml`)) return dir;
    const parent = dir.replace(/\/[^/]*$/, "");
    if (parent === dir) return start;
    dir = parent;
  }
}

const monorepoRoot = findMonorepoRoot(process.cwd());

const withNextra = nextra({
  // Nextra Docs Theme options
  defaultShowCopyCode: true,
  search: {
    codeblocks: false,
  },
});

export default withNextra({
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  reactStrictMode: true,
  turbopack: {
    root: monorepoRoot,
    // ADR-0104 commits Mermaid `.mmd` sources under content/ (next to rendered
    // PNGs in public/). Nextra's content scan enumerates every file there, so
    // Turbopack must resolve `.mmd` as a no-op module instead of erroring with
    // "Unknown module type". The site only embeds the PNGs, never the source.
    rules: {
      "*.mmd": {
        loaders: [{ loader: "./scripts/mermaid-source-loader.mjs" }],
        as: "*.js",
      },
    },
  },
});
