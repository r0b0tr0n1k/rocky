# Ear Tag Domain Service

**Scope:** `packages/domains/eartag/` — service, repository, errors
**Status:** 13 of 15 fs.md sub-rules implemented

## Implementation Progress (vs docs/old/fs.md)

### A. Tag Number Generation
| Sub-rule | Status |
|----------|--------|
| A.1 — 8-digit structure | ✅ Zod validates `^\d{8}$` |
| A.2 — Check digit formula | ✅ `calculateEarTagCheckDigit()` in `validators/src/utils/check-digit.ts:17` |
| A.3 — Range from 10000001 | ✅ `generateTagNumbers()` in service |

### B. Supplier Contingents
| Sub-rule | Status |
|----------|--------|
| B.1 — Single assignment | ❌ NO logic. Enums exist (`CONTINGENT_TYPE`) but unused |
| B.2 — .txt file download | ❌ Not implemented |

### C. Ordering New Eartags
| Sub-rule | Status |
|----------|--------|
| C.1 — Permissions | ✅ `createPermissionGuard("eartag:order")` on createOrder mutation |
| C.2 — Max qty (females − remaining) | ✅ Done |
| C.3 — Farm validity | ✅ Done |
| C.4 — 120-day gap + 4/yr | ✅ Done |
| C.5 — Idempotency | ✅ `idempotencyKey` on createOrder input |

### D. Duplicate Eartags
| Sub-rule | Status |
|----------|--------|
| D.1-D.5 — All rules | ❌ Comment stub only |

### E. Supplier Collection
| Sub-rule | Status |
|----------|--------|
| E.1-E.5 — Check qty, pull AVAILABLE, ascending sort, rollback | ✅ `collectOrderTags()` fully done |

### F. Append to Existing Order
| Sub-rule | Status |
|----------|--------|
| F.1 — Order ownership, NEW status, standard rules | ✅ `appendToOrder()` — validates org ownership + DRAFT/PENDING status |

### G. Viewing Limitations
| Sub-rule | Status |
|----------|--------|
| G.1-G.3 — User/supplier/VD scoping | ✅ RLS policies on `ear_tag_orders` table |

### H. Cancellation
| Sub-rule | Status |
|----------|--------|
| H.1 — Only orderer or VD | ✅ `cancelOrder()` validates not received/cancelled, not after supplier collection |
| H.2 — Only if not collected | ✅ `cancelOrder()` blocks ORDERED/PARTIALLY_RECEIVED status |
| H.3 — Item-level cancel | ✅ `cancelOrderItem()` only DRAFT/PENDING, uses `removeTagFromOrder()` |

## Architecture

```
Router (tRPC) → EarTagService (validate + orchestrate) → EarTagRepository (DB)
                     │
                     └── Returns Result<T, EarTagError>
```

- **Service** — validates business rules, orchestrates repo calls, returns `Result`
- **Repository** — DB access only, no business logic
- **Errors** — 7 error codes, follows Error Sovereignty Doctrine

## State Machine (8 statuses)

```
DRAFT → PENDING → APPROVED → ORDERED → PARTIALLY_RECEIVED → RECEIVED
  ↓        ↓          ↓          ↓
CANCELLED CANCELLED  CANCELLED  CANCELLED
                    ↓
                  ORDERED

REJECTED → DRAFT
ORDERED → CANCELLED, PARTIALLY_RECEIVED, RECEIVED
PARTIALLY_RECEIVED → RECEIVED, CANCELLED
RECEIVED → (terminal)
CANCELLED → (terminal)
```

## Error Codes (`EARTAG_ERRORS`)

| Code | When |
|------|------|
| `NOT_FOUND` | Ear tag or type not found |
| `ORDER_NOT_FOUND` | Order not found |
| `ALREADY_ASSIGNED` | Tag already in use (consolidated APPLIED/ALLOCATED) |
| `DUPLICATE_TAG` | Duplicate tag number |
| `INVALID_STATUS_TRANSITION` | Illegal state change |
| `INVALID_INPUT` | Validation failure (farm, quantity, gap, etc.) |
| `FORBIDDEN` | Permission denied (wrong supplier, not owner) |

## Schema Status (vs Eartags.PDF Oracle spec)

| Table | Status | Notes |
|---|---|---|
| `ear_tag_takeovers` | ✅ Added 2026-07 | `orderId`, `supplierOrganizationId`, `COMPLETED`/`CANCELLED`, RLS scoped to VD + supplier |
| `ear_tag_takeover_files` | 🔲 Pending | Store generated flat file lines. Needs contingent logic first |
| `contingent_type` on allocations | 🔲 Pending | `CONTINGENT_TYPE` enum unused. Add column to `ear_tag_allocations` to support supplier-facing blocks |

## Remaining Work

### Rule 7: Order/Item Cancellation
- H.1 — Only order creator or VD can cancel (auth at router level)
- H.2 — Order cancellable only if supplier hasn't collected yet
- H.3 — Individual items can be cancelled without cancelling entire order
- Methods: `cancelOrder()`, `cancelOrderItem()` in service
- Requires: user context for auth check, takeovers table for H.2

### Rule 8: Duplicate Order for Specific Animals
- D.1 — Idempotency (same order not entered twice)
- D.2 — Animal must be alive
- D.3 — Animal must belong to the specified farm
- D.4 — User must have farm permissions
- D.5 — Farm must be valid (not fictitious/slaughterhouse)
- F.1-F.3 — Appending to existing orders
- Method: `createDuplicateOrder()` in service
- Requires: cross-domain animals query

### Rule A: Tag Number Generation
- A.3 — Batch generation service starting from 10000001
- Uses existing `calculateEarTagCheckDigit()`

### Rule B: Supplier Contingents
- B.1 — Assign tag blocks to suppliers
- B.2 — Generate + store .txt files
- Requires: `contingentType` on allocations or new table

### Rule C.1: Permission Guard
- Apply `@RequirePermission("eartag:order")` to createOrder mutation
- `PermissionGuard` class exists at `apps/api/src/trpc/middlewares/permission.guard.ts` but unused on EarTagRouter

### Rule C.5: Idempotency
- Add `idempotencyKey` to createOrder input
- Check + reject duplicates in service
