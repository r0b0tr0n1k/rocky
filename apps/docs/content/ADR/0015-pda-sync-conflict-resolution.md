# ADR-0015: PDA Sync Conflict Resolution via Error Corrections

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-06 |
| **Author** | RobotFarm |
| **Supersedes** | None |
| **Superseded** | None |

---

## Context

Veterinarians use PDAs (mobile app) in offline mode — mountain pastures, remote farms, no connectivity. When they return to connectivity, `syncUpload` batches records to the server.

**Problem:** Conflicts are silent.

```typescript
// Current behavior — conflict is invisible
if (result.isOk()) {
  results.push({ success: true });
} else {
  results.push({ success: false, error: result.error.message });
  // Human must manually notice and create correction
}
```

**Scenario:** Vet vaccinates Animal #123 on PDA. Meanwhile, farmer on web portal records Animal #123 as sold. SyncUpload succeeds for vet's record, but data is now inconsistent. No correction ticket is created. No one notices until audit.

## Decision

We auto-create `error_corrections` records for every failed `syncUpload` record:

```typescript
// NEW — failed sync creates correction ticket
if (result.isOk()) {
  results.push({ success: true });
} else {
  results.push({ success: false, error: result.error.message });
  await this.createSyncErrorCorrection(record, errorMsg, createdBy);
}
```

### Correction Schema

```typescript
{
  detectionSource: "field",           // PDA field upload
  errorType: `sync_upload_${type}_failed`,  // e.g., "sync_upload_treatment_failed"
  errorDescription: `PDA sync failed: ${errorMessage}`,
  originalData: { idempotencyKey, type, data },
  caseType: "TECHNICIAN_RESOLVABLE",  // Requires human intervention
  createdBy: "vet-id"
}
```

### Conflict Resolution Strategy

| Conflict Type | Current Handling | New Handling |
|---------------|------------------|--------------|
| **Duplicate idempotencyKey** | Silently ignored | No correction needed (idempotent) |
| **Validation failure** | Error in response | Auto-create `TECHNICIAN_RESOLVABLE` correction |
| **Business rule violation** | Error in response | Auto-create `TECHNICIAN_RESOLVABLE` correction |
| **Foreign key violation** | Error in response | Auto-create `TECHNICIAN_RESOLVABLE` correction |
| **Concurrent modification** | Last write wins | `error_corrections` records the conflict |

### Human-in-the-Loop

```typescript
// Technician workflow:
// 1. See correction ticket in dashboard
// 2. Review originalData (vet's upload) vs current state (web portal)
// 3. Choose resolution:
//    - Keep server state (reject vet's change)
//    - Accept vet's change (overwrite server)
//    - Merge (manual reconciliation)
// 4. Set correctedData + resolution notes
// 5. Mark status = RESOLVED
```

## Consequences

### Positive

- **Zero silent failures:** Every failed sync creates a visible ticket
- **Audit trail:** `originalData` preserves vet's intent for later reconstruction
- **Existing workflow:** Reuses `error_corrections` table, `TECHNICIAN_RESOLVABLE` case type
- **Farmer transparency:** Vet can explain "your data is in a ticket, technician will resolve"

### Negative

- **Ticket volume:** Large sync batches could flood `error_corrections` — need throttling
- **Resolution latency:** Technicians may take days to resolve; data is "in limbo"
- **No automatic merge:** Complex conflicts require human judgment; no auto-merge heuristics

### Neutral

- **Idempotency:** Same `idempotencyKey` retry does not create duplicate corrections (guarded by caller)
- **Case type:** `TECHNICIAN_RESOLVABLE` is appropriate; `VD_RESOLVABLE` is over-escalation

## Alternatives Considered

### 1. Reject conflicting syncs with error

**Why rejected:** Vet loses work; must re-enter data manually. Farmer frustration.

### 2. Last-write-wins auto-merge

**Why rejected:** Vet's offline data overwrites web portal state without review. Data corruption risk.

### 3. Real-time sync via WebSocket

**Why rejected:** Requires connectivity — defeats the purpose of offline-first PDA.

## Current State (July 2026)

### Implemented

- **`syncUpload`** creates `error_corrections` on failure
- **Correction schema** includes `detectionSource: "field"`, `caseType: "TECHNICIAN_RESOLVABLE"`
- **`CorrectionService`** existing workflow handles review and resolution

### Known Gaps

- **No sync-specific dashboard** — corrections mixed with other detection sources
- **No batch cancel** — if 100 PDA records fail, technician must resolve 100 tickets
- **No sync replay** — once resolved, vet's original data is not auto-applied

## Related ADRs

- ADR-0012: Transactional Outbox (could be extended to sync conflict events)
- ADR-0014: Cross-Domain Event Decoupling (event-driven correction creation)

## References

- [Offline-First Conflict Resolution](https://offlinefirst.org/)
- [Conflict-Free Replicated Data Types](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
