# Shared Domain Package

**Scope:** `packages/domains/shared/` — base repository, error helpers, result types
**Source spec:** `AGENTS.md` §Error Sovereignty Doctrine
**Last verified:** 2026-07-05

## Overview

Shared utilities used by all domain packages. Provides the base repository pattern, error mapping, and Neverthrow result helpers.

## Key Files

| File | Purpose |
|------|---------|
| `repository.ts` | `BaseRepository` — abstract class with `DatabaseProvider` client getter |
| `errors.ts` | `UserError`, `toAppError()`, `fromAsyncThrowable()` — error handling helpers |
| `result.ts` | Re-exports from `neverthrow`: `ok`, `err`, `Result`, `unwrap` |

## Error Sovereignty Doctrine

1. **Neverthrow Sovereignty** — Services return `Result<T, E>`
2. **Error Code Parsimony** — Consolidate to `NOT_FOUND`, `FORBIDDEN`, `DATABASE_ERROR`
3. **Church and State** — Domain services return `Result`. tRPC routers map to `TRPCError`.
