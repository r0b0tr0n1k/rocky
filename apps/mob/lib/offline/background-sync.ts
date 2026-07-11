// Scheduled background sync drain (WO-092). Complements the network-regain
// flush already wired in `OfflineProvider`: this registers a periodic
// `expo-background-fetch` task that invokes the SAME drain logic (download +
// flush). Native-only — `expo-background-fetch` has no web entry, so
// registration is skipped on web (the offline subsystem is native-only, ADR-0036).
//
// NOTE (SDK 56): `expo-background-fetch` is deprecated in favour of
// `expo-background-task`, but remains functional. We keep it (per WO-092) and
// use the v56 API (`BackgroundFetchResult` / `BackgroundFetchStatus` enums; no
// `isRegisteredAsync`). Migration to `expo-background-task` is a future cleanup.

import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";

export const BACKGROUND_SYNC_TASK = "rocky-background-sync";

// The OfflineProvider registers the concrete drain when it mounts. The native
// task runs outside the React tree, so it calls this ref rather than hook state.
let _drain: (() => Promise<void>) | null = null;

export function registerBackgroundDrain(fn: () => Promise<void>): void {
  _drain = fn;
}

export function unregisterBackgroundDrain(): void {
  _drain = null;
}

if (!TaskManager.isTaskDefined(BACKGROUND_SYNC_TASK)) {
  TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
      if (_drain) await _drain();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
      // A failed drain must not crash the background worker; the outbox keeps
      // its failed-state and retries on the next foreground/network run.
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

const IS_WEB = typeof document !== "undefined";

/** Register the periodic background fetch. Idempotent; best-effort. */
export async function registerBackgroundSync(): Promise<void> {
  if (IS_WEB) return;
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }
    // No `isRegisteredAsync` in SDK 56 — re-registering is a safe no-op (or a
    // benign error we swallow). Registration persists across app restarts.
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // seconds; iOS enforces a ~15min floor
    });
  } catch {
    // Already registered or unavailable — best-effort, never crash startup.
  }
}

/** Unregister the periodic background fetch (e.g., on sign-out). */
export async function unregisterBackgroundSync(): Promise<void> {
  if (IS_WEB) return;
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  } catch {
    // Already unregistered / never registered.
  }
}
