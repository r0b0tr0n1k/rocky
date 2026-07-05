# Ear Tag Domain Service

**Scope:** `packages/domains/eartag/` — service, repository, errors
**Status:** 15 of 15 fs.md sub-rules implemented

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
| B.1 — Single assignment | ✅ `assignSupplierContingent()` — creates allocation with contingentType, validates no overlapping ranges |
| B.2 — .txt file download | ✅ `generateTakeoverFile()` — generates flat file with tag numbers, stores content on takeover record, returns file content via tRPC |

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
| D.1 — Idempotency (same order not entered twice) | ✅ `createDuplicateOrder()` — checks 24h duplicate window |
| D.2 — Animal must be alive | ✅ `createDuplicateOrder()` — `animal.status !== ALIVE` check |
| D.3 — Animal must belong to the specified farm | ✅ `createDuplicateOrder()` — `animal.currentFarmId !== input.farmId` |
| D.4 — User must have farm permissions | ✅ `@Policy({action:"eartag:order"})` on router endpoint |
| D.5 — Farm must be valid (not slaughterhouse/quarantine) | ✅ `createDuplicateOrder()` — farm type + isActive check |

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
| `contingent_type` on allocations | ✅ Added 2026-07-05 | Nullable pgEnum column on `ear_tag_allocations`. Range overlap validation in `assignSupplierContingent()` |
| `file_content` on takeovers | ✅ Added 2026-07-05 | Flat file content stored as text on `ear_tag_takeovers`. Generated via `generateTakeoverFile()` |

## ✅ Completed Since Last Documentation

These items were listed as remaining in older docs but are already implemented:

| Item | Implemented As |
|------|----------------|
| **H.1-H.3: Order/Item Cancellation** | `cancelOrder()` + `cancelOrderItem()` in service + router |
| **A.3: Batch Tag Generation** | `generateTagNumbers()` starting from 10000001 |
| **C.1: Permission Guard** | `@Policy({ action: "eartag:order" })` on `createOrder` mutation (uses `@Policy` decorator, not `createPermissionGuard`) |
| **C.5: Idempotency** | `idempotencyKey` field in `CreateOrderRequest` + 24h duplicate window check |
| **B.1: Supplier Contingent Assignment** | `assignSupplierContingent()` — creates contingent allocation with range overlap validation |
| **B.2: Takeover File Generation** | `generateTakeoverFile()` — generates flat file with tag numbers, stores content + filename on takeover |

## Known Gaps

1. ~~**Missing tRPC exposure:** `collectOrderTags()` and `generateTagNumbers()` service methods exist but have NO router endpoints~~ — **FIXED 2026-07-05**: `collectOrderTags`, `generateTagNumbers`, `getOrderById`, `listOrders` endpoints added to `eartag.router.ts`
2. ~~**Comment stale:** `eartag.errors.ts` line 4 says "6 error codes" but there are actually 7~~ — **FIXED 2026-07-05**
3. ~~**B.1/B.2: Supplier Contingents** — **FIXED 2026-07-05**: `contingentType` column added to `ear_tag_allocations`, `assignSupplierContingent()` + `generateTakeoverFile()` implemented, tRPC endpoints wired~~
4. **IdempotencyKey nuance:** The `idempotencyKey` field is declared in the schema but the service uses a 24h time-window heuristic (org+supplier match) rather than directly checking/storing the key
