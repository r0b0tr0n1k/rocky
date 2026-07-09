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

/** Mirror of `Principal.hasPermission`. */
export function clientCan(permissions: readonly string[], required: string): boolean {
  return permissions.includes(required);
}

/** Any-of variant. */
export function clientCanAny(permissions: readonly string[], required: readonly string[]): boolean {
  return required.some((p) => permissions.includes(p));
}

/** Role + RuleSet variant for Health (ADR-0045): require any of `requiredRoles`. */
export function clientCanRole(roles: readonly string[], requiredRoles: readonly string[]): boolean {
  return requiredRoles.some((r) => roles.includes(r));
}

/** Hook form of `clientCan`. */
export function useCan(permission: string): boolean {
  return clientCan(usePermissions().permissions, permission);
}
