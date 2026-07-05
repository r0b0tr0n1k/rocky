import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_PATHS = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
];

const SESSION_COOKIE = "rocky.session_token";

/**
 * Minimum structural check: a valid better-auth session token looks like
 * `<sessionId>.<signature>` with the signature being a 64-char hex.
 * We require at least 32 chars and a dot to reject obvious junk (e.g. "1").
 *
 * This is NOT a security check — it's a UX redirect. Authoritative auth
 * is enforced by the API backend on every request.
 */
function looksLikeSessionToken(value: string | undefined): boolean {
  if (!value || value.length < 32) return false;
  const dot = value.indexOf(".");
  if (dot === -1) return false;
  return dot > 0 && dot < value.length - 1;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  const isAuthenticated = looksLikeSessionToken(sessionCookie?.value);

  // Redirect unauthenticated users away from protected routes
  const isDashboardRoute =
    pathname === "/" ||
    (!AUTH_PATHS.some((p) => pathname.startsWith(p)) &&
      !pathname.startsWith("/auth"));

  if (isDashboardRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|trpc|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
