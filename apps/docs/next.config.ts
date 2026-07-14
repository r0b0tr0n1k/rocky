import nextra from "nextra";
import { existsSync } from "node:fs";

// Monorepo root = the directory containing pnpm-workspace.yaml, found by
// walking up from cwd. In the Docker build cwd is /app (the repo root);
// locally it is apps/docs (two levels below the root). This works in BOTH
// layouts and avoids the empty-string root that broke `next build` in the
// container. No import.meta.url / node:path default imports (those forced
// Next to emit a CJS config that breaks under package.json "type": "module").
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
  reactStrictMode: true,
  turbopack: { root: monorepoRoot },
});
