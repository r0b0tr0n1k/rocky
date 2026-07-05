/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://localhost:3000"],
  turbopack: { root: "/home/goce/appz/rocky" },
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
};

export default nextConfig;
