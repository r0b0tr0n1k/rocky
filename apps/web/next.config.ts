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
};

export default nextConfig;
