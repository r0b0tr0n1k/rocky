# ADR-0066: Error Sovereignty — Result Monad as the Domain↔Transport Boundary

> The point is to move Result to the boundary. Errors are typed facts, not thrown exceptions leaking
> internals.

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Status**     | Proposed                                                               |
| **Date**       | 2026-07-11                                                             |
| **Author**     | Architecture Review                                                    |
| **Source**     | Root AGENTS.md "Error Sovereignty Doctrine"; drift risk without a formal ADR |
| **Related**    | ADR-0003 (execution); ADR-0032 (tRPC); ADR-0018 / 0019 (validators); ADR-0041 (error UX); ADR-0022 (authz) |

## Context

Root AGENTS.md defines the Error Sovereignty Doctrine: domain services return `Result<T,E>`; tRPC
maps `E` → `TRPCError`; the domain never knows about HTTP. This is load-bearing architecture, yet it
lives only in AGENTS.md — there is no ADR. The force of circumstance: without a formal record, the
boundary drifts — services throw, routers read `.data` manually, mobile swallows `any`.

## Decision

1. **Domain services return `Result<T, E>`** from `@rocky/domains-shared` (`ok` / `err` / `unwrap` /
   `fromAsyncThrowable`). A service NEVER imports `TRPCError` or a transport response type.
2. **Error-code parsimony.** Only create a distinct error code when the frontend needs different
   branching. Consolidate CRUD failures to `NOT_FOUND | FORBIDDEN | DATABASE_ERROR`. Regulatory gates
   add `EUDR_BREACHED | DISEASE_ZONE_BREACHED` (mapped → HTTP 403).
3. **Unwrap at the boundary, never manually.** Routers call `createResultUnwrapper(TRPC_ERROR_MAP)`
   (from `@rocky/trpc`) and `return unwrap(result)`. Never `result.data` / `if (result.isErr) throw`.
   Each domain owns a `TRPC_ERROR_MAP` (in `@rocky/validators/errors`) translating its `E` → `TRPCError`.
4. **Mobile surfaces errors via the Query/Mutation cache `onError`** (tRPC v11 has no `errorLink`) —
   per ADR-0033 §D4 / ADR-0041. The unwrapped `TRPCError` (code + message) is the only error shape the
   client sees.
5. **Church and State.** Domain error classes are local to the service file; shared ones live in
   `@rocky/errors`; transport mapping lives only in routers/validators. The Real (failures) is
   expressed as typed `Err`, not exceptions crossing the boundary.

## Consequences

### Positive
- Type-safe error flow end-to-end; no leaked stack traces or `any` at the client.
- Frontend branches on stable codes, not message strings.

### Negative / Cost
- Per-domain `TRPC_ERROR_MAP` tables (boilerplate), but mechanically derived from the error union.

### Neutral
- Regulatory rejections (EUDR / disease-zone) reuse the same `FORBIDDEN` → 403 path with a typed code.

## Implementation

- Owning Bot: **API Bot** + **Validators Bot**.
- Audit: `rg -n "TRPCError" packages/domains` must return NOTHING (domains must not know tRPC).
- RobotFarm pass: note in root AGENTS.md Bot descriptions that services are Result-only; add to
  WORKORDER as a doctrine WO if not already present.

## Verification (Definition of Done)

```bash
ls apps/docs/content/ADR/0066-*.md
rg -n "ADR-0032|ADR-0018|ADR-0041" 0066-*.md
# domains never import transport errors
rg -n "TRPCError" packages/domains   # expect: no matches
# routers unwrap, never .data
rg -n "createResultUnwrapper" apps/api
```

## Anti-Patterns

1. Throwing `TRPCError` (or any HTTP type) inside a domain service.
2. `return res.data` in a router instead of `unwrap(result)`.
3. Client branching on `error.message` strings instead of `error.code`.

## Related ADRs

- **ADR-0032** — tRPC transport; the boundary where unwrap happens.
- **ADR-0018 / 0019** — validators; own the `TRPC_ERROR_MAP`.
- **ADR-0041** — error/empty/loading UX; how mobile presents the unwrapped error.
- **ADR-0003** — execution pipeline; errors become events, not exceptions.
