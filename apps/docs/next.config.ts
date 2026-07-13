import nextra from 'nextra'

// Monorepo root = two path segments up from this app (apps/<app> -> repo root).
// Derived from cwd (the app dir during next build/dev) so the build works
// wherever the repo is mounted (local /home/goce/appz/rocky vs Docker /app).
// No import.meta.url / node:path value-imports: those forced Next to emit a CJS
// config that breaks under package.json "type": "module".
const monorepoRoot = process.cwd().split("/").slice(0, -2).join("/")

const withNextra = nextra({
  // Nextra Docs Theme options
  defaultShowCopyCode: true,
  search: {
    codeblocks: false
  }
})

export default withNextra({
  reactStrictMode: true,
  turbopack: { root: monorepoRoot }
})
