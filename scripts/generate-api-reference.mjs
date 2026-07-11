#!/usr/bin/env node
// Deterministic API-reference generator (Option D, ADR-0052).
// Extracts the tRPC surface from apps/api/src/routers/*.router.ts
// (router alias + Query/Mutation procedures + Zod input/output schemas)
// and writes a static MDX page. NO Nextra TSDoc / Turbopack virtual modules.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const ROUTERS_DIR = join(root, 'apps/api/src/routers')
const OUT = join(root, 'apps/docs/content/reference/api-reference.mdx')

const OPEN = { '{': '}', '[': ']', '(': ')' }
const CLOSE = { '}': '{', ']': '[', ')': '(' }

// Find the matching ')' for a decorator that starts at text[i] === '('.
function matchingClose(text, i) {
  let depth = 0
  let j = i
  let inStr = null
  while (j < text.length) {
    const c = text[j]
    if (inStr) { if (c === inStr && text[j - 1] !== '\\') inStr = null }
    else if (c === '"' || c === "'" || c === '`') inStr = c
    else if (OPEN[c]) depth++
    else if (CLOSE[c]) { depth--; if (depth === 0) return j }
    j++
  }
  return j
}

// Balance ALL delimiters; stop at a top-level ',' or '}' (decorator property end).
// NB: the top-level terminator check MUST come BEFORE OPEN/CLOSE handling,
// else a '}' at depth 0 is consumed as a close-delimiter and leaks past it.
function valueOf(body, key) {
  const idx = body.indexOf(key + ':')
  if (idx < 0) return '-'
  let i = idx + key.length + 1
  while (i < body.length && /\s/.test(body[i])) i++
  let j = i
  let inStr = null
  let depth = 0
  while (j < body.length) {
    const c = body[j]
    if (inStr) { if (c === inStr && body[j - 1] !== '\\') inStr = null }
    else if (c === '"' || c === "'" || c === '`') inStr = c
    else if ((c === ',' || c === '}') && depth === 0) break
    else if (OPEN[c]) depth++
    else if (CLOSE[c]) { if (depth > 0) depth-- }
    j++
  }
  const v = body.slice(i, j).replace(/\s+/g, ' ').trim()
  return v || '-'
}

function parseRouter(text) {
  const aliasM = text.match(/@Router\(\{\s*alias\s*:\s*["']([^"']+)["']/)
  const alias = aliasM ? aliasM[1] : 'unknown'
  const procs = []
  const re = /@(Query|Mutation)\s*\(/g
  let m
  while ((m = re.exec(text)) !== null) {
    const kind = m[1]
    const open = m.index + m[0].length - 1 // position of '('
    const close = matchingClose(text, open)
    const body = text.slice(open + 1, close)
    const input = valueOf(body, 'input')
    const output = valueOf(body, 'output')
    let k = close + 1
    while (k < text.length && /\s/.test(text[k])) k++
    const modRe = /^(?:public|private|protected|async|static)\s+/g
    let mm
    while ((mm = modRe.exec(text.slice(k))) && mm.index === 0) k += mm[0].length
    const nameM = text.slice(k).match(/^([A-Za-z_]\w*)\s*\(/)
    const name = nameM ? nameM[1] : 'unknown'
    procs.push({ kind, name, input, output })
  }
  return { alias, procs }
}

function generate() {
  if (!existsSync(ROUTERS_DIR)) return null
  const files = readdirSync(ROUTERS_DIR).filter(f => f.endsWith('.router.ts')).sort()
  const routers = []
  for (const f of files) {
    const text = readFileSync(join(ROUTERS_DIR, f), 'utf8')
    const r = parseRouter(text)
    if (r.procs.length) routers.push(r)
  }
  routers.sort((a, b) => a.alias.localeCompare(b.alias))

  const totalProcs = routers.reduce((n, r) => n + r.procs.length, 0)
  const L = []
  L.push('# API Reference')
  L.push('')
  L.push('> ⚠️ **AUTO-GENERATED** from `apps/api/src/routers/*.router.ts` via `pnpm gen:api-reference`. Do not edit by hand — re-run the generator when routers change.')
  L.push('')
  L.push('The Rocky API is a **tRPC** layer generated from NestJS routers (`@Router` / `@Query` / `@Mutation`) by `nestjs-trpc generate` into `packages/trpc/src/generated/server.ts`. It currently exposes **' + routers.length + ' routers / ' + totalProcs + ' procedures**. The NoDrift ideology holds at the boundary: the client `AppRouter` type *is* the contract, so drift is impossible by construction (enforced by `check:trpc-boundary` in `ci:checks`).')
  L.push('')
  L.push('## Where the surface lives')
  L.push('')
  L.push('- **`packages/trpc/src/generated/server.ts`** — the generated `AppRouter` type. Web and mobile consume it for end-to-end type safety. Regenerate with `pnpm generate:trpc`.')
  L.push('- **`@rocky/validators`** — every procedure’s input/output Zod schema (the "Diamond Seal" API contracts). Drift is caught by the NoDrift guillotine.')
  L.push('- **Domain services** — the business logic behind each procedure (see per-domain ADRs).')
  L.push('')
  L.push('## Why not Nextra’s `TSDoc`?')
  L.push('')
  L.push('Nextra’s `<TSDoc>` component turns TS types into property / parameter / return tables. It is **intentionally not used here**: under Next 16 + Turbopack it fails to resolve the `next-mdx-import-source-file` virtual module that `<TSDoc>` pulls in at build time (the same rot that broke `pnpm build`). Instead this page is generated **deterministically** from the router source — no Turbopack virtual modules, no dependence on Nextra’s broken component. Tracked in **ADR-0052**.')
  L.push('')
  L.push('## Routers')
  L.push('')
  L.push(routers.map(r => '- [' + r.alias + '](#' + r.alias.toLowerCase() + ') — ' + r.procs.length + ' procedure' + (r.procs.length === 1 ? '' : 's')).join('\n'))
  L.push('')
  for (const r of routers) {
    L.push('## ' + r.alias)
    L.push('')
    L.push('| Procedure | Kind | Input | Output |')
    L.push('| --- | --- | --- | --- |')
    for (const p of r.procs) {
      L.push('| `' + p.name + '` | ' + p.kind + ' | `' + p.input + '` | `' + p.output + '` |')
    }
    L.push('')
  }
  return L.join('\n') + '\n'
}

try {
  const md = generate()
  if (!md) throw new Error('no routers found')
  writeFileSync(OUT, md) // write in place; generation is dependency-free & safe
  console.log('✓ generated', OUT, '(', md.split('\n').length, 'lines )')
} catch (e) {
  console.error('⚠️ api-reference generation skipped:', e.message)
  process.exit(0) // never break the build
}
