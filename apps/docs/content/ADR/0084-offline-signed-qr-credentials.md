# ADR-0084: Offline-verifiable Signed QR Credentials (ear tags, passport, movement)

> ADR-0082 gives every emitted PDF a **PAdES-LTV seal** verified *online* via
> `document.verify` / `/verify` (the **locator** QR points at the server). For gates with
> no connectivity — a farm yard, a market, a slaughterhouse, a border checkpoint — we need
> *offline* verification from just Rocky's public key. This ADR adds a **self-contained
> signed-payload QR** as a sibling credential to the PAdES seal, following the proven
> paradigm (EU DCC, mDL / ISO 18013-5, W3C VC): compact payload → hash → sign (Ed25519) →
> encode (CBOR + base64url) → QR.

| Key | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-07-12 |
| **Author** | Architecture Review (prompted by user directive) |
| **Supersedes** | None |
| **Superseded** | None |
| **Related** | ADR-0082 (PDF/A-3 + PAdES) · ADR-0009 (doc-gen framework) · ADR-0029 (archive/retention) · ADR-0033 (ADR standard) · ADR-0052 (doc taxonomy) · WO-050 (PDF/A + seal) · passport / movement / ear-tag domains |

---

## Context

The signed-PDF seal (ADR-0082) answers *"who issued this, and when, provably in court?"*
It does **not** answer *"can I trust this at a gate with no signal?"* — its verification
phones home to our API. The typical signed-QR pattern removes that dependency: the QR
carries a signed payload; the verifier checks it against a **public key it already holds**
(embedded in the app, or fetched once). Integrity + authenticity, offline.

The **Real** today (verified, not assumed):

1. **`PdfSigner` key custody already exists** (ADR-0082). Production signs via an
   air-gapped `HsmSigner`; the public key is the trust anchor. A credential signer should
   **reuse this exact custody model** — same HSM, same key — not invent a parallel one.
   That keeps the trust story to a single root.
2. **A standalone QR already exists** (`packages/pdf/src/engine/qr.ts`,
   `generateQrPng`/`generateQrSvg`) for ear-tag linkage — but it encodes a *UID/link*,
   not a *signed credential*. It is the hook we extend.
3. **Revocation sources already exist in-domain.** The passport state machine
   (`ACTIVE → SEIZED → REPRINTED → CANCELLED`) and movement states are exactly the
   revocation signal a CRL-style list needs — no new invention.
4. **The verifier target is React Native** (`@rocky/mob`). The signing primitive must
   run **identically server-side and in RN with no native module**, or offline verification
   is impossible on-device.

Two QR types **coexist**: the **locator** (`/verify?type=&refId=`, full online PAdES check)
and the new **signed-payload** (offline gate token). The PDF carries both.

## Decision

### 1. `CredentialSigner` / `CredentialVerifier` is a sibling of `PdfSigner` — same trust root

Reuse `createConfiguredSigner()`'s HSM as the signing root **where the HSM exposes the
credential algorithm**; the **public verification key** is published/pinned for verifiers —
the same trust anchor the PAdES seal rests on. **Algorithm note (decision — verify before
this is load-bearing):** the PAdES seal uses the X.509 qualified-cert key (typically **RSA /
ECDSA P-256** — what CA/TSA chains and FIPS 140-3 HSMs commonly validate), whereas the
credential signer prefers **Ed25519** (RN-native via `@noble/curves`). Not all HSMs —
especially FIPS 140-3 validated ones — expose Ed25519 keygen/sign; some only cover
RSA/ECDSA per their validation certificate. **Before build, confirm the actual HSM SKU /
firmware** exposes Ed25519. If it does not: (a) fall the credential signer back to **ECDSA
P-256** — `@noble/curves` covers P-256 too, so the RN-native, no-native-dep verifier story
still holds; or (b) stand up a **second, smaller-scope Ed25519 key custody** (a *stated
decision*, not an assumption). Either way the *trust anchor* is one root; only the
credential-signing key **algorithm** may differ from the PAdES cert key.

### 2. Canonical CBOR (RFC 8949 §4.2) is MANDATORY — not trusted defaults

`cbor-x` (and any CBOR codec) can encode the same JS object two slightly different ways
(key order, int-vs-float, length encoding) across versions/platforms. If signer and
verifier disagree on the **canonical byte representation**, you get *"valid credential,
invalid signature"* bugs that are miserable to debug. Therefore:

- Pin **deterministic encoding** explicitly (map key ordering, integer/float
  disambiguation, smallest-length rule) — RFC 8949 §4.2 — in the codec config, not the
  library default.
- Add a **golden-byte test** that snapshots the exact `encode(credential)` bytes and
  **fails the build if they change**. This is a NoDrift guillotine for encoding, on par
  with the PDF/A check in ADR-0082.

### 3. Key rotation has a DISTRIBUTION story, not just a `kid` field

Embedding a key-id and verifying against a pinned key is necessary but insufficient: a
phone offline in a field for six months has no way to learn a rotated key. **Decision
(now, even though v1 ships one key):** **opportunistic sync + N-day grace window.**

- Verifiers sync the public-key **set** whenever online.
- After a rotation, **old and new keys both verify for a configured grace period**
  (e.g. 30/90 days, set per credential class).
- The grace window + sync cadence are recorded **here** as a trust-model decision, so
  retrofitting later never requires re-architecting every issued credential's trust
  assumptions.
- *Alternatives considered:* bundle-in-app-update (too slow to react to emergency
  rotation); QR-carried key attestation chained to a root (heavier, deferred). The grace
  window is the pragmatic v1; the root-chain is a future upgrade path.

### 4. Decouple credential `exp` from credential-status-list staleness

An ear-tag credential may be valid for **years**, but "not expired" must never be read as
"not revoked" by a verifier whose status list is six months stale. **Decision:**

- A **credential status list** (business-level, CRL-style — *distinct from X.509 **cert
  revocation*** in ADR-0082's PAdES path) is published and fetched **opportunistically**
  (same sync as §3). It is sourced from domain state machines (passport
  `ACTIVE → SEIZED → CANCELLED`, movement states) and answers *"is THIS credential still
  valid?"* — whereas **cert revocation** (OCSP/CRL) answers *"is the signing key still
  trusted?"*. The two solve different problems; keep the names distinct in code and docs so
  the offline verifier never reaches for OCSP libraries.
- The verifier UI **MUST surface a visible "status list last synced: X days ago"** state.
  A gate operator sees when they are trusting stale data instead of silently accepting it.
  Stale-beyond-grace → the verifier warns/refuses, it does not silently pass.

### 5. QR payload size vs physical tag — test at real size, early

CBOR payload + 64-byte Ed25519 signature + framing pushes into a **denser QR version**.
On a small, low-DPI, possibly scratched **ear tag** this fails in a barn, not in a PDF
mockup. **Decision:** the spike **MUST include print-and-scan at actual tag size** before
this is load-bearing. Keep the payload minimal — `iss, sub, typ, iat, exp, kid` plus only
the domain fields needed for the gate decision (e.g. `animalId, farmId, species`).

### 6. HSM round-trip throughput for bulk signing

Ear tags may be signed **in bulk** (a farm tagging hundreds of animals in one sitting).
Per-credential HSM calls can bottleneck on HSM latency. **Decision:** check expected batch
sizes against measured HSM throughput **before** this is load-bearing. If needed, sign a
**batch manifest** or reuse a single HSM session across the batch (recorded decision; not
yet implemented). The interim P12 path has no such limit.

### 7. On-document QR via `@cantoo/pdf-lib`, not Typst

The on-document QR blocked in ADR-0082 failed because Typst's prebuilt WASM sandbox cannot
read injected vfs files via `image()`. **Decision:** render the signed QR to a **PNG**, then
embed it as an **image XObject via `@cantoo/pdf-lib`** *after* the Typst visual renders and
*before* the PAdES seal — so the signed credential is physically printed on the
passport/movement document. This unblocks on-document QR with a cleaner architecture than
the original Typst attempt.

### 8. Web `/verify` accepts the raw QR string (offline verify)

Extend `document.verify` / `/verify` to accept either `{ type, refId }` (online, re-derives

- reads PAdES) **or** the raw signed-QR string (offline, verifies the embedded credential
against the pinned public key). One endpoint, two trust paths.

### 9. Explicit non-goals (deferred)

- **W3C VC / ISO 18013-5 mDL** — convergence is "heading there," not here. Model the
  payload **VC-shaped** (`iss/sub/typ/iat/exp`) so adoption is a later wrapper, not a rewrite.
- **BBS+ / selective disclosure / ZK** — payloads are tiny; full disclosure is fine for v1.
- **COSE wrapping** — raw CBOR + Ed25519 signature is sufficient; wrap in `COSE_Sign1`
  later only if cross-system interop demands it.
- **Ed25519 vs P-256** — prefer Ed25519; if the HSM SKU/firmware lacks Ed25519 (FIPS 140-3),
  use P-256 — `@noble/curves` covers both, RN-native either way (see §1).

## Options Evaluated

### A — `forge` Ed25519

Rejected: forge's Ed25519 support is shaky and not RN-portable; would fork the sign/verify
codebase from the verifier.

### B — WebCrypto `crypto.subtle` (ECDSA P-256 / Ed25519)

Rejected for the verifier: unavailable in React Native without a polyfill; we need one
code path server + RN.

### C — `@noble/curves` + `cbor-x` (CHOSEN)

Tiny, audited, **runs identically in Node and RN with no native deps**. Ed25519 signatures
are 64 bytes (QR-space friendly). CBOR is compact and standard; deterministic mode pinned
per §2.

### D — COSE vs raw CBOR+signature

Raw CBOR + Ed25519 chosen for v1 (simplicity); COSE_Sign1 noted as a future interop wrapper
(§9).

### E — Key-rotation strategy

Opportunistic sync + grace window chosen (§3) over bundle-in-app-update (too slow) and
QR-carried root chain (too heavy for v1).

## Consequences

### Positive

- **Offline verification** at gates with no signal — the missing half of ADR-0082.
- **One trust root.** Credential signer reuses `PdfSigner`'s HSM/key custody; no parallel
  key model (your explicit ask).
- **RN-native.** `@noble` verifies on-device with no native module — the verifier lives in
  `@rocky/mob`.
- **Trust-model decisions are recorded now** (canonical CBOR, rotation distribution,
  revocation-staleness) so they are not retrofitted later at the cost of every credential.

### Negative / Cost

- **Key distribution + revocation sync** is real ops: grace windows, list freshness,
  sync cadence. Surfaced in UI (§4) but must be operated.
- **Golden-byte test maintenance** — encoding changes are now build-breaking (intended).
- **QR density testing** at tag size is a hard gate before rollout (§5).

### Neutral

- Payload is VC-shaped but not full W3C VC; interop is a later wrapper, not a rewrite.
- Interim signing uses the same P12/`NoOpSigner` fallback as ADR-0082; production = HSM.

## Implementation (Plan)

**Owning Bots:** PDF Bot (`packages/pdf`) for signer + embed; Mobile Bot (`apps/mob`) for
the verifier + revocation UI. RobotFarm pass: add a PDF Bot + Mobile Bot sub-section to
their `AGENTS.md`, add WO entry, then flip to Accepted after the spike.

- **Phase 0 — ADR + spike (this decision first):** golden-byte CBOR test (fails on drift);
  Ed25519 sign/verify round-trip in Node **and** RN; embed QR PNG via `@cantoo/pdf-lib` on a
  passport PDF; **print-and-scan at actual ear-tag size**; `/verify` accepts raw QR string.
- **Phase 1 — Credential module:** `CredentialSigner`/`CredentialVerifier` in `@rocky/pdf`
  (Ed25519 via `@noble/curves`, canonical CBOR via `cbor-x`); key **set** + grace-window
  config; revocation-list publisher from passport/movement states.
- **Phase 2 — Wire in:** ear-tag QR becomes a signed credential; passport/movement docs get
  the embedded signed QR; `/verify` extended (§8).
- **Phase 3 — Bulk/HSM check:** measure batch tag-signing against HSM throughput (§6); add
  batch-manifest signing only if the measurement demands it.

## Verification (Definition of Done)

```bash
# 1. ADR exists in the canonical set and cites ADR-0082
ls apps/docs/content/ADR/0084-offline-signed-qr-credentials.md
rg -n "ADR-0082" apps/docs/content/ADR/0084-offline-signed-qr-credentials.md

# 2. Canonical CBOR golden-byte test exists and is build-gating
rg -n "golden|cbor|x-cbor|deterministic" packages/pdf/src
#    -> a test snapshots encode(credential) bytes and fails the build on drift

# 3. Sign/verify round-trips identically in Node AND RN (no native deps)
rg -n "@noble/curves" packages/pdf/src apps/mob

# 4. On-document QR embeds via pdf-lib (not Typst), before the PAdES seal
rg -n "image XObject|embedPng|drawImage" packages/pdf/src

# 5. /verify accepts the raw signed-QR string (offline path)
rg -n "raw|QR|verify" apps/api/src/routers/document.router.ts \
  "apps/web/app/(admin)/verify"

# 6. Credential status-list staleness is surfaced in the verifier UI
rg -n "last synced|stale|grace" apps/mob apps/web
```

## Anti-Patterns (do not repeat)

1. **Trusting default CBOR encoding** — pin RFC 8949 §4.2 deterministic mode + golden-byte
   test, or you will ship "valid credential, invalid signature" non-determinism.
2. **`kid` without a distribution story** — a key-id is useless to an offline phone that
   can't fetch the new key. Bake in sync + grace now (§3).
3. **Conflating `exp` with credential status-list freshness** — surface list-staleness in
   the UI; never silently accept a years-valid but stale-status credential (§4).
4. **PDF-mockup-only QR testing** — print-and-scan at real tag size before load-bearing (§5).
5. **A parallel key model to `PdfSigner`** — reuse the HSM/key custody; one trust root (§1).

## Status

**Accepted (2026-07)** — Phase-0 spike validated the primitive (flipped Proposed →
Accepted); **Phase 1 is now implemented**; Phase 2–3 remain.

**Spike results (2026-07):**

- **Canonical CBOR golden-byte test passes** — `encodePayload(FIXED)` is pinned to a
  constants; a library/encoding change fails the build (ADR-0084 §2).
- **Ed25519 sign/verify parity** — `signCredential`/`verifyCredential` round-trip; tamper
  and wrong-key are rejected. The code is pure JS (no `Buffer`/Node builtins), so the
  *same* module signs server-side and verifies in `@rocky/mob` — RN parity is by
  construction via `@noble/curves` (a real RN run is a later CI step, not a logic gap).
- **On-document QR unblocked** — the signed QR PNG embeds into a PDF via `@cantoo/pdf-lib`
  as an image XObject (after Typst render, before the PAdES seal). The earlier ADR-0082
  WASM-block is gone (ADR-0084 §7).
- **QR density measured, not assumed** — a full ear-tag credential encodes to **QR version
  13 (69×69 modules, ~326-char base64url)**. Scannable, but dense; the §5 barn print-scan
  at actual tag size remains the manual gate before rollout. Samples emitted to
  `/tmp/rocky-sample-ear-tag-qr.png` and `/tmp/rocky-sample-passport-with-qr.pdf`.
- **Trust-model decisions recorded** — algorithm support (Ed25519 vs P-256 if the HSM
  SKU lacks Ed25519), key-rotation grace, and the cert-revocation vs credential-status-list
  vocabulary are all in the Decision sections, not left as follow-ups.

**Phase 1 implemented (2026-07):** the credential module is wired end-to-end.

- `CredentialService` (sibling of `PdfSigner`) added to `@rocky/pdf`; signs with a
  configured Ed25519 key and verifies against the pinned public key (ADR-0084 §1).
- New tRPC procedures `document.credential` (build + sign + QR data URL) and
  `document.verifyCredential` (verify a raw QR string offline) — both authenticated
  (ADR-0084 §8); validators carry NoDrift guillotines for both.
- `mapToCredential` added to the passport / movement / inspection-form templates (the
  minimal `CredentialSeed`: subject + farm + species), so those documents produce
  credentials.
- On-document QR is embedded on the PDF during `DocumentService.generate` (passport /
  movement / inspection-form) via `embedQrPng` (ADR-0084 §7), before the PDF/A-3 wrap +
  PAdES seal.
- The web `/verify` page accepts a raw scanned credential QR string (offline verify)
  alongside the PAdES locator verify.
- A dev Ed25519 key (`apps/api/keys/dev-cred-ed25519.json`, gitignored) is wired at API
  bootstrap via `createConfiguredCredentialKey()`; production sets `ROCKY_CRED_KEY` +
  `ROCKY_CRED_PUBKEY` (no code change). 43 pdf tests pass (incl. credential.service +
  pdf-embed); API + web build green.

**Phase 2 in progress (2026-07):** the ear-tag document type + `EarTagTemplate.mapToCredential`
are implemented — `document.credential({ type: "ear-tag", refId })` issues a self-contained
signed ear-tag credential (subject = tag id; farm + species resolved from the applied
animal). Remaining Phase 2 = the credential **status-list publisher** from passport/movement
revocation states + the "last synced" UI (§4); **GS1 GLN** operator/facility IDs (ADR-0087);
and the **EUDR DDS** linkage (ADR-0063).

**Not yet done (Phase 2–3):** the credential status-list publisher from passport/movement
revocation states + the "last synced" UI (§4); **GS1 GLN** operator/facility IDs (ADR-0087);
the **EUDR DDS** linkage (ADR-0063) that emits/references the signed QR; and the HSM
bulk-throughput measurement (§6).

## Related ADRs

- **ADR-0082** — PDF/A-3 hybrid + PAdES signing (the online seal this credential complements).
- **ADR-0009** — Document generation framework (YAML/XML stable API).
- **ADR-0029** — Archive / retention (the seal's storage home).
- **ADR-0033** — ADR house standard (this document conforms).
- **ADR-0052** — Documentation taxonomy.
- **WO-050** — PDF/A rendering + cryptographic seal (this ADR extends it to offline QR).
- **passport / movement / ear-tag domains** — revocation sources + signing targets.
