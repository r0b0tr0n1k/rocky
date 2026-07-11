// Deep-link resolver (WO-093, ADR-0043 §5).
//
// Maps an incoming `rocky://…` URL or a push `data.route` to an Expo Router
// path, and routes it. Offline-parity (ADR-0041): if the deep-linked entity
// is not cached, the destination screen shows Skeleton/Empty and the caller
// triggers a background fetch (via the OfflineProvider) before navigating.

import { router } from "expo-router";

/** Resolve a `rocky://…` URL or a bare path to an Expo Router path.
 *  Returns null when the input is not a routable path (caller ignores it). */
export function resolveRoute(route: string | null | undefined): string | null {
  if (!route) return null;
  let path = route;
  if (route.startsWith("rocky://")) path = route.slice("rocky://".length);
  path = path.split("?")[0]!.split("#")[0]!;
  if (!path.startsWith("/")) return null;
  return path;
}

/** Navigate to a resolved route (no-op if unresolvable). */
export function navigateToRoute(route: string | null | undefined): void {
  const resolved = resolveRoute(route);
  if (resolved) router.push(resolved as any); // dynamic deep-link; typedRoutes rejects arbitrary strings
}
