import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@buahmusim/shared'],
  serverExternalPackages: ['better-sqlite3'],
  eslint: {
    // ESLint runs separately in CI; skip during build to avoid flat config issues
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
