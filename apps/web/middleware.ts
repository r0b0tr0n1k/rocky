import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/animals",
  "/movements",
  "/passports",
  "/ear-tags",
  "/health",
  "/inspections",
  "/corrections",
  "/farms",
  "/organizations",
  "/subjects",
  "/devices",
  "/iot",
  "/notifications",
  "/archive",
  "/documents",
  "/rbac",
  "/users",
  "/audit",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  const hasSession = req.cookies.getAll().some((c) => c.name.startsWith("rocky_"));
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/animals/:path*",
    "/movements/:path*",
    "/passports/:path*",
    "/ear-tags/:path*",
    "/health/:path*",
    "/inspections/:path*",
    "/corrections/:path*",
    "/farms/:path*",
    "/organizations/:path*",
    "/subjects/:path*",
    "/devices/:path*",
    "/iot/:path*",
    "/notifications/:path*",
    "/archive/:path*",
    "/documents/:path*",
    "/rbac/:path*",
    "/users/:path*",
    "/audit/:path*",
  ],
};
