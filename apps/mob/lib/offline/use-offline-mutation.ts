// Write-local-then-enqueue primitive (WO-082).
// Enqueues a domain mutation to the outbox and, if online, immediately drains
// it. The Server re-validates @Policy + RLS and rejects unauthorized/conflicting
// records, spawning a human-reviewed error_corrections ticket (ADR-0015/0036).
// Every domain feature sweep (WO-094/095/096) adopts this for its writes.

import { useCallback } from "react";
import { onlineManager } from "@tanstack/react-query";
import { enqueueMutation } from "@/lib/offline/sync-queue";
import { IS_WEB } from "@/lib/offline/db";
import { useOffline } from "@/providers/offline-provider";

export function useOfflineMutation(type: string) {
  const { deviceId, flush } = useOffline();
  return useCallback(
    async (payload: unknown, baseUpdatedAt?: string | null) => {
      // Browser is a dev-only UI surface; the offline outbox is native-only
      // (ADR-0036). Skip enqueue — the feature's real tRPC mutation still runs.
      if (IS_WEB) return "web-noop";
      if (!deviceId) throw new Error("Offline engine not ready");
      const key = enqueueMutation({ type, payload, baseUpdatedAt, deviceId });
      if (onlineManager.isOnline()) await flush();
      return key;
    },
    [type, deviceId, flush],
  );
}
