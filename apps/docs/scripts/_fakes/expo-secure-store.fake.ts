// In-memory stand-in for `expo-secure-store` (offline doctrine test only).
// Mirrors the async key/value API `device-id.ts` relies on, backed by a JS Map.

// State lives on globalThis so every instance of this fake module shares ONE
// store (tsx resolves the test-file import and the redirected `device-id.ts`
// import to separate module instances). Reset clears it in place.
declare global {
  // eslint-disable-next-line no-var
  var __fakeSecureStore: Map<string, string>;
}
globalThis.__fakeSecureStore ??= new Map<string, string>();
const store: Map<string, string> = globalThis.__fakeSecureStore;

/** Clears the store. Called in `beforeEach` so functional tests stay isolated. */
export function __resetSecureStore(): void {
  globalThis.__fakeSecureStore.clear();
}

/** Exposed for assertions (verifies the device id was persisted). */
export const _store = store;

export async function getItemAsync(key: string): Promise<string | null> {
  return store.has(key) ? (store.get(key) as string) : null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  store.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  store.delete(key);
}
