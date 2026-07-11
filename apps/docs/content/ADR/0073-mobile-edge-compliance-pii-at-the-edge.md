# ADR-0073: Mobile Edge Compliance -- PII at the Edge

> The server enforces. The phone remembers. The gap between them is where PII
> leaks. This ADR closes that gap without duplicating the Symbolic order on a
> castrated device.

| Key            | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Status** | Proposed |
| **Phase**  | Phase 2 -- mobile edge, server-authored controls |
| **Date**       | 2026-07-11                                                             |
| **Author**     | Architecture Review (Compliance homework)                                    |
| **Supersedes** | — |
| **Superseded** | — |
| **Source**     | `apps/mob/AGENTS.md` (offline contract); ADR-0061 D5; ADR-0036; ADR-0067; graphgrc gap register |
| **Related**    | ADR-0061; ADR-0067; ADR-0071; ADR-0068; ADR-0007; ADR-0036; ADR-0003 |

## Context

The PDA (`apps/mob`) is offline-first. It caches synced server payloads as raw
JSON in `expo-sqlite` (`local_cache`, `query_cache`) with **no encryption** and
**no mask or reveal control anywhere in the UI**. The phone is, by contract,
*castrated* (ADR-0036): there is no RLS and no RBAC on the device. Row-scope is
restored server-side on `syncDownload`, and write-authorization is re-checked
server-side on `syncUpload`. The server's Symbolic enforcement therefore stops
at the API boundary.

The Real this exposes: PII that the server legitimately returns to a *privileged*
mobile principal (one holding `pii:read` plus a stated purpose) is then stored in
plaintext on a stealable device and rendered with no gating. The server-side ISMS
(ADR-0061 / ADR-0067) does not reach past the boundary.

The decisive control is **authorization** -- *who can use the app* (session and
Principal) and *what they can get to* (`pii:read` plus purpose). The user is
explicit: the app must not import the PII registry (that duplicates the Single
Source of Truth and invites drift); the API import is acceptable, but the
knowledge of "what is PII" travels to the device over TRPC, and the device defers
the who / what decision to the server's authorization.

## Decision

Mobile compliance is achieved by *extending the server-owned controls to the edge*,
not by re-implementing them on the phone. Seven measures:

1. **Mask-by-default in the UI (ADR-0061 D5 edge).** A `<PiiText>` component masks
   any field the server descriptor flags as PII until an explicit reveal with a
   stated purpose; a pure `redactRecord` helper masks cached blobs using the
   server-provided column list. *Implemented this turn* as a verified proof of
   concept: `apps/mob/lib/offline/pii.ts`, `apps/mob/components/PiiText.tsx`,
   `apps/mob/lib/offline/pii.test.ts` (4/4 green under `tsx --test`).

2. **Server-provided PII descriptor.** A TRPC `meta.piiColumns({ types })` (or a
   response annotation) returns the default-excluded columns per cached entity
   type; the mobile fetches once and caches. The Single Source of Truth stays
   server-side (ADR-0061 D1). *Deferred -- server change.*

3. **On-device reveal log to the tamper-evident audit (ADR-0007 edge).** Every
   reveal invokes `onReveal(purpose)`, which ships a reveal event through the
   outbox to a server audit mutation; the server writes it to the hash-chained
   log. *Deferred.*

4. **Purpose at collection (ADR-0068 / ADR-0069 edge).** When a mutation collects
   PII, its payload carries `purpose`; the server records it against the
   lawful-basis register. The server already enforces purpose on the reveal-gate;
   the mobile must forward it consistently. *Partial.*

5. **PII at rest on the device (A.8.24 / ADR-0071 edge).** App-layer encryption of
   `local_cache` + `query_cache` blobs with a key held in `expo-secure-store`
   (hardware-backed Keychain / Keystore), plus wipe-on-logout and wipe-on-device-loss.
   SQLCipher is an alternative but needs a native build; app-layer AES is sufficient
   defense-in-depth over the OS file encryption the sandbox already provides.
   *Deferred -- device-gated.*

6. **Retention and wipe (ADR-0061 Phase 2 D10 edge).** `query_cache` already bounds
   React Query persistence (7d / 24h). Add local-cache pruning and key deletion on
   logout and on account switch so a departed user's PII leaves the device.
   *Partial.*

7. **Re-auth lock (ADR-0072 edge).** An app-level lock after inactivity; a remote or
   local logout invalidates the secure-store key, rendering the cache unreadable
   without a fresh principal. *Deferred.*

## Consequences

### Positive
- Closes the edge gap the server ISMS cannot reach; treats the phone as an extension
  of the same control set rather than a blind spot.
- Keeps the registry server-side (no duplication, no drift) while still gating the UI.

### Negative / Cost
- Measures 2, 3, 5, 7 require server changes and device verification (WO-082 native
  gate); they cannot be certified from this environment.
- App-layer encryption adds a key-management surface that must itself be reviewed.

### Neutral
- Measure 1 (this turn) is pure, prop-driven, and unit-tested; it introduces no
  native dependency and no registry import.

## Implementation

- Owning Bot: **Mobile Bot** (UI gate, cache, key) + **Validators Bot** (descriptor
  endpoint) + **API Bot** (audit mutation) + **Execution Bot** (server audit write).
- RobotFarm pass: add a WO (mobile edge compliance) to WORKORDER; note in Mobile Bot
  AGENTS.md that PII is masked-by-default and that the registry is never imported.
- This ADR is the mobile decomposition of ADR-0067; it complements ADR-0061 (D5),
  ADR-0071 (crypto), and ADR-0068 (purpose).

## Verification (Definition of Done)

```bash
npx tsx --test apps/mob/lib/offline/pii.test.ts     # measure 1 green
rg -n "PiiText|redactRecord" apps/mob/app            # screens adopt the gate (device-verified)
rg -n "piiColumns|pii:read" apps/api                 # descriptor endpoint exists (measure 2)
rg -n "logReveal|audit" apps/api                     # reveal event reaches server log (measure 3)
```

- `<PiiText>` renders masked by default on a real device (WO-082 gate).
- A reveal event from the device is present in the server tamper-evident log.

## Anti-Patterns

1. Importing `@rocky/validators/pii` into the app -- duplicates the registry and
   invites drift. Use the TRPC descriptor instead.
2. Treating OS file encryption as sufficient without app-level key protection and a
   logout / device-loss wipe.
3. Revealing PII on-device without a logged, server-recorded purpose.

## Related ADRs

- **ADR-0061** -- GDPR erasure / retention; D5 is the mask-by-default spine.
- **ADR-0067** -- ISMS posture; this ADR is the mobile edge decomposition.
- **ADR-0071** -- cryptography-at-rest; measure 5 is its mobile analog.
- **ADR-0068** -- lawful-basis register; measure 4 forwards purpose to it.
- **ADR-0007** -- audit via lifecycle events; measure 3 ships reveals to it.
- **ADR-0036** -- offline-first contract (the castrated phone).
- **ADR-0003** -- hosting (physical perimeters out of scope).
