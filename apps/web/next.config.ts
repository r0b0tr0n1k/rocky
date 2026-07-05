/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://localhost:3000"],
  turbopack: {
    root: "/home/goce/appz/rocky",
  },
  typescript: {
    // Temporarily ignore type errors until tRPC types are generated
    ignoreBuildErrors: true,
  },

  /**
   * Proxy /trpc requests to the NestJS API.
   *
   * DUAL-PATH ARCHITECTURE:
   *
   *   Browser (client components):
   *     fetch("/trpc/farm.getById")             → Next.js rewrite → http://api:8080/trpc/farm.getById
   *
   *   Server (SSR/RSC):
   *     fetch("http://api:8080/trpc/farm.getById") → direct Docker network call
   *
   * In Docker, the browser CANNOT reach "http://api:8080" (internal network).
   * The Next.js rewrite bridges the gap: browser talks to Next.js (same origin),
   * Next.js forwards to the API container (Docker network).
   *
   * For local dev (non-Docker), API_URL defaults to http://localhost:8080.
   */
  async rewrites() {
    const apiUrl = process.env.API_URL || "http://localhost:8080";
    return [
      {
        source: "/trpc/:path*",
        destination: `${apiUrl}/trpc/:path*`,
      },
    ];
  },
};

export default nextConfig;
