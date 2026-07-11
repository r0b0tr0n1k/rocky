// ── Offline Provider: the PDA's sync brain (WO-082) ──
// Owns: device identity, outbox state, network-gated flush + download, and the
// global onlineManager wiring (NetInfo). The Server is the Master; this is the
// optimistic worker. Conflicts return as `failed` outbox items; the server
// spawns the human-reviewed error_corrections ticket (ADR-0015).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { focusManager, onlineManager } from "@tanstack/react-query";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { trpc } from "@/providers/trpc-provider";
import type { SyncUploadItemType } from "@rocky/validators/api";
import { getDeviceId } from "@/lib/offline/device-id";
import { IS_WEB } from "@/lib/offline/db";
import { registerBackgroundDrain, registerBackgroundSync, unregisterBackgroundDrain } from "@/lib/offline/background-sync";
import {
  dismissQueueItem,
  listQueue,
  markFailed,
  markSynced,
  setStatus,
  storeDownload,
  getMeta,
  type SyncQueueRow,
} from "@/lib/offline/sync-queue";

// Wire onlineManager to NetInfo once (module scope).
let _netinfoWired = false;
if (!_netinfoWired) {
  _netinfoWired = true;
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
  });
}

// Wire focusManager to AppState once (module scope) — refetch stale queries when the
// app returns to the foreground (offline-first UX, ADR-0041).
let _focusWired = false;
if (!_focusWired) {
  _focusWired = true;
  focusManager.setEventListener((setFocused) => {
    const sub = AppState.addEventListener("change", (state) => setFocused(state === "active"));
    return () => sub.remove();
  });
}

type OfflineContextValue = {
  deviceId: string | null;
  items: SyncQueueRow[];
  pendingCount: number;
  isOnline: boolean;
  isBusy: boolean;
  flush: () => Promise<void>;
  download: () => Promise<void>;
  dismiss: (idempotencyKey: string) => void;
  refresh: () => void;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const syncUpload = trpc.sync.syncUpload.useMutation();
  const syncUploadRef = useRef(syncUpload);
  syncUploadRef.current = syncUpload;

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [items, setItems] = useState<SyncQueueRow[]>([]);
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    if (IS_WEB) {
      // Browser is a dev-only UI surface; offline cache is native-only (ADR-0036).
      setItems([]);
      return;
    }
    setItems(listQueue());
  }, []);

  const download = useCallback(async () => {
    if (IS_WEB) return;
    if (!onlineManager.isOnline()) return;
    setBusy(true);
    try {
      const since = getMeta("watermark");
      const res = await utils.sync.syncDownload.fetch({
        since: since ? new Date(since).toISOString() : null,
      });
      storeDownload(res);
    } catch {
      // Download is best-effort; do not crash the worker on a transient error.
    } finally {
      setBusy(false);
      refresh();
    }
  }, [utils, refresh]);

  const flush = useCallback(async () => {
    if (IS_WEB) return;
    if (!onlineManager.isOnline()) return;
    const q = listQueue("pending");
    if (q.length === 0) return;
    setBusy(true);
    q.forEach((i) => setStatus(i.idempotency_key, "syncing"));
    const records = q.map((i) => ({
      idempotencyKey: i.idempotency_key,
      type: i.type as SyncUploadItemType,
      data: i.payload as Record<string, unknown>,
      baseUpdatedAt: i.base_updated_at ? new Date(i.base_updated_at).toISOString() : null,
    }));
    try {
      const res = await syncUploadRef.current.mutateAsync({ records });
      res.results.forEach((r) => {
        if (r.success) markSynced(r.idempotencyKey);
        else markFailed(r.idempotencyKey, r.error ?? "Sync failed");
      });
    } catch (e) {
      q.forEach((i) =>
        markFailed(i.idempotency_key, e instanceof Error ? e.message : "Network error"),
      );
    } finally {
      setBusy(false);
      refresh();
    }
  }, [refresh]);

  // Heal on reconnect: download (refresh cache) then flush (drain outbox).
  useEffect(() => {
    const unsub = onlineManager.subscribe((o: boolean) => {
      setIsOnline(o);
      if (o) {
        void download();
        void flush();
      }
    });
    return unsub;
  }, [download, flush]);

  // Bootstrap: device id + first sync.
  useEffect(() => {
    let active = true;
    void (async () => {
      const id = await getDeviceId();
      if (active) setDeviceId(id);
    })();
    void download();
    void flush();
    refresh();
    return () => {
      active = false;
    };
  }, [download, flush, refresh]);

  // WO-092: register the background fetch drain. The native task runs outside
  // the React tree, so it invokes the latest drain via a ref. Registration is
  // idempotent and skipped on web (expo-background-fetch has no web entry).
  const drainRef = useRef<() => Promise<void>>(async () => {
    await download();
    await flush();
  });
  drainRef.current = async () => {
    await download();
    await flush();
  };
  useEffect(() => {
    registerBackgroundDrain(() => drainRef.current());
    void registerBackgroundSync();
    return () => unregisterBackgroundDrain();
  }, [download, flush]);

  const value: OfflineContextValue = {
    deviceId,
    items,
    pendingCount: items.filter((i) => i.status === "pending" || i.status === "syncing").length,
    isOnline,
    isBusy: busy,
    flush,
    download,
    dismiss: (k: string) => {
      dismissQueueItem(k);
      refresh();
    },
    refresh,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error("useOffline must be used within an OfflineProvider");
  return ctx;
}
