/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://localhost:3001"],
  turbopack: {
    root: "/home/goce/appz/rocky",
    resolveAlias: {
      "@": ".",
    },
  },
  typescript: {
    // Temporarily ignore build-time type errors for Velite config
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": ".",
    };
    return config;
  },
};

export default nextConfig;
