# Testing the Result Monad Doctrine

> A doc-test that proves `result-monad-and-error-sovereignty.md` is not just ideology — its import guidance actually resolves against the real `@rocky/*` source.

## Why this exists

A doctrine doc that tells developers to `import { unwrap } from "@rocky/domains-shared"` is worse than no doc if `unwrap` is not exported. This test parses the doctrine's code blocks, verifies every `@rocky/*` import resolves to a real export, and then functionally exercises the Result monad and `createResultUnwrapper` against the **built** packages.

## Run it

```bash
# from repo root
node --test apps/docs/scripts/verify-result-doctrine.mjs

# or, scoped to the docs workspace
pnpm --filter docs test:doctrine
```

The functional tests import `dist/`, so the packages must be built first (`pnpm --filter @rocky/domains-shared build`, `@rocky/trpc build`, …).

## What it checks

| Test | Asserts |
| --- | --- |
| doc structure | The three pillars (Result Monad Sovereignty, Error Code Parsimony, Church and State) are present |
| `@rocky/domains-shared` exports | `ok`, `err`, `isError`, `SHARED_ERRORS`, `Result` are real exports |
| doc CORRECT imports | Every `@rocky/*` symbol the doc tells you to import actually exists (no phantom symbols like `unwrap`) |
| `@rocky/validators/errors` | Owns ≥1 `*_TRPC_ERROR_MAP` (TRPC maps live here, not in domains) |
| `@rocky/errors` | Exports `NotFoundError`, `ForbiddenError`, `DbError` |
| cross-links | Any `](./X.md)` link resolves to a real file |
| functional — monad | `ok`/`err`/`isError` behave; `unwrap` is **not** a top-level export |
| functional — unwrapper | `createResultUnwrapper(map)` throws `TRPCError` with the mapped code for a coded domain error |

Deliberately-WRONG examples in the doc (marked `❌ WRONG`) are skipped — they are meant to fail.

## Findings this test caught (and we fixed)

1. **Phantom `unwrap`** — the doc listed `unwrap` as a top-level export of `@rocky/domains-shared` (Import Ownership Table + "CORRECT" block + prose). It is not: `unwrap` is a *method* on `Result` (via neverthrow), not a standalone export. The doc now imports only `ok`/`err`/`isError`/`Result`/`SHARED_ERRORS` from `@rocky/domains-shared`.
2. **`err(code, message)` two-arg form** — the doc's domain-error examples called `err("CODE", "message")`. neverthrow's `err` takes **one** argument, and real domain code wraps a coded error class (e.g. `MovementError` with `.code`). Examples now use `err(new RideError("CODE", "message"))`.

Both are corrected in `result-monad-and-error-sovereignty.md`.

## Related

- [Result Monad & Error Sovereignty](./result-monad-and-error-sovereignty.md) — the doctrine under test
- [Offline Subsystem Doctrine Test](../scripts/verify-offline-doctrine.mjs) — same doc-test pattern applied to the mobile offline contract (WO-082); run with `pnpm --filter docs test:offline`
- [Router Patterns & Anti-Patterns](./router-patterns.md)
- [Router Design (Canonical Blueprint)](./router-design.md)
