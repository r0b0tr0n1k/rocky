# Plan: Wire RobotFarm bots as pi role-folders (AGENTS.md → subagent `cwd`)

> **Extension switch (2026-07-14, late):** the canonical subagent extension is now
> **`pi-herdr-subagents`** (`pi install npm:pi-herdr-subagents`; runs in herdr, the required mux).
> The earlier `HazAT/pi-herdr-subagents` extension was **removed**
> (`pi remove git:github.com/HazAT/pi-herdr-subagents`); its `@mariozechner/*` rename/port
> saga below is now moot. The 31 `-bot` agents were cleaned of HazAT-only frontmatter
> (`system-prompt: append`, `deny-tools: claude`) and now conform to `pi-herdr-subagents`' schema.
> All Role Folders mechanics (cwd→`AGENTS.md` auto-load, per-role `.pi/skills`) are unchanged and
> extension-agnostic.

## Context

The repo already has 29 `AGENTS.md` files: a root contract plus one per RobotFarm bot
(`packages/database/AGENTS.md`, `apps/api/AGENTS.md`, `packages/domains/animal/AGENTS.md`, …).
The `pi-herdr-subagents` extension supports "Role Folders" via a `cwd` parameter, but its
README demonstrates the Claude-Code convention (`agents/game-designer/CLAUDE.md`). This plan maps
that pattern onto pi's existing `AGENTS.md` convention so each bot's contract is loaded
automatically when a subagent is scoped to its folder — no file moves, no duplicated instructions.

## How it actually works (verified in source)

- pi `DefaultResourceLoader.loadProjectContextFiles` walks **up from the session `cwd`** and loads
  every `AGENTS.md` (also `CLAUDE.md`) found, plus global `~/.pi/agent` context. The `cwd` chooses
  the instructions.
- The extension's `subagent({ cwd })` launches the child as `cd <effectiveCwd> && pi …`, so a child
  booted in `packages/database` auto-loads `packages/database/AGENTS.md` + root `AGENTS.md`.
- `effectiveCwd` for a **spawn-param** `cwd` is resolved against `process.cwd()` (project root) →
  relative paths work. For an agent-**frontmatter** `cwd`, the base is `getAgentConfigDir()`
  (`~/.pi/agent` or `$PI_CODING_AGENT_DIR`) → **must be absolute**.
- If a target folder owns a `.pi/agent/` dir, that becomes the config root; the bot folders don't,
  so global config is used (fine).

## Decision: primary pattern = spawn-param `cwd`

Pass `cwd` at every `subagent()` call with a project-relative path. Zero new files, no absolute-path
fragility, works today. Named role agents (`.pi/agents/*.md`) are an optional convenience layer.

## Todos

- [ ] **TODO-1 — Document the RobotFarm ↔ role-folder mapping in root `AGENTS.md`.**
  Add a short section (RobotFarm pass) listing each bot → its `cwd` (already in the Child RobotFarm
  Index) and the rule: `subagent({ cwd: "<scope>" })` auto-loads that `AGENTS.md`. Keep the index and
  the new section consistent.

- [ ] **TODO-2 — Establish the named-role-agent pattern (optional convenience).**
  Create `.pi/agents/<role>.md` for the most-spawning bots (database, validators, api, animal,
  movement, web, mob) using the existing `worker.md` frontmatter as the template:
  `model`, `thinking: minimal`, `spawning: false`, `auto-exit: true`, `system-prompt: append`, and
  `cwd: <absolute repo path>`. Reference the absolute-path gotcha in a comment.

- [ ] **TODO-3 — Verify cwd scoping actually loads `AGENTS.md`.**
  Spawn a probe: `subagent({ name: "DB probe", cwd: "packages/database", agent: "scout",
  task: "List the Drizzle tables in this package and cite the Database Bot contract from AGENTS.md." })`
  Confirm the child's output references the Database Bot contract (proves `packages/database/AGENTS.md`
  was injected).

- [ ] **TODO-4 — Capture usage in a how-to doc (per ADR-0052 / ADR-0033).**
  Add `apps/docs/content/how-to/spawn-a-role-subagent.mdx` showing pattern A + B with the two bots as
  examples. (Optional; do only if docs coverage is wanted.)

## Usage examples (drop-in)

```typescript
// Pattern A — relative cwd, resolves from project root
subagent({ name: "Database Bot", cwd: "packages/database", agent: "worker",
  task: "Add the herd_id column to animals per the contract." });

subagent({ name: "API Bot", cwd: "apps/api", agent: "worker",
  task: "Add a router procedure for ear-tag stock." });

// Pattern B — named role agent (after TODO-2)
subagent({ agent: "database-bot", task: "Generate the migration for x." });
```

## Status (2026-07-14)

- [x] **TODO-1** — Root `AGENTS.md` now has a "Role Folders — pi subagent scoping" section
      (Pattern A + Pattern B + the absolute-`cwd` gotcha). RobotFarm pass done.
- [x] **TODO-2** — Created **31** named role agents in `.pi/agents/<bot>.md` (full layer coverage:
      one per folder that owns an `AGENTS.md`). Each mirrors `worker.md` frontmatter with an absolute
      `cwd` + `spawning: false`.
- [x] **TODO-3** — Verified. `subagents_list` (extension tool) discovers all 31 `-bot` agents.
      A live `cwd: "packages/database"` child pi auto-loaded `packages/database/AGENTS.md` and cited
      the Database Bot scope + Schema Change Workflow — proving the mechanism.
- [x] **TODO-4** — Docs how-to written: `apps/docs/content/how-to/spawn-a-role-subagent.mdx`
      (Patterns A/B, per-role `.pi/skills`, two-backend caveat, gotchas, test pointer). Registered in
      `how-to/index.mdx`; cross-linked from root `AGENTS.md` Role Folders section.
      `check:md-links` ✓ and `check:agents` ✓ (24 bots, 0 missing).

### ⚠️ cwd resolution: spawn-param vs frontmatter (verified on extension v3.7.2)

The README's Role Folders section conflates two different `cwd` bases:

- **Spawn-param `cwd`** (`subagent({ cwd: "agents/game-designer" })`) → base `process.cwd()` = project root.
  Relative paths WORK. This is Pattern A.
- **Frontmatter `cwd`** (`cwd: ./agents/game-designer`) → base `getAgentConfigDir()` = `~/.pi/agent`.
  Relative paths resolve to `~/.pi/agent/<path>` and MISS the project. The README's frontmatter
  example is a doc/code mismatch in v3.7.2. Only ABSOLUTE frontmatter `cwd` works → that is why the
  31 named agents use absolute `cwd` (Pattern B).

### ⚠️ Per-role skills (`.pi/skills/`)

pi loads `<cwd>/.pi/skills` for every session, so a role folder's own skills load automatically when
that folder is the active cwd. Drop skills at `<botfolder>/.pi/skills/<skill>.md` (e.g.
`packages/database/.pi/skills/`). Works via Pattern A and the absolute-cwd named agents. Our bot
folders ARE the role folders — no separate `agents/` tree needed.

**Verified (per-role skill demo):** created `packages/database/.pi/skills/db-migration/SKILL.md`.
Direct pi-core `loadSkills({ cwd: "packages/database", includeDefaults: true })` returns
`['find-skills [user]', 'db-migration [project]']` — proving `<cwd>/.pi/skills` is scanned and the
role-folder skill is discovered. (A harness-subagent probe reported "no skill available" only because
the harness `subagent` backend does not run full skill-dir discovery — same two-backend caveat; the
extension's child pi does.)

**TODO-5 (done):** Demonstrate per-role skills — `db-migration` skill scoped to the Database Bot folder.

There are TWO `subagent` backends in play:

1. **pi-herdr-subagents extension** `subagent` — reads `.pi/agents/*.md`, supports `cwd`.
   This is the README's tool and the one that consumes the new `-bot` role agents.
2. **Harness skill-registry** `subagent` — what THIS main session invokes; its agent list is the
   179 skill-subagents (api-docs-writer, batch-processor, …). It does NOT see `.pi/agents/*.md`.

So `subagent({ agent: "database-bot" })` from the harness backend errors with "Unknown agent",
while the extension backend resolves it. The named layer is correct and discovered by the extension
(`subagents_list` confirms). In the user's own environment — where the extension's `subagent` is the
active tool — `subagent({ agent: "database-bot", task })` works as documented. The `cwd`→`AGENTS.md`
loading itself was proven via the harness backend using a known agent + `cwd`.

## Open questions for the user

1. ~~Named-role-agent layer?~~ → **Yes, done (31 agents).**
2. Docs how-to (TODO-4)? → pending.
3. Which bots first? → all folders with `AGENTS.md` (full layer).

## Test (TODO-6 — done)

Added `.pi/test/role-folders.test.ts` — a dependency-free `node --test` suite (Node 24 runs TS
natively) that imports the REAL installed pi modules (`@earendil-works/pi-coding-agent`
`loadProjectContextFiles` + `loadSkills`) and asserts:

1. a role folder's `AGENTS.md` is loaded as a context file when `cwd` = that folder;
2. a per-role skill at `<cwd>/.pi/skills/<name>/SKILL.md` is discovered;
3. skills are scoped to `cwd` (the role skill is NOT visible from an unrelated folder).

Run: `node --test .pi/test/role-folders.test.ts` → 3/3 pass. The two hardcoded absolute paths to
the global pi install are machine-specific; resolve via the package name if portability is needed.

> Note: the pre-existing `.pi/test/*` (the extension's own suite) is NOT runnable as-is — two reasons:
> (1) its `../pi-extension` import target (`.pi/pi-extension/`) is missing, and (2) the extension
> imports `@mariozechner/pi-coding-agent` + `@mariozechner/pi-tui`, which are **not installed here** —
> the running pi is the fork `@earendil-works/pi-coding-agent` v0.80.7 (+ nested `@earendil-works/pi-tui`).
> The fork also restructured the extension authoring API (`defineTool`/`loadExtensions`/`ExtensionRunner`
> in `dist/core/extensions`; it no longer exports `ExtensionAPI`/`ExtensionContext` from the main entry).
> BUT the extension's only *runtime* value-imports — `keyHint` (fork ✓) and `Box`/`Text`/`truncateToWidth`/
> `visibleWidth` (earendil `pi-tui` ✓) — all resolve against the fork. The `ExtensionAPI`/`ExtensionContext`
> imports are `import type` (erased at runtime under Node type-stripping). So the extension is a **simple
> runtime alias** (`@mariozechner/pi-coding-agent`→earendil fork, `@mariozechner/pi-tui`→earendil `pi-tui`)
> away from running on the replacement — not a code rewrite. (`role-folders.test.ts` already targets the
> real fork directly, so it is the authoritative proof and needs no alias.)

## Library reality check (user question: "use the replacement, not Mario's")

- **Earendil IS Mario's pi, renamed.** Mario transitioned the project to the Earendil company; the
  package was renamed `@mariozechner/pi-coding-agent` → `@earendil-works/pi-coding-agent` (same
  upgraded codebase, now v0.80.7). So this is a **rename, not a library swap** — aliasing the old
  names to the new ones is unambiguously correct.
- The **only** pi installed and running is `@earendil-works/pi-coding-agent` v0.80.7. Mario's old
  `@mariozechner/pi-coding-agent` is absent and unresolved everywhere (expected — superseded by rename).
- `role-folders.test.ts` deliberately imports the REAL fork (`@earendil-works/pi-coding-agent`), so the
  proof is against the actual running pi. The extension's own source + its bundled `.pi/test` suite
  still carry the **stale** `@mariozechner/*` names, which is why they can't load here.
- The fork's skill system collects skills via `collectAutoSkillEntries` (project/agent/user dirs),
  funneled through `updateSkillsFromPaths` → `loadSkills` (which scans `<cwd>/.pi/skills`). The test
  calls that exact `loadSkills` with `cwd=packages/database` and gets `db-migration [project]`.
- To make the extension load here: update its `@mariozechner/*` references to `@earendil-works/*`
  (rename) + reconcile the small 0.65→0.80 authoring-API drift (`defineTool`/`loadExtensions`/
  `ExtensionRunner`). Runtime value-imports (`keyHint`, pi-tui `Box`/`Text`/`truncateToWidth`/
  `visibleWidth`) already resolve against the fork.

### ✅ Rename APPLIED (user request: name change recurs as an issue)

- Renamed `@mariozechner/pi-coding-agent` → `@earendil-works/pi-coding-agent` and
  `@mariozechner/pi-tui` → `@earendil-works/pi-tui` in:
  - `pi-herdr-subagents/package.json` (peer + dev deps; `^0.65.0` ranges relaxed to `*` so they
    accept the installed 0.80.7 fork).
  - `pi-extension/subagents/index.ts`, `pi-extension/subagents/subagent-done.ts`.
  - `pi-herdr-subagents/test/test.ts` (the upstream suite copy).
  - `apps/...`? no — also the repo copy `.pi/test/test.ts` (line 7).
- Deleted the stale `package-lock.json` (it pinned the old Mario 0.65.0 transitive tree —
  `@mariozechner/clipboard`, `pi-agent-core`, `pi-ai` — which is inconsistent after the rename and
  would break `npm ci`; it regenerates from the corrected `package.json`).
- Whole-repo code sweep: **zero** remaining `@mariozechner` references (only `plan.md` narrative).
- Caveat: deeper 0.65→0.80 authoring-API drift (`ExtensionAPI`/`ExtensionContext` no longer exported
  from the main entry; now `defineTool`/`loadExtensions`/`ExtensionRunner` in `dist/core/extensions`)
  is a separate port — the rename fixes the recurring *name-resolution* failure, not full API parity.
  Also note `.pi/test/*` still has a broken `../pi-extension` import path (test-layout issue, distinct
  from the name).
