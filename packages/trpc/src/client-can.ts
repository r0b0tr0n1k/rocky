/**
 * Pure client-side permission check (ADR-0042).
 *
 * Mirrors `Principal.hasPermission` but operates on a plain permission string list
 * fetched from the `rbac.myPermissions` query. The server stays authoritative
 * (`@Policy` enforcement throws 403 before any mutating procedure runs); this
 * helper only drives UI state (hidden/disabled nav, greyed actions).
 *
 * @param permissions - the current user's permission strings (from PermissionsProvider)
 * @param required - a single permission, or a list that ALL must be held (AND)
 */
export function clientCan(
  permissions: ReadonlyArray<string> | string[] | undefined,
  required: string | string[],
): boolean {
  if (!permissions || permissions.length === 0) return false;
  const needed = Array.isArray(required) ? required : [required];
  return needed.every((p) => permissions.includes(p));
}
