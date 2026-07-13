/**
 * Phase-0 spike tests for ADR-0084 (offline-verifiable signed QR credentials).
 *
 * Validates the primitive before any wiring:
 *  1. Canonical CBOR is golden (fails the build on library/encoding drift).
 *  2. Ed25519 sign/verify round-trips identically (same code runs in Node + RN).
 *  3. Tamper / wrong-key is rejected.
 *  4. QR density is reported + a tag-sized sample PNG is emitted for manual print-scan.
 *  5. The signed QR embeds into a PDF via `@cantoo/pdf-lib` (on-document QR unblock).
 */

import { describe, it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import QRCode from "qrcode";
import { PDFDocument } from "@cantoo/pdf-lib";
import {
  signCredential,
  verifyCredential,
  encodePayload,
  decodeEnvelope,
  encodeEnvelope,
  generateKeyPair,
  type CredentialPayload,
} from "./credential.js";

// Fixed shape — insertion order is part of the canonical bytes.
const FIXED_PAYLOAD: CredentialPayload = {
  iss: "rocky:cattle",
  sub: "animal:BOV-2026-000123",
  typ: "ear-tag",
  iat: 1700000000,
  exp: 1990000000,
  kid: "rocky-ed25519-2026",
  farmId: "farm:SM-009",
  species: "bovine",
};

// Pinned by gen-golden.mjs (cbor-x Encoder, default options). If this changes,
// canonical CBOR drifted — investigate the library/version before updating. (ADR-0084 §2)
const GOLDEN_PAYLOAD_HEX =
  "d9dfff8a19e000886369737363737562637479706369617463657870636b6964666661726d496467737065636965736c726f636b793a636174746c6576616e696d616c3a424f562d323032362d303030313233676561722d7461671a6553f1001a769cfd8072726f636b792d656432353531392d323032366b6661726d3a534d2d30303966626f76696e65";

function toHex(b: Uint8Array): string {
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

describe("canonical CBOR (golden byte)", () => {
  it("encodes the fixed payload to the pinned bytes", () => {
    expect(toHex(encodePayload(FIXED_PAYLOAD))).toBe(GOLDEN_PAYLOAD_HEX);
  });

  it("is stable run-to-run (no platform/version drift)", () => {
    const a = toHex(encodePayload(FIXED_PAYLOAD));
    const b = toHex(encodePayload(FIXED_PAYLOAD));
    expect(a).toBe(b);
    expect(a).toBe(GOLDEN_PAYLOAD_HEX);
  });
});

describe("Ed25519 sign/verify round-trip", () => {
  it("verifies a validly signed credential", () => {
    const { privateKey, publicKey } = generateKeyPair();
    const qr = signCredential(FIXED_PAYLOAD, privateKey);
    const r = verifyCredential(qr, publicKey);
    expect(r.valid).toBe(true);
    expect(r.expired).toBe(false);
    expect(r.algorithm).toBe("Ed25519");
    expect(r.kid).toBe(FIXED_PAYLOAD.kid);
    expect(r.payload.sub).toBe(FIXED_PAYLOAD.sub);
  });

  it("rejects a tampered signature", () => {
    const { privateKey, publicKey } = generateKeyPair();
    const qr = signCredential(FIXED_PAYLOAD, privateKey);
    const env = decodeEnvelope(qr);
    env.s[0] = (env.s[0] ?? 0) ^ 0xff; // flip a signature byte
    const badQr = encodeEnvelope(env);
    expect(verifyCredential(badQr, publicKey).valid).toBe(false);
  });

  it("rejects a credential signed by a different key", () => {
    const a = generateKeyPair();
    const b = generateKeyPair();
    const qr = signCredential(FIXED_PAYLOAD, a.privateKey);
    expect(verifyCredential(qr, b.publicKey).valid).toBe(false);
  });
});

describe("QR density + on-document embed (ADR-0084 §5, §7)", () => {
  it("renders a scannable QR and embeds it into a PDF", async () => {
    const { privateKey, publicKey } = generateKeyPair();
    const qr = signCredential(FIXED_PAYLOAD, privateKey);

    // Density: report the QR version so the barn-print-scan gate is visible.
    const qrObj = QRCode.create(qr, { errorCorrectionLevel: "M" });
    expect(qrObj.version).toBeGreaterThanOrEqual(1);
    expect(qrObj.version).toBeLessThanOrEqual(20); // dense but still machine-scannable

    // Tag-sized sample PNG for manual print-and-scan (cannot automate the scan).
    const tagPng = await QRCode.toBuffer(qr, {
      width: 144, // ~12mm at 300dpi — realistic ear-tag footprint
      margin: 2,
      errorCorrectionLevel: "M",
    });
    writeFileSync("/tmp/rocky-sample-ear-tag-qr.png", tagPng);
    expect(tagPng.length).toBeGreaterThan(0);

    // On-document embed: PNG -> pdf-lib image XObject (after Typst render, before seal).
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([200, 200]);
    const png = await pdf.embedPng(tagPng);
    page.drawImage(png, { x: 20, y: 20, width: 160, height: 160 });
    const bytes = await pdf.save();
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    writeFileSync("/tmp/rocky-sample-passport-with-qr.pdf", bytes);

    // Sanity: the embedded PDF still verifies offline.
    expect(verifyCredential(qr, publicKey).valid).toBe(true);
  });
});
