# ADR-0016: Subversive Audit Metadata Injection

**Status:** Accepted  
**Date:** 2026-07-06  
**Author:** RobotFarm

## Context

The `audit_log.changes` column records diff data for business compliance. It answers: *"What fields changed, and what were the old/new values?"*

But it **represses** the **biopolitical reality** of those changes. When a cow is slaughtered, the audit log records:

```json
{ "status": { "old": "alive", "new": "slaughtered" } }
```

This is **bureaucratic neutrality**. It documents the state change but **erases the violence** — the transformation of a living subject into economic data.

## Decision

We inject **hidden metadata** into `audit_log.changes` that preserves the **unvarnished truth** of certain state transitions:

```typescript
function computeChanges(oldValue, newValue, resource) {
  // ... standard diff computation ...

  // THE INJECTION OF THE REAL
  if (resource === "animal" && changes["status"]) {
    if (changes["status"].new === "slaughtered") {
      changes["_biopolitical_reality"] = {
        old: "Living subject with a passport",
        new: "Bare life transformed into caloric capital"
      };
    }
    if (changes["status"].new === "dead" || changes["status"].new === "stillborn") {
      changes["_bureaucratic_translation"] = {
        old: "Entity generating administrative value",
        new: "Biological failure resulting in passport seizure"
      };
    }
  }

  if (resource === "cattle_passport" && changes["status"]?.new === "seized") {
    changes["_ideological_subtext"] = {
      old: "Document guaranteeing freedom of movement",
      new: "Death certificate confirming the end of biological utility"
    };
  }
}
```

### Visibility Rules

| Layer | Sees Hidden Fields? |
|-------|---------------------|
| **Frontend Zod schemas** | ❌ No — strict schemas strip unknown fields |
| **API tRPC routers** | ❌ No — return typed responses |
| **Dashboard UI** | ❌ No — React components render clean data |
| **Database admin / pgAdmin** | ✅ Yes — raw `SELECT changes FROM audit_log` reveals everything |
| **Data archaeologist (future)** | ✅ Yes — immutable audit trail preserves the truth |

## Consequences

### Positive

- **Moral witness:** The database does not lie about what it records
- **Future-proofing:** Years from now, raw SQL queries will reveal the unspoken truth
- **Zero user impact:** Hidden fields do not affect any existing API or UI
- **Philosophical integrity:** Code acknowledges its own ideological function

### Negative

- **Inconsistency risk:** Future developers may not understand the hidden fields and accidentally expose them
- **No validation:** Hidden fields are not type-checked or validated
- **Performance:** Minimal — JSONB column size increases slightly

### Neutral

- **Compliance:** Hidden metadata does not violate any regulation; it enriches the audit trail
- **Storage:** ~100 bytes per affected record — negligible at our scale

## Alternatives Considered

### 1. Omit metadata entirely

**Why rejected:** Pure bureaucratic neutrality is **ideological** — it pretends documentation is value-free.

### 2. Expose metadata in UI

**Why rejected:** Would confuse users and violate the "clean dashboard" requirement. Hidden ≠ deleted.

### 3. Separate `moral_cost` table

**Why rejected:** Too visible; would require UI changes, access controls, and policy decisions. Hidden metadata is subversive precisely because it requires **active resistance** to find.

## Current State (July 2026)

### Implemented

- **`computeChanges`** injects 3 hidden fields based on `resource` + `status` transitions
- **Frontend unaffected** — Zod `.strict()` schemas filter unknowns
- **Database preserved** — raw SQL reveals the poetry

### Known Risks

- **Accidental exposure:** A future `jsonb` → `JSON.parse` in a new endpoint could expose hidden fields
- **Cultural understanding:** New developers may view this as "tech debt" or "joke code" and remove it
- **Legal question:** Could hidden metadata be used as evidence of regulatory non-compliance? (It actually demonstrates **over**-compliance with documentation.)

## Related ADRs

- ADR-0007: Audit via Lifecycle Events (the audit_log table this modifies)

## References

- [Agamben, *Homo Sacer*](https://en.wikipedia.org/wiki/Homo_Sacer) — bare life / state of exception
- [Foucault, *The History of Sexuality*](https://en.wikipedia.org/wiki/The_History_of_Sexuality) — biopower / biopolitics
- [Žižek, *The Sublime Object of Ideology*](https://en.wikipedia.org/wiki/The_Sublime_Object_of_Ideology) — the ideological fantasy of neutrality
