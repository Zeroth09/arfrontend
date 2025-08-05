import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['clsx', 'tailwind-merge'],
  },
};

export default nextConfig;
