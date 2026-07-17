import { createContext, useContext, type ReactNode } from "react";
import { useSession } from "@/providers/session-provider";
import { trpc } from "@/providers/trpc-provider";
import { type Permission } from "@rocky/validators/api";

type PermissionsContextValue = {
  permissions: readonly string[];
  roles: readonly string[];
  isLoading: boolean;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * Delivers the current principal's resolved permissions to the mobile client.
 * Mirrors the web PermissionsProvider (ADR-0042/WO-089): the server
 * `rbac.myPermissions` query is authoritative; `roles` is best-effort from
 * the session until a `rbac.myRoles` query lands.
 */
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const { data, isLoading } = trpc.rbac.myPermissions.useQuery();
  const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];

  return (
    <PermissionsContext.Provider value={{ permissions: data?.permissions ?? [], roles, isLoading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions must be used within a PermissionsProvider");
  return ctx;
}

/** Mirror of `Principal.hasPermission`. `required` is a typed catalog literal. */
export function clientCan(permissions: readonly string[], required: Permission): boolean {
  return permissions.includes(required);
}

/** Any-of variant. */
export function clientCanAny(permissions: readonly string[], required: readonly Permission[]): boolean {
  return required.some((p) => permissions.includes(p));
}

/** Role + RuleSet variant for Health (ADR-0045). */
export function clientCanRole(roles: readonly string[], requiredRoles: readonly string[]): boolean {
  return requiredRoles.some((r) => roles.includes(r));
}

/** Hook form of `clientCan`. */
export function useCan(permission: Permission): boolean {
  return clientCan(usePermissions().permissions, permission);
}
