import { existsSync } from "node:fs";

// Monorepo root = the directory containing pnpm-workspace.yaml, found by
// walking up from cwd. In the Docker build cwd is /app (the repo root);
// locally it is apps/web (two levels below the root). Deriving it this way
// (instead of cwd.split("/").slice(0,-2)) works in BOTH layouts and avoids
// the empty-string root that broke `next build` in the container.
// No import.meta.url / node:path default imports: those forced Next to emit a
// CJS config that breaks under package.json "type": "module".
function findMonorepoRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (existsSync(`${dir}/pnpm-workspace.yaml`)) return dir;
    const parent = dir.replace(/\/[^/]*$/, "");
    if (parent === dir) return start;
    dir = parent;
  }
}

const monorepoRoot = findMonorepoRoot(process.cwd());

// Security baseline (ADR-0105 / ROCKY-FE-001 F-02): ISO 27001 A.8.23/.26/.28,
// ISO 27034 application security, GDPR Art 32. Pragmatic for the dev/HMR path
// ('unsafe-inline' + 'unsafe-eval' needed by Turbopack HMR); production should
// move to a per-request nonce and drop 'unsafe-eval' (tracked as hardening).
const CONTENT_SECURITY_POLICY = `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws://localhost:3001 wss://localhost:3001 http://localhost:8080 https://localhost:8080; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://localhost:3000"],
  // Workspace packages now ship compiled ESM + .d.ts to their dist/ (exports
  // point at ./dist/*). They are consumed as built JS at runtime; transpile here
  // for the workspace packages that web imports at runtime — the shadcn UI
  // library (@rocky/ui) and the Zod schemas/enums in @rocky/validators).
  // @rocky/database was removed: web never imports it at runtime, so listing it
  // here was a misleading no-op (and it is not a production dependency, so the
  // Docker `--prod` deploy never shipped it anyway).
  transpilePackages: ["@rocky/ui", "@rocky/validators"],
  turbopack: { root: monorepoRoot },
  typescript: { ignoreBuildErrors: true },

  /*
   * GATEWAY REWRITES: Next.js proxies API calls to the NestJS backend.
   *
   * This works across ANY network topology:
   *   - same machine: localhost:8080
   *   - different containers: api:8080 (Docker network)
   *   - different continents: https://api.eu.example.com (public URL)
   *
   * The browser only talks to Next.js. Next.js forwards to the API.
   */
  async rewrites() {
    const apiUrl = process.env.API_URL || "http://localhost:8080";
    return [
      // tRPC procedures
      { source: "/trpc/:path*", destination: `${apiUrl}/trpc/:path*` },
      // better-auth endpoints (sign-in, sign-up, session, etc.)
      { source: "/api/auth/:path*", destination: `${apiUrl}/api/auth/:path*` },
    ];
  },

  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
