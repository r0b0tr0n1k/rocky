#!/usr/bin/env node
// RobotFarm AGENTS.md contract guardian.
//
// The root AGENTS.md "Child RobotFarm Index" is the AUTHORITATIVE registry of
// which directories are bots and therefore MUST own an AGENTS.md contract.
// This script enforces two invariants so the contracts can never silently rot:
//   1. MISSING  — every declared bot scope has an AGENTS.md (at scope or parent).
//   2. STALE    — every AGENTS.md "Child RobotFarm Index" references a path that exists.
// Exit code 1 if any MISSING/STALE is found (wired into ci:checks).

import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const ROOT_AGENTS = path.join(ROOT, 'AGENTS.md')

const exists = (p) => fs.existsSync(p)

// Find an AGENTS.md at `dir` or its immediate parent (Frontend Bot scope is
// apps/mob/app/ but the contract lives at apps/mob/AGENTS.md).
function findAgents(dir) {
  const d = dir.replace(/\/$/, '')
  if (exists(path.join(d, 'AGENTS.md'))) return path.join(d, 'AGENTS.md')
  const parent = path.dirname(d)
  if (parent && parent !== d && exists(path.join(parent, 'AGENTS.md')))
    return path.join(parent, 'AGENTS.md')
  return null
}

// Parse the "### Child RobotFarm Index" table from root AGENTS.md.
function parseIndex() {
  const txt = fs.readFileSync(ROOT_AGENTS, 'utf8')
  const lines = txt.split('\n')
  let inSection = false
  const rows = []
  for (const line of lines) {
    if (/^#{2,3}\s+Child RobotFarm Index/i.test(line)) { inSection = true; continue }
    if (inSection && /^#{2,3}\s+/.test(line) && !/Child RobotFarm Index/i.test(line)) break
    if (inSection && line.startsWith('|')) {
      const cells = line.split('|').map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1)
      // [Bot, Scope, AGENTS.md-desc]; scope is backtick-quoted.
      if (cells.length >= 2 && /Bot/i.test(cells[0]) && cells[1].startsWith('`')) {
        const scope = cells[1].replace(/`/g, '').replace(/\/$/, '')
        rows.push({ bot: cells[0].replace(/\*\*/g, ''), scope })
      }
    }
  }
  return rows
}

// Walk packages/ + apps/; for any AGENTS.md with a Child RobotFarm Index, verify
// each declared child scope resolves (root-relative OR relative to the file).
const stale = []
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'dist', 'build', '.turbo'].includes(e.name)) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full)
    else if (e.name === 'AGENTS.md') checkChildIndex(full)
  }
}
function checkChildIndex(file) {
  const txt = fs.readFileSync(file, 'utf8')
  const lines = txt.split('\n')
  let inSection = false
  for (const line of lines) {
    if (/^#{2,3}\s+Child RobotFarm Index/i.test(line)) { inSection = true; continue }
    if (inSection && /^#{2,3}\s+/.test(line) && !/Child RobotFarm Index/i.test(line)) break
    if (inSection && line.startsWith('|')) {
      const cells = line.split('|').map((c) => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1)
      if (cells.length >= 2 && /Bot/i.test(cells[0]) && cells[1].startsWith('`')) {
        const scope = cells[1].replace(/`/g, '').replace(/\/$/, '')
        const ok = exists(path.join(ROOT, scope)) || exists(path.join(path.dirname(file), scope))
        if (!ok) stale.push({ file: path.relative(ROOT, file), bot: cells[0].replace(/\*\*/g, ''), scope })
      }
    }
  }
}

const missing = []
const indexRows = parseIndex()
for (const { bot, scope } of indexRows) {
  const f = findAgents(path.join(ROOT, scope))
  if (!f) missing.push({ bot, scope })
}
walk(path.join(ROOT, 'packages'))
walk(path.join(ROOT, 'apps'))

let bad = false
if (missing.length) {
  bad = true
  console.log(`✗ ${missing.length} declared bot(s) MISSING AGENTS.md:`)
  for (const m of missing) console.log(`  ${m.bot}: ${m.scope}/AGENTS.md`)
}
if (stale.length) {
  bad = true
  console.log(`✗ ${stale.length} STALE child-index reference(s):`)
  for (const s of stale) console.log(`  ${s.file}: ${s.bot} -> ${s.scope} (not found)`)
}
if (!bad) {
  console.log(`✓ RobotFarm contracts consistent: ${indexRows.length} declared bots, 0 missing, 0 stale.`)
  process.exit(0)
}
process.exit(1)
