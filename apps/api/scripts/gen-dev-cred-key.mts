/**
 * Generate the dev Ed25519 credential keypair (ADR-0084).
 *
 * Mirrors the dev P12 flow: a self-signed RSA cert for the PAdES seal, and
 * here a dev Ed25519 keypair for the offline-verifiable signed-QR credential.
 * Output is gitignored (apps/api/keys/). Production reads the real keypair
 * from ROCKY_CRED_KEY / ROCKY_CRED_PUBKEY — no code change needed.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateKeyPair } from "@rocky/pdf";

const keysDir = "/home/goce/appz/rocky/apps/api/keys";
mkdirSync(keysDir, { recursive: true });

const { privateKey, publicKey } = generateKeyPair();
const b64 = (u: Uint8Array) => Buffer.from(u).toString("base64");

const out = join(keysDir, "dev-cred-ed25519.json");
writeFileSync(
  out,
  `${JSON.stringify({ privateKey: b64(privateKey), publicKey: b64(publicKey), kid: "rocky-dev-2026" }, null, 2)}\n`,
);
// eslint-disable-next-line no-console
console.log(`[dev-cred] wrote ${out}`);
