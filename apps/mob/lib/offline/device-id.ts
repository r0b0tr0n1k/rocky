// Stable per-install device identity for the offline outbox (ADR-0036 WO-081 d7).
// Each PDA install gets a unique deviceId; every outbox item carries
// idempotencyKey = deviceId + local uuid so the server can dedupe retries and
// attribute multi-device edits.

import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "rocky_device_id";

let cached: string | null = null;

/** Stable per-install device id (ADR-0036 WO-081 d7). Web-safe: `expo-secure-store`
 *  has no web implementation and the offline outbox is native-only, so on web we
 *  return a placeholder instead of touching the native module. The outbox itself
 *  is gated by `useOfflineMutation` / `IS_WEB` elsewhere. */
export async function getDeviceId(): Promise<string> {
  // Web is a dev-only UI surface (ADR-0036); expo-secure-store is unavailable
  // there, so skip it and return a stable placeholder. Self-contained web check
  // (no `db` import) keeps the offline doc-test's module graph clean.
  if (typeof document !== "undefined") return "web-dev-device";
  if (cached) return cached;
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = "pda_" + uuidv4();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  cached = id;
  return id;
}

function uuidv4(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return (
    hex.slice(0, 4).join("") +
    "-" +
    hex.slice(4, 6).join("") +
    "-" +
    hex.slice(6, 8).join("") +
    "-" +
    hex.slice(8, 10).join("") +
    "-" +
    hex.slice(10, 16).join("")
  );
}
