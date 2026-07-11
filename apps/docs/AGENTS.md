# Docs Bot — `apps/docs/` AGENTS.md

Nextra 4 documentation site (Next.js + Nextra Docs Theme) for the Rocky platform.
MDX content lives in `content/` (architecture ADRs in `content/ADR/`). This file is the
local RobotFarm contract for the docs app.

## Stack

- **Next.js 16** (App Router, Turbopack dev) — `next dev --turbopack --port 3002`
- **Nextra 4** (`nextra` + `nextra-theme-docs`) — theme/layout via `<Layout>` / `<Head>`
- **React 19** / **react-dom 19**
- **Tailwind CSS v4** (`@tailwindcss/postcss`), `@rocky/ui` (shared shadcn components)
- `tsx` + `node --test` for the doctrine doc-tests in `scripts/`

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | `next dev --turbopack --port 3002` |
| `pnpm build` / `pnpm start` | production build / serve |
| `pnpm check-types` | `tsc --noEmit` |
| `pnpm test:doctrine` | `node --test scripts/verify-result-doctrine.mjs` (Result-monad doc-test) |
| `pnpm test:offline` | `TSX_TSCONFIG_PATH=scripts/tsconfig.offline-test.json node --import tsx --test scripts/verify-offline-doctrine.mjs` (mobile offline contract doc-test, WO-106) |

## Child RobotFarm Index

No child packages. `scripts/` holds doc-tests:

- `verify-result-doctrine.mjs` — verifies the Result-doctrine docs + exercises real `Result`/`ResultAsync` logic.
- `verify-offline-doctrine.mjs` — verifies the mobile offline contract + functionally exercises the real `lib/offline/*` against in-memory fakes (WO-106).
- `_fakes/` — in-memory `expo-sqlite` / `expo-secure-store` shims used by `test:offline` (state on `globalThis`).
- `tsconfig.offline-test.json` — `paths` that redirect the native deps to the fakes.

## Content structure

Docs follow the **Diátaxis** taxonomy (see [ADR-0052](content/ADR/0052-documentation-architecture.md)):

- `content/ADR/` — decision records (51 + this ADR), enforced by `check:adrs`
- `content/tutorials/` — learning-oriented onboarding
- `content/explanation/` — why/how-it-works narratives (the former flat prose links here)
- `content/how-to/` — task recipes (add router / domain / validator / migration / guardian)
- `content/reference/` — API reference (TSDoc) + catalogs (permissions / enums / errors)
- `content/runbooks/` — operational procedures (DB recreate / deploy / env)

The root `_meta.ts` groups these via Nextra separators (Learn / Architecture / Build & Operate / Project).
Every new doc is an asset (ADR-0033 D2); links are guarded by `check:md-links`.

## Layout contract

`app/layout.tsx` uses Nextra's `<Head color={...} backgroundColor={...}>` to set the theme
(primary hue 152 = green) and `<Layout>` from `nextra-theme-docs`. The `<html>` carries
`suppressHydrationWarning` (required for `next-themes`). This is the documented Nextra 4
pattern and is correct — do **not** remove the `color` prop to "fix" a hydration warning
(see below).

## Troubleshooting

### ⚠️ Stale `.next` hydration phantom (antd `data-rc-*` false positive)

**Symptom** — `docs:dev` logs a React hydration error on the `<style>` in `<head>`:

```
Hydration failed because the server rendered text didn't match the client ...
  <style
-   data-rc-order="prependQueue"
-   data-rc-priority="-999"
-   data-css-hash="44dbs9"
-   data-token-hash="20tov7"
  >
-   .css-1i0052b a{color:#1668dc; ...}
+   {":root { --nextra-primary-hue: 152deg; ... }"}
```

The `data-rc-order` / `data-css-hash` / `data-token-hash` attributes + `.css-NNNNNN` classes
are the signature of **`@ant-design/cssinjs`** (antd's style injector, default primary blue
`#1668dc`).

**Root cause** — this is a **stale `.next` cache**, *not* a code bug. The antd `<style>` in
the server HTML cannot come from the current code: antd / `@ant-design/cssinjs` appear
**0 times** in `pnpm-lock.yaml`, no `package.json` depends on them, and no source imports
them. It is a ghost chunk left from a previously-built `.next` (an earlier moment when antd
*cssinjs* was a dependency, then removed, but the cache was never purged). The running dev
server keeps serving that embalmed antd `<style>`; the client (rebuilt from the clean code)
renders Nextra's `:root` style instead → mismatch.

**Verification** — with a clean `.next`, a headless-Chromium load of any ADR page shows
`--nextra-primary-hue: 152deg` correctly, **zero** hydration-error text, and **no**
`data-rc-*` `<style>` in the DOM. The current code hydrates cleanly.

**Fix** — stop `docs:dev`, purge the cache, restart:

```bash
# stop docs:dev (Ctrl+C) first
rm -rf apps/docs/.next
pnpm install        # only if deps changed — ensures node_modules matches the clean lockfile
pnpm --filter docs dev
```

Do **not** edit `app/layout.tsx` to "fix" this — the `<Head color>` is correct and matches
the green theme. The real praxis is: **delete the cache, not the code.**

> Note: the `data-rc-*` mismatch can also appear under a mislabeled dev pane (e.g.
> `@rocky/mobile-app:dev` when several `pnpm dev` processes run at once). The trace
> `app/layout.tsx:92` + `<Head color>` is unambiguously the **docs** app, not the Expo app.

## RobotFarm

- Docs Bot owns `apps/docs/` (per root Child RobotFarm Index).
- Doc-tests follow `content/TESTING_DOCTRINE.md`.
- ADRs are authored as MDX in `content/ADR/` (see ADR-0011 / 0018 / 0019 for architecture).
