import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_PATHS = ["/auth/sign-in", "/auth/sign-up", "/auth/forgot-password"];
// Same default as next.config.ts rewrites (API_URL). Reaches Better Auth's
// get-session endpoint on the NestJS host.
const API_URL = process.env.API_URL ?? "http://localhost:8080";

/**
 * Authoritative session check against the Better Auth host (the Superego at
 * the edge). Replaces the previous structural cookie sniff: a revoked or
 * expired token is now rejected BEFORE the React tree renders -- no flicker
 * of the Imaginary. Authoritative RBAC is still enforced by the API.
 */
async function hasValidSession(request: NextRequest): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { session?: unknown };
    return Boolean(data.session);
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Cheap fast-path: no cookie at all => not authenticated (skip the fetch).
  const sessionCookie = getSessionCookie(request, { cookiePrefix: "rocky" });
  const isAuthenticated = sessionCookie ? await hasValidSession(request) : false;

  // Redirect unauthenticated users away from protected routes
  const isDashboardRoute =
    pathname === "/" || (!AUTH_PATHS.some((p) => pathname.startsWith(p)) && !pathname.startsWith("/auth"));

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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|trpc|.*.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
