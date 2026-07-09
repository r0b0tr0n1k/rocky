"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "#lib/trpc";
import { useSession } from "#lib/auth-client";

type PermissionsContextValue = {
  /** Resolved permission strings from the server `rbac.myPermissions` query (authoritative). */
  permissions: readonly string[];
  /** Best-effort roles from the Better Auth session (drift-prone; see ADR-0042). */
  roles: readonly string[];
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * Delivers the current principal's resolved permissions to the client.
 * Source of truth is the server `rbac.myPermissions` query, which reads
 * `principal.permissions` built by PrincipalResolver (ADR-0042/0022) — NOT a
 * client-enriched session. `roles` is best-effort from the session and is
 * intended to be superseded by a `rbac.myRoles` query (drift tracked in WO-089).
 *
 * A permission fetch failure resolves to `[]`, which is fail-CLOSED: gated UI
 * is hidden rather than exposed. Surfacing auth/403 errors to the user uses the
 * established `notifyError` convention at action sites (ADR-0042 §7).
 */
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const trpc = useTRPC();
  const { data: session } = useSession();
  const { data: permissions } = useQuery(trpc.rbac.myPermissions.queryOptions());
  const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];

  return (
    <PermissionsContext.Provider value={{ permissions: permissions ?? [], roles }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions must be used within a PermissionsProvider");
  return ctx;
}

// ── Pure client-side authorization mirrors (ADR-0042 §7) ──
// Extracted to `permissions-core.ts` (pure, node-runnable). Re-exported so
// imports from `#lib/permissions` keep working.
export { clientCan, clientCanAny, clientCanRole } from "./permissions-core.js";
import { clientCan } from "./permissions-core.js";

/** Hook form of `clientCan`. */
export function useCan(permission: string): boolean {
  return clientCan(usePermissions().permissions, permission);
}
