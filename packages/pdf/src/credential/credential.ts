/**
 * Offline-verifiable signed QR credential (ADR-0084).
 *
 * Sibling of `PdfSigner` (ADR-0082): same trust root (Rocky's signing key), but a
 * *self-contained* payload QR verifiable offline against the pinned public key — no
 * server call. Signing primitive is **Ed25519** via `@noble/curves` (pure JS, runs
 * identically in Node and React Native with no native deps), payload is **canonical
 * CBOR** (RFC 8949 §4.2) via `cbor-x`, framed as base64url.
 *
 * This module is deliberately dependency-light and free of Node builtins (no `Buffer`)
 * so the exact same code signs server-side and verifies in `@rocky/mob`.
 */

import { ed25519 } from "@noble/curves/ed25519.js";
import { Encoder, Decoder } from "cbor-x";

/**
 * Minimal entity facts a gate needs to decide + what the QR signs over. Produced
 * by each document template's `mapToCredential`; the rest of the payload (iat/exp/
 * kid/iss) is filled by `CredentialService`.
 */
export interface CredentialSeed {
  /** Subject — the entity this credential is about (passport id / movement id). */
  sub: string;
  /** Holding farm (for scope checks at the gate). */
  farmId?: string;
  /** Species, e.g. "bovine". Kept for future gate rules. */
  species?: string;
  /** GS1 GLN (ADR-0087) — facility/location identifier for the holding. */
  facilityId?: string;
  /** GS1 GLN (ADR-0087) — operator identifier (keeper / veterinary authority prefix). */
  operatorId?: string;
}

/**
 * The credential is the *self-contained signed payload* QR — verifiable offline
 * against Rocky's pinned public key, unlike the locator QR (ADR-0082) which
 * resolves online. Payload is kept VC-shaped (iss/sub/typ/iat/exp) so a future
 * W3C VC / mDL wrapper is a later addition, not a rewrite.
 */
export interface CredentialPayload {
  /** Issuer — Rocky trust root id, e.g. "rocky:cattle". */
  iss: string;
  /** Subject — the entity this credential is about (animalId / passportId). */
  sub: string;
  /** Credential class: "ear-tag" | "passport" | "movement". */
  typ: string;
  /** Issued-at, unix seconds. */
  iat: number;
  /** Expiry, unix seconds. Long-lived for ear tags; distinct from revocation status. */
  exp: number;
  /** Key id — which signing key produced `s` (drives rotation/grace lookup). */
  kid: string;
  /** Domain fields needed at the gate decision (kept minimal for QR density). */
  farmId?: string;
  species?: string;
  /** GS1 GLN (ADR-0087) — facility/location identifier for the holding. */
  facilityId?: string;
  /** GS1 GLN (ADR-0087) — operator identifier (keeper / veterinary authority prefix). */
  operatorId?: string;
}

/** Wire envelope: payload bytes + Ed25519 signature + key id. */
export interface CredentialEnvelope {
  kid: string;
  /** Canonical CBOR bytes of the payload (what `s` is computed over). */
  p: Uint8Array;
  /** Ed25519 signature (64 bytes) over `p`. */
  s: Uint8Array;
}

export interface CredentialVerifyResult {
  /** Signature valid. Caller still decides expired / revoked. */
  valid: boolean;
  /** `exp` is in the past. */
  expired: boolean;
  kid: string;
  /** Signature algorithm, e.g. "Ed25519" (P-256 fallback per ADR-0084 §1). */
  algorithm: string;
  payload: CredentialPayload;
}

// One shared encoder/decoder. cbor-x preserves object key insertion order and uses
// shortest-form integer encoding, so a fixed-shape payload yields stable bytes. The
// golden-byte test (credential.test.ts) pins that output against library drift.
const encoder = new Encoder();
const decoder = new Decoder();

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Canonical CBOR bytes of a payload (the exact bytes `s` is computed over). */
export function encodePayload(payload: CredentialPayload): Uint8Array {
  return encoder.encode(payload);
}

/** Decode canonical CBOR payload bytes back to a typed payload. */
export function decodePayload(bytes: Uint8Array): CredentialPayload {
  return decoder.decode(bytes) as CredentialPayload;
}

/** Decode a base64url CBOR envelope back to its wire form (testing / inspection). */
export function decodeEnvelope(qr: string): CredentialEnvelope {
  return decoder.decode(b64urlDecode(qr)) as CredentialEnvelope;
}

/** Re-encode a wire envelope to its base64url QR string (testing / inspection). */
export function encodeEnvelope(env: CredentialEnvelope): string {
  return b64urlEncode(encoder.encode(env));
}

/**
 * Sign a credential payload with the Ed25519 private key, returning the
 * base64url-encoded CBOR envelope (the string that goes into the QR code).
 */
export function signCredential(payload: CredentialPayload, privateKey: Uint8Array): string {
  const p = encodePayload(payload);
  const s = ed25519.sign(p, privateKey);
  const env: CredentialEnvelope = { kid: payload.kid, p, s };
  return b64urlEncode(encoder.encode(env));
}

/**
 * Verify a credential QR string against the Ed25519 public key identified by `kid`.
 * Returns signature validity, expiry, and the decoded payload. Callers MUST still
 * check the credential status list (ADR-0084 §4) — `valid` only means the signature
 * is intact, not that the credential is unrevoked.
 */
export function verifyCredential(qr: string, publicKey: Uint8Array): CredentialVerifyResult {
  const env = decoder.decode(b64urlDecode(qr)) as CredentialEnvelope;
  const payload = decodePayload(env.p);
  const sigOk = ed25519.verify(env.s, env.p, publicKey);
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    valid: sigOk,
    expired: payload.exp < nowSec,
    kid: env.kid,
    algorithm: "Ed25519",
    payload,
  };
}

/** Generate an Ed25519 keypair (32-byte secret, 32-byte public). */
export function generateKeyPair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKey, publicKey };
}
